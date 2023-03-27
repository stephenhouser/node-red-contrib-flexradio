/* flexradio-stream.js - Node-RED node for emitting stream data from FlexRadio
 *
 * 2021/09/09 Stephen Houser, MIT License
 * Audio -- https://github.com/bartbutenaers/node-red-contrib-wav#more-detailed
 * 		-- https://discourse.nodered.org/t/play-sound-from-usb-microphone/2551
 * 		-- https://discourse.nodered.org/t/how-to-pass-audio-chunks-through-a-node-red-flow/3723
 * 		-- https://community.flexradio.com/discussion/7801905/dax-format-how-to-play-dax-samples-in-c-flexapi
 */
module.exports = function(RED) {
	'use strict';

	function FlexRadioStreamNode(config) {
		RED.nodes.createNode(this, config);

		const node = this;
		node.name = config.name;
		node.radio = RED.nodes.getNode(config.radio);
		node.stream_type = config.stream_type;
		node.stream = config.stream;

		const radio = node.radio;
		if (!radio) {
			updateNodeStatus('not configured');
			return;
		}

		node.on('input', function(msg, send, done) {
			let changed = false;

			if (msg.stream && msg.stream !== node.stream) {
				node.log(`setting node.stream to [${msg.stream}]`);
				node.stream = msg.stream;
				node.stream_type = 'any';
				changed = true;
			}

			if (msg.stream_type && msg.stream_type !== node.stream_type) {
				node.log(`setting node.stream_type to [${msg.stream_type}]`)
				node.stream_type = msg.stream_type;
				changed = true;
			}

			if (changed) {
				unsubscribe();
				subscribe();
			}

			if (done) {
				done();
			}
		});

		// Radio event handlers for handling events FROM radio
		node.radio_event = {};
		node.radio_event['connecting'] = (msg) => { updateNodeStatus(msg.payload); };
		node.radio_event['connected'] = (msg) => { updateNodeStatus(msg.payload); };
		node.radio_event['disconnected'] = (msg) => { updateNodeStatus(msg.payload); };

		node.stream_event = {};
		function sendEvent(msg)  {
			// node.log(`Received ${msg.stream} matching to ${node.stream}`);
			if (!node.stream || node.stream === '' || parseInt(node.stream) === parseInt(msg.stream)) {
				// use spread operator to create a copy of the message
				// otherwise modifications to the message in the flow will
				// propagate back into other nodes we send to.
				node.send({ ...msg});
			}
		}

		function subscribe() {
			node.log(`Subscribe to: ${node.stream_type} stream ${node.stream}.`);

			const radio = node.radio;
			if (node.stream_type === 'any' || node.stream_type === 'all') {
				const stream_types = [
					'panadapter', 'waterfall', 'opus', 'daxAudio', 'daxReducedBw',
					'daxIq24', 'daxIq48', 'daxIq96', 'daxIq192'
				];
				stream_types.forEach(function(stream_type) {
					node.stream_event[stream_type] = function(msg) { sendEvent(msg) }
				});
			} else {
				node.stream_event[node.stream_type] = function(msg) { sendEvent(msg) }
			}	

			Object.entries(node.stream_event).forEach(([event, handler]) => {
				if (handler) {
					radio.on(event, handler);
				}
			});	
		}

		function unsubscribe() {
			node.log(`Unsubscribe from: ${node.stream_type} stream ${node.stream}.`);

			const radio = node.radio;
			Object.entries(node.stream_event).forEach(([event, handler]) => {
				if (handler) {
					radio.off(event, handler);
				}
			});

			node.stream_event = {};
		}

		node.on('close', (done) => {
			// Unsubscribe to radio events from our listeners
			const radio = node.radio;
			Object.entries(node.radio_event).forEach(([event, handler]) => {
				if (handler) {
					radio.off(event, handler);
				}
			});

			unsubscribe();

			updateNodeStatus('closed');
			clearInterval(node.statusUpdate);
			done();
		});

		function updateNodeStatus(status) {
			switch (status) {
				case 'connecting':
					node.status({ fill: 'green', shape: 'circle', text: status });
					break;
				case 'connected':
					node.status({ fill: 'green', shape: 'dot', text: radio.radioName() });
					break;
				case 'disconnected':
					node.status({ fill: 'red', shape: 'dot', text: status });
					break;
				case 'not configured':
					node.status({ fill: 'black', shape: 'circle', text: status });
					break;
			}
		}

		if (node.stream_type && node.stream_type !== 'dynamic') {
			subscribe();
		}

		// Update this node's status from the config node, in case we miss events
		updateNodeStatus('starting');
		node.statusUpdate = setInterval(() => {
			updateNodeStatus(radio.connectionState());
		}, 5000);

		// Subscribe to radio events with our listeners
		Object.entries(node.radio_event).forEach(([event, handler]) => {
			if (handler) {
				radio.on(event, handler);
			}
		});
	}

	RED.nodes.registerType('flexradio-stream', FlexRadioStreamNode);
};
