/* flexradio-meter.js - NodeRed node for emitting meter data from FlexRadio
 *
 * 2021/09/09 Stephen Houser, MIT License
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

		// Radio event handlers for handling events FROM radio
		node.radio_event = {};
		node.radio_event['connecting'] = (msg) => { updateNodeStatus(msg.payload); };
		node.radio_event['connected'] = (msg) => { updateNodeStatus(msg.payload); };
		node.radio_event['disconnected'] = (msg) => { updateNodeStatus(msg.payload); };

		function sendEvent(msg)  {
			if (radio.matchTopic(node.stream, msg.stream, 'mqtt')) {
				// use spread operator to create a copy of the message
				// otherwise modifications to the message in the flow will
				// propagate back into other nodes we send to.
				node.send({ ...msg});
			}
		}

		if (node.stream_type === 'any' || node.stream_type === 'all') {
			// subscribe to stream data
			const stream_types = [
				'panadapter', 'waterfall', 'opus', 'daxAudio', 'daxReducedBw',
				'daxIq24', 'daxIq48', 'daxIq96', 'daxIq192'
			];
			stream_types.forEach(function(stream_type) {
				node.radio_event[stream_type] = function(msg) { sendEvent(msg) }
			});
		} else {
			node.radio_event[node.stream_type] = function(msg) { sendEvent(msg) }
		}

		node.on('close', (done) => {
			// Unsubscribe to radio events from our listeners
			const radio = node.radio;
			Object.entries(node.radio_event).forEach(([event, handler]) => {
				if (handler) {
					radio.off(event, handler);
				}
			});

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
