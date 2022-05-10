/* flexradio-radio.js - NodeRed configuration node for FlexRadio nodes
 *
 * 2021/09/09 Stephen Houser, MIT License
 */
const { Radio } = require('flexradio-js/Radio');
const { discovery_listener } = require('flexradio-js/DiscoveryListener');

const log_debug = function(msg) { };

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

// Unique ID for use in debugging connections, events, etc.
let node_id = 1;

module.exports = function(RED) {
	'use strict';

	function FlexRadioNode(config) {
		RED.nodes.createNode(this, config);
		const node = this;

		// Assign this object a unique ID that will show in debug messages
		// Makes for easy assocaition of events, etc..
		node.node_id = node_id++;
		log_debug(`flexradio-radio[${node.node_id}].create()`);

		node.name = config.name;
		node.timeoutSeconds = config.timeout || 15;
		node.closing = false;

		node.radio_descriptor = null;
		node.radio = null;

		// For automatic and nickname(discovery) based connection
		discovery_listener().start();

		// Allows any number of listeners to attach. Default is 10
		// which is way too few for many flows. Each outer node needs a
		// number of listeners to do it's job.
		node.setMaxListeners(0);

		node._connect = function(descriptor) {
			log_debug(`flexradio-radio[${node.node_id}]._connect(${descriptor.ip}:${descriptor.port})`);
			node.log('connecting to host=' + descriptor.ip + ' port=' + descriptor.port);
			node.radio = new Radio(descriptor);
			if (node.radio) {
				const radio = node.radio;
				node.radio_descriptor = descriptor;

				// Radio event handlers for handling events FROM radio
				node.radio_event = {};
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

				function sendEvent(msg) {
					const event_type = msg.type;
					// Use msg.type for topic if we don't have an explicit topic
					msg.topic = msg.topic || msg.type;
					// delete msg.type;
					if (event_type !== 'meter') {
						log_debug(`flexradio-radio[${node.node_id}].sendEvent(${msg.topic})`);
					}
					node.emit(event_type, msg);
				}

				node.radio_event['version'] = (msg) => { sendEvent(msg); };
				node.radio_event['handle'] = (msg) => { sendEvent(msg); };
				node.radio_event['message'] = (msg) => { sendEvent(msg); };
				node.radio_event['status'] = (msg) => { sendEvent(msg); };

				node.radio_event['meter'] = (msg) => {
						injectMeterTopics(msg);
						sendEvent(msg);
				};

				// subscribe to stream data
				const streams = [
					'panadapter', 'waterfall', 'opus', 'daxAudio', 'daxReducedBw',
					'daxIq24', 'daxIq48', 'daxIq96', 'daxIq192'
				];
				streams.forEach(function(stream) {
					node.radio_event[stream] = function(msg) {
						msg.topic = `${msg.type}/${msg.stream}`
						node.emit(msg.type, msg);
					};
				});

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
			}
		};

		// Connect dynamically based on node input
		node.connectDynamic = function(config) {
			// TODO: Dynamic Connection...
		};

		// Connect to first discovered radio
		node.connectAutomatic = function(config) {
			const handler = function(discovery) {
				if (!node.closing && !node.radio) {
					node.log('automatic connect to host=' + discovery.payload.ip + ' port=' + discovery.payload.port);
					node._connect(discovery.payload);
					discovery_listener().off('discovery', handler);
				}
			}
			discovery_listener().on('discovery', handler);
		};

		// Connect to discovered radio with configured nickname
		node.connectNickname = function(config) {
			const handler = function(discovery) {
				if (!node.closing && !node.radio && config.nickname === discovery.payload.nickname) {
					node.log('connect to discovered host=' + discovery.payload.ip + ' port=' + discovery.payload.port);
					node._connect(discovery.payload);
					discovery_listener().off('discovery', handler);
				}
			};
			discovery_listener().on('discovery', handler);
		};

		// Connect to radio with host and port
		node.connectManual = function(config) {
			const descriptor = { ip: config.host, port: config.port };
			node.log('connecting to host=' + descriptor.ip + ' port=' + descriptor.port);
			node._connect(descriptor);
		};

		node.connect = function(dynamic_config) {
			if (node.connectionState() === 'disconnected') {
				const connection_config = dynamic_config ? dynamic_config : config;
				node.log('connect mode ' + connection_config.host_mode);
				switch (connection_config.host_mode) {
					case 'dynamic':
						node.connectDynamic(connection_config);
						break;
					case 'automatic':
						node.connectAutomatic(connection_config);
						break;
					case 'discovery':
					case 'nickname':
						node.connectNickname(connection_config);
						break;
					case 'manual':
						node.connectManual(connection_config);
						break;
				}
			}
		};

		node.disconnect = function() {
			if (node.connectionState() === 'connected') {
				const radio = node.radio;
				if (radio) {
					// Unsubscribe to radio events from our listeners
					Object.entries(node.radio_event).forEach(([event, handler]) => {
						if (handler) {
							radio.off(event, handler);
						}
					});

					radio.disconnect();
					node.radio = null;
				}
			}
		}

		node.countListeners = function() {
			var listenerCount = 0;
			Object.entries(node.radio_event).forEach(([event, _]) => {
				listenerCount += node.listenerCount(event);
			});

			return listenerCount;
		}

		node.on('close', function(done) {
			log_debug(`flexradio-radio[${node.node_id}].on.close()`);
			const descriptor = node.radio_descriptor;
			node.log('closing host=' + descriptor.ip + ' port=' + descriptor.port);
			node.closing = true;

			node.disconnect();

			done();
		});

		node.send = function(msg, response_handler) {
			if (!msg) {
				return false;
			}

			if (msg.action) {
				return node.action(msg);				
			}

			if (!msg.payload) {
				return false;
			}

			if (!node.radio || node.radio.getConnectionState() !== 'connected') {
				return false;
			}

			log_debug(`flexradio-radio[${node.node_id}].send(${msg.payload})`);
			const radio = node.radio;
			const requests = Array.isArray(msg.payload) ? msg.payload : [msg.payload];
			while (requests.length) {
				const request = requests.shift();
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
							injectMeterTopics(response);
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

			return true;
		};

		node.action = function(action_msg) {
			switch (action_msg.action) {
				case 'connect':
					if ('radio' in action_msg) {
						node.connect(action_msg.radio);
						return true;
					}
					break;
				case 'disconnect':
					node.disconnect();
					return true;
			}

			return false;
		};

		node.meterTopic = function(meter_msg, meter_number) {
			if (meter_msg.src !== undefined && meter_msg.num !== undefined && meter_msg.nam !== undefined) {
				return `${meter_msg.src}/${meter_msg.num}/${meter_msg.nam}`;
			}

			if (meter_number !== undefined) {
				return `meter/${meter_number}`
			}

			return 'meter/unknown';
		};

		node.matchClient = function(pattern, client) {
			// pattern = all, self, self_radio, radio
			// empty pattern value will match everything			
			if (!pattern || pattern === '' || pattern === 'all') {
				return true;
			}

			const is_radio_message = parseInt(client) === 0;
			const is_own_message = parseInt(client) === parseInt(this.radio.client_handle);
			switch (pattern) {
				case 'self':
					return is_own_message;

				case 'self_radio':
					return is_own_message || is_radio_message;
				
				case 'radio':
					return is_radio_message;
			}

			console.error(`MISCONFIGURED: pattern=[${pattern}], client=[${client}]`)
			return false;
		};

		node.matchTopic = function(pattern, topic, match_type) {
			// empty pattern value will match everything
			if (!pattern || pattern === '') {
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
			const descriptor = node.radio_descriptor;
			if (descriptor) {
				return descriptor.nickname ? descriptor.nickname : (descriptor.ip + ':' + descriptor.port);
			}

			return null;
		};

		node.connectionState = function() {
			return node.radio ? node.radio.getConnectionState() : 'disconnected';
		};

		function injectMeterTopics(msg) {
			for (const [meter_number, meter] of Object.entries(msg.payload)) {
				if (typeof meter === 'object') {
					meter.topic = node.meterTopic(meter, meter_number);
				}
			}
		}

		function updateNodeStatus(data) {
			node.state = node.connectionState();

			log_debug(`flexradio-radio[${node.node_id}].updateNodeStatus(${node.state})`);

			if (node.radio) {
				const connection_msg = {
					topic: ['connection', data].join('/'),
					payload: node.state
				};

				node.log('radio ' + node.state + ' ' + (data || ''));
				node.emit(node.state, connection_msg);
			}
		}

		node.connect();
	}

	RED.nodes.registerType('flexradio-radio', FlexRadioNode);

	RED.httpAdmin.get("/flexradio/discovery", function(req, res) {
		return res
			.status(200)
			.send({
				'radios': discovery_listener().radios
			});
	});
};
