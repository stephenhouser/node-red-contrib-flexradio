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

		if (!node.radio) {
			node.status({ fill: 'red', shape: 'circle', text: 'not configured' });
			return;
		}

		const radio = node.radio;
		radio.on('connecting', function(connection) {
			updateNodeStatus(connection);
		});

		radio.on('connected', function(connection) {
			updateNodeStatus(connection);
		});

		radio.on('disconnected', function(connection) {
			updateNodeStatus(connection);
		});

		radio.on('daxAudio', function(daxAudio) {
			// node.debug(JSON.stringify(meter));
			const msg = {
				topic: 'daxAudio',
				stream: daxAudio.stream,
				payload: daxAudio.payload
			};

			node.send(msg);
		});

		node.on('close', function(done) {
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

		updateNodeStatus('starting');
		node.statusUpdate = setInterval(function() {
			updateNodeStatus(radio.connectionState());
		}, 5000);
	}

	RED.nodes.registerType('flexradio-daxaudio', FlexRadioDAXAudioNode);
};
