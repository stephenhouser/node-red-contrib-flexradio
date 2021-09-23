/* flexradio-radio.js - NodeRed node for sending requests/commands to a FlexRadio
 *
 * 2021/09/09 Stephen Houser, MIT License
 */
module.exports = function(RED) {
	'use strict';

	function FlexRadioRequestNode(config) {
		RED.nodes.createNode(this, config);

		const node = this;
		node.name = config.name;
		node.radio = RED.nodes.getNode(config.radio);

		// Radio event handlers for handling events FROM radio
		node.radio_event = {};

		const radio = node.radio;
		if (!radio) {
			updateNodeStatus('not configured');
			return;
		}

		node.on('input', function(msg, send, done) {
			radio.send(msg, function(response) {
				send(response);
			});

			if (done) {
				done();
			}
		});

		node.radio_event['connecting'] = (msg) => { updateNodeStatus(msg.payload) };
		node.radio_event['connected'] = (msg) => { updateNodeStatus(msg.payload) };
		node.radio_event['disconnected'] = (msg) => { updateNodeStatus(msg.payload) };

		node.on('close', (done) => {
			// Unsubscribe to radio events from our listeners
			const radio = node.radio;
			Object.entries(node.listeners).forEach(([event, handler]) => {
				if (handler) {
					radio.off(event, handler)
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
		Object.entries(node.listeners).forEach(([event, handler]) => {
			if (handler) {
				radio.on(event, handler)
			}
		});
	}

	RED.nodes.registerType('flexradio-request', FlexRadioRequestNode);
};
