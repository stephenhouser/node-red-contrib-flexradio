/* flexradio-message.js - NodeRed node for emitting FlexRadio messages and status
 *
 * 2021/09/09 Stephen Houser, MIT License
 */
module.exports = function(RED) {
	'use strict';

	function FlexRadioMessageNode(config) {
		RED.nodes.createNode(this, config);

		const node = this;
		node.name = config.name;
		node.radio = RED.nodes.getNode(config.radio);
		node.topic = config.topic;
		node.topic_type = config.topic_type;

		// Radio event handlers for handling events FROM radio
		node.radio_event = {};

		const radio = node.radio;
		if (!radio) {
			node.status({ fill: 'red', shape: 'circle', text: 'not configured' });
			return;
		}

		node.radio_event['connecting'] = (msg) => { sendEvent(msg) };
		node.radio_event['connected'] = (msg) => { sendEvent(msg) };
		node.radio_event['disconnected'] = (msg) => { sendEvent(msg) };
		node.radio_event['message']  = (msg) => { sendEvent(msg) };
		node.radio_event['status']  = (msg) => { sendEvent(msg) };

		node.on('close', function(done) {
			// Unsubscribe to radio events from our listeners
			Object.entries(node.radio_event).forEach(function([event, handler]) {
				if (handler) {
					radio.off(event, handler);
				}
			});

			updateNodeStatus('closed');
			clearInterval(node.statusUpdate);
			done();
		});

		function sendEvent(msg)  {
			updateNodeStatus(msg.payload);
			if (radio.matchTopic(node.topic, msg.topic, node.topic_type)) {
				// use spread operator to create a copy of the message
				// otherwise modifications to the message in the flow will
				// propogate back into other nodes we send to.
				node.send({ ...msg });
			}
		}

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
				default:
					node.status({ fill: 'red', shape: 'circle', text: '' });
					break;
			}
		}

		// Update this node's status from the config node, in case we miss events
		updateNodeStatus('starting');
		node.statusUpdate = setInterval(function() {
			updateNodeStatus(radio.connectionState());
		}, 5000);

		// Subscribe to radio events with our listeners
		Object.entries(node.radio_event).forEach(function([event, handler]) {
			if (handler) {
				radio.on(event, handler);
			}
		});
	}

	RED.nodes.registerType('flexradio-message', FlexRadioMessageNode);
};
