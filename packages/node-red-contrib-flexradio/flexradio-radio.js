/* flexradio-radio.js - NodeRed configuration node for FlexRadio nodes
 *
 * 2021/09/09 Stephen Houser, MIT License
 */
const { Radio } = require('flexradio-js/Radio');

const MessageTypes = {
	connecting: 'connecting',
	conneced: 'connected',
	disconneced: 'disconnected',
	error: 'error',
	version: 'version',
	handle: 'handle',
	message: 'message',
	status: 'status',
	response: 'response',
	meter: 'meter',
	panadapter: 'panadapter',
	waterfall: 'waterfall',
	opus: 'opus',
	daxReducedBw: 'daxReducedBw',
	daxIq24: 'daxIq24',
	daxIq48: 'daxIq48',
	daxIq96: 'daxIq96',
	daxIq192: 'daxIq192',
	daxAudio: 'daxAudio',
	discovery: 'discovery',
	unknown: 'unknown'
};

module.exports = function(RED) {
	'use strict';

	function FlexRadioNode(config) {
		RED.nodes.createNode(this, config);
		const node = this;

		node.name = config.name;
		node.host = config.host;
		node.port = Number(config.port);
		node.timeoutSeconds = config.timeout || 15;

		console.log("TIMEOUT == " + node.timeoutSeconds);

		node.closing = false;

		// Allows any number of listeners to attach. Default is 10
		// which is way too few for many flows.
		node.setMaxListeners(0);

		// Listeners for the connected radio
		node.radio_event = {};

		node.log('creating host=' + node.host + ' port=' + node.port);
		node.radio = new Radio({ ip: node.host, port: node.port });
		if (node.radio) {
			const radio = node.radio;

			node.radio_event['connecting'] = (msg) => { updateNodeStatus(msg); };
			node.radio_event['connected'] = (msg) => { updateNodeStatus(msg); };
			node.radio_event['disconnected'] = (msg) => {
				updateNodeStatus(msg);

				clearInterval(node.reconnectTimer);
				if (!node.closing) {
					node.reconnectTimer = setTimeout(() => {
						radio.connect();
					}, node.timeoutSeconds * 1000);
				}
			};

			node.radio_event['message'] = (msg) => { node.emit(msg.type, msg); };
			node.radio_event['status'] = (msg) => { node.emit(msg.type, msg); };
			node.radio_event['meter'] = (msg) => { node.emit(msg.type, msg); };
			node.radio_event['panadapter'] = (msg) => { node.emit(msg.type, msg); };
			node.radio_event['waterfall'] = (msg) => { node.emit(msg.type, msg); };

			// don't re-emit errors. They are treated differently by
			// the EventEmitter and will crash if not handled.
			node.radio_event['error'] = (error) => { node.error(error); };

			// Subscribe to radio events with our listeners
			Object.entries(node.radio_event).forEach(([event, handler]) => {
				if (handler) {
					radio.on(event, handler);
				}
			});

			radio.connect();
		};

		node.send = function(msg, response_handler) {
			if (!msg || !msg.payload || !node.radio) {
				return;
			}

			const radio = node.radio;
			const requests = Array.isArray(msg.payload) ? msg.payload : [msg.payload];
			while (requests.length) {
				const request = requests.pop();
				node.debug('send: ' + request);

				// Expand named meters and push sub commands to end of request array
				const subMeterMatch = request.match(/^sub meter (?<meter>[^\d].+)/i);
				if (subMeterMatch && subMeterMatch.groups.meter != 'all') {
					const topic = subMeterMatch.groups.meter;
					for (const [meter_number, meter] of Object.entries(radio.getMeters())) {
						if (node.matchTopic(topic, node.meterTopic(meter), 'mqtt')) {
							node.debug(`send: Translate meter '${topic}' to '${meter_number}'`);
							requests.push('sub meter ' + meter_number);
						}
					}

					continue;
				}

				radio.send(request, function(response) {
					node.debug('response: ' + JSON.stringify(response));

					if (response_handler) {
						// Synthesize meter topic into 'meter' list responses.
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
			}
		};

		node.meterTopic = function(meter) {
			if (meter.src !== undefined && meter.num !== undefined && meter.nam !== undefined) {
				return [meter.src, meter.num, meter.nam].join('/');
			} else {
				return ['meter', meter.num].join('/');
			}
		};

		node.matchTopic = function(pattern, topic, match_type) {
			if (!pattern || pattern === '') {
				// empty pattern value will match everything
				return true;
			}

			switch (match_type) {
				case 're':
					return topic.match(pattern);
				case 'str':
					return pattern === topic;
				default:
				case 'mqtt':
					return matchMQTTTopic(pattern, topic);
			}
		};

		function matchMQTTTopic(pattern, topic) {
			// default value and match all is always true
			if (pattern === '#') {
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
			if (node.radio) {
				const radio = node.radio;
				return radio.nickname ? radio.nickname : (radio.host + ':' + radio.port);
			}

			return null;
		};

		node.connectionState = function() {
			return (node.radio) ? node.radio.getConnectionState() : 'disconnected';
		};

		node.on('close', function(done) {
			node.log('closing host=' + node.host + ' port=' + node.port);

			node.closing = true;
			if (node.radio) {
				const radio = node.radio;
				// Unsubscribe to radio events from our listeners
				Object.entries(node.radio_event).forEach(([event, handler]) => {
					if (handler) {
						radio.off(event, handler);
					}
				});

				radio.disconnect();
				radio = null;
			}

			done();
		});

		function updateNodeStatus(data) {
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
