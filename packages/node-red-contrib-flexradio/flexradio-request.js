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

		if (!node.radio) {
			node.status({ fill: 'red', shape: 'circle', text: 'not configured' });
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

		const radio = node.radio;
		radio.on('connecting', function(connection) {
			updateNodeStatus(connection.payload);
		});

		radio.on('connected', function(connection) {
			updateNodeStatus(connection.payload);
		});

		radio.on('disconnected', function(connection) {
			updateNodeStatus(connection.payload);
		});

		node.on('close', function(done) {
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
				default:
					node.status({ fill: 'red', shape: 'circle', text: status });
					break;
			}
		}

		updateNodeStatus('starting');
		node.statusUpdate = setInterval(function() {
			updateNodeStatus(radio.connectionState());
		}, 5000);
	}

	RED.nodes.registerType('flexradio-request', FlexRadioRequestNode);
};
