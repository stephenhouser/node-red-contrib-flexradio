/* flexradio-meter.js - NodeRed node for emitting meter data from FlexRadio
 *
 * 2021/09/09 Stephen Houser, MIT License
 */
module.exports = function(RED) {
	'use strict';

	function FlexRadioMeterNode(config) {
		RED.nodes.createNode(this, config);

		const node = this;
		node.name = config.name;
		node.radio = RED.nodes.getNode(config.radio);
		node.topic = config.topic;
		node.topic_type = config.topic_type;
		node.output_mode = config.output_mode;

		node.listeners = {};

		if (!node.radio) {
			node.status({ fill: 'red', shape: 'circle', text: 'not configured' });
			return;
		}

		const radio = node.radio;
		node.listeners['connecting'] = function(connection) {
			updateNodeStatus(connection.payload);
		}

		node.listeners['connected'] = function(connection) {
			updateNodeStatus(connection.payload);
		}

		node.listeners['disconnected'] = function(connection) {
			updateNodeStatus(connection.payload);
		}

		node.listeners['meter'] = function(meters_update) {
			for (const [meter_num, meter] of Object.entries(meters_update.payload)) {
				const topic = radio.meterTopic(meter);
				if (radio.matchTopic(node.topic, topic, node.topic_type)) {
					const msg = {
						topic: topic,
						meter: Number(meter_num),
						payload: node.output_mode == 'value' ? meter.value : meter
					};
	
					node.send(msg);
				};	
			}
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

	RED.nodes.registerType('flexradio-meter', FlexRadioMeterNode);
};
