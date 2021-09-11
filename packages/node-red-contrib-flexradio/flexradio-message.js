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

		if (!node.radio) {
			node.status({ fill: 'red', shape: 'circle', text: 'not configured' });
			return;
		}

		const radio = node.radio;
		radio.on('connecting', function(connection) {
			updateNodeStatus(connection.payload);

			if (radio.matchTopic(node.topic, connection.topic)) {
				node.send(connection);
			}
		});

		radio.on('connected', function(connection) {
			updateNodeStatus(connection.payload);

			if (radio.matchTopic(node.topic, connection.topic)) {
				node.send(connection);
			}
		});

		radio.on('disconnected', function(connection) {
			updateNodeStatus(connection.payload);

			if (radio.matchTopic(node.topic, connection.topic)) {
				node.send(connection);
			}
		});

		radio.on('message', function(message) {
			if (radio.matchTopic(node.topic, message.topic)) {
				node.send(message);
			}
		});

		radio.on('status', function(status) {
			if (radio.matchTopic(node.topic, status.topic)) {
				node.send(status);
			}
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
				default:
					node.status({ fill: 'red', shape: 'circle', text: status });
					break;
			}
		}

		updateNodeStatus('starting');	
		setInterval(function() {
			updateNodeStatus(radio.connectionState());
		}, 5000);
	}

	RED.nodes.registerType('flexradio-message', FlexRadioMessageNode);
};
