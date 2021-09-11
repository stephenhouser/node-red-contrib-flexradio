/* flexradio-radio.js - NodeRed configuration node for FlexRadio nodes
 *
 * 2021/09/09 Stephen Houser, MIT License
 */
const { Radio } = require('flexradio-js/Radio');

// TODO: Make RECONNECT_TIMEOUT a configuration parameter for the node
const RECONNECT_TIMEOUT = 15000;

module.exports = function(RED) {
	'use strict';

	function FlexRadioNode(config) {
		RED.nodes.createNode(this, config);
		const node = this;

		node.name = config.name;
		node.host = config.host;
		node.port = Number(config.port);
		node.closing = false;

		// Allows any number of listeners to attach. Default is 10
		// which is way too few for many flows.
		node.setMaxListeners(0);

		node.log('creating host=' + node.host + ' port=' + node.port);
		node.radio = new Radio({ ip: node.host, port: node.port });
		if (node.radio) {
			const radio = node.radio;

			radio.on('connecting', function(data) {
				emitNodeState(data);
			});

			radio.on('connected', function(data) {
				emitNodeState(data);
			});

			radio.on('message', function(message) {
				node.debug('message: ' + JSON.stringify(message));
				const output_msg = {
					topic: message.type,
					message_id: message.message_id,
					payload: message.payload
				};

				node.emit('message', message);
			});

			radio.on('status', function(status) {
				node.debug('status: ' + JSON.stringify(status));
				const output_status = {
					topic: status.topic,
					client: status.client,
					payload: status.payload
				};

				node.emit('status', output_status);
			});

			radio.on('meter', function(meter) {
				// node.debug('meter: ' + JSON.stringify(meter));
				node.emit('meter', meter);
			});

			radio.on('daxAudio', function(daxAudio) {
				// node.log('daxAudio: ' + JSON.stringify(daxAudio));
				node.emit('daxAudio', daxAudio);
			});

			radio.on('error', function(error) {
				// don't re-emit errors. They are treated differently by
				// the EventEmitter and will crash if not handled.
				node.error(error);
			});

			radio.on('disconnected', function(data) {
				emitNodeState(data);

				clearInterval(node.reconnectTimeout);
				if (!node.closing) {
					node.reconnectTimeout = setTimeout(() => {
						radio.connect();
					}, RECONNECT_TIMEOUT);
				}
			});

			radio.connect();
		};

		node.send = function(msg, response_handler) {
			node.debug('send: ' + msg.payload);

			const radio = node.radio;
			if (msg && msg.payload && radio) {
				if (node.subscribeToNamedMeters(msg.payload, response_handler)) {
					return;
				}

				const requests = Array.isArray(msg.payload) ? msg.payload : [msg.payload];
				requests.forEach(function(request) {
					radio.send(request, function(response) {
						node.debug('response: ' + JSON.stringify(response));

						if (response_handler) {
							// Inject the meter topic into the response.
							if (request.match(/meter list/i) && (response.response_code == 0)) {
								for (const [meter_number, meter] of Object.entries(response.payload)) {
									meter.topic = node.meterTopic(meter);
								};
							}

							const response_data = {
								request: request,
								sequence_number: response.sequence_number,
								status_code: response.response_code,
								payload: response.payload
							};

							response_handler(response_data);
						}
					});
				});
			}
		};

		node.subscribeToNamedMeters = function(request, response_handler) {
			const node = this;
			const radio = node.radio;
			if (request && !Array.isArray(request)) {
				const subMeterMatch = request.match(/^sub meter (?<meter>[^\d].+)/i);
				if (subMeterMatch && subMeterMatch.groups.meter != 'all') {
					const subscribeTopic = subMeterMatch.groups.meter;
					radio.send('meter list', function(response) {
						if (('response' in response) && ('meter' in response.response)) {
							const meters = response.response.meter;
							const sub_request = [];
							for (const [meter_number, meter] of Object.entries(meters)) {
								if (node.matchTopic(subscribeTopic, node.meterTopic(meter))) {
									sub_request.push('sub meter ' + meter_number);
								}
							}

							node.send({ payload: sub_request }, response_handler);
						}
					});

					return true;
				}
			}

			return false;
		};

		node.meterTopic = function(meter) {
			return [meter.src, meter.num, meter.nam].join('/');
		};

		node.matchTopic = function(pattern, topic) {
			// default value and match all is always true
			if (!pattern || pattern === '' || pattern === '#') {
				return true;
			}

			// Remove any actual regex expressions
			const clean_pattern = pattern.replace(/([\[\]\?\(\)\\\\$\^\*\.|])/g, '\\$1');
			// replace + with regex
			const plus_pattern = clean_pattern.replace(/\+/g, '[^/]+');
			// replace # with regex
			const hash_pattern = plus_pattern.replace(/\/#$/, '(\/.*)?');
			// Build regex to test with
			const regex = new RegExp('^' + hash_pattern + '$', 'i');
			return regex.test(topic);
		};

		node.radioName = function() {
			const radio = this.radio;
			return radio.nickname ? radio.nickname : (radio.host + ':' + radio.port);
		};

		node.on('close', function(done) {
			node.log('closing host=' + node.host + ' port=' + node.port);

			node.closing = true;
			if (node.radio) {
				node.radio.disconnect();
			}

			done();
		});

		function emitNodeState(data) {
			node.state = '';
			if (node.radio) {
				node.state = node.radio.getConnectionState();
				const connection_msg = {
					topic: ['connection', data].join('/'),
					payload: node.state
				};

				node.log('radio ' + node.state + ' ' + (data || ''));
				node.emit(node.state, connection_msg);
			}
		}
	}

	RED.nodes.registerType('flexradio-radio', FlexRadioNode);
};
