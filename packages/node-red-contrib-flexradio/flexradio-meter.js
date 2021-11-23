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

		const radio = node.radio;
		if (!radio) {
			updateNodeStatus('not configured');
			return;
		}

		// Radio event handlers for handling events FROM radio
		node.radio_event = {};
		node.radio_event['connecting'] = (msg) => { updateNodeStatus(msg.payload) };
		node.radio_event['connected'] = (msg) => { updateNodeStatus(msg.payload) };
		node.radio_event['disconnected'] = (msg) => { updateNodeStatus(msg.payload) };

		node.radio_event['meter'] = (msg) => {
			for (const [meter_number, meter] of Object.entries(msg.payload)) {
				const topic = radio.meterTopic(meter, meter_number);
				if (radio.matchTopic(node.topic, topic, node.topic_type)) {
					const meter_msg = {
						topic: topic,
						meter: Number(meter_number),
						payload: node.output_mode == 'value' ? meter.value : meter
					};
	
					node.send(meter_msg);
				};	
			}
		}

		node.on('close', (done) => {
			// Unsubscribe to radio events from our listeners			
			Object.entries(node.radio_event).forEach(([event, handler]) => {
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
		Object.entries(node.radio_event).forEach(([event, handler]) => {
			const radio = node.radio;
			if (handler) {
				radio.on(event, handler)
			}
		});
	}

	RED.nodes.registerType('flexradio-meter', FlexRadioMeterNode);
};
