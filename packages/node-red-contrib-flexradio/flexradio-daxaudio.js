/* flexradio-meter.js - NodeRed node for emitting meter data from FlexRadio
 *
 * 2021/09/09 Stephen Houser, MIT License
 */
module.exports = function(RED) {
	'use strict';

	function FlexRadioDAXAudioNode(config) {
		RED.nodes.createNode(this, config);

		const node = this;
		node.name = config.name;
		node.radio = RED.nodes.getNode(config.radio);
		node.topic = config.topic;
		node.output_mode = config.output_mode;

		node.listeners = {};

		if (!node.radio) {
			node.status({ fill: 'red', shape: 'circle', text: 'not configured' });
			return;
		}

		const radio = node.radio;
		node.listeners['connecting'] = function(connection) {
			updateNodeStatus(connection);
		}

		node.listeners['connected'] = function(connection) {
			updateNodeStatus(connection);
		}

		node.listeners['disconnected'] = function(connection) {
			updateNodeStatus(connection);
		});

		node.listeners['daxAudio'] = function(daxAudio) {
			// node.debug(JSON.stringify(meter));
			const msg = {
				topic: 'daxAudio',
				stream: daxAudio.stream,
				payload: daxAudio.payload
			};

			node.send(msg);
		}

		node.on('close', function(done) {
			// Unsubscribe to radio events from our listeners
			const radio = node.radio;
			Object.entries(node.listeners).forEach(function([event, handler]) {
				if (handler) {
					radio.off(event, handler)
				}
			});

			updateNodeStatus('closed');
			clearInterval(node.statusUpdate);
			done();
		});

		function updateNodeStatus(connection) {
			const status = connection.payload;
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

		// Update this node's status from the config node, in case we miss events
		updateNodeStatus('starting');
		node.statusUpdate = setInterval(function() {
			updateNodeStatus(radio.connectionState());
		}, 5000);
		// Subscribe to radio events with our listeners
		Object.entries(node.listeners).forEach(function([event, handler]) {
			if (handler) {
				radio.on(event, handler)
			}
		});
	}

	RED.nodes.registerType('flexradio-daxaudio', FlexRadioDAXAudioNode);
};
