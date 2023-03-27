/* flexradio-discovery.js - Node-RED node for emitting FlexRadio discovery messages
 *
 * 2021/09/09 Stephen Houser, MIT License
 */
const { discovery_listener } = require('flexradio-js/DiscoveryListener');

module.exports = function(RED) {
	'use strict';

	function FlexRadioDiscoveryNode(config) {
		RED.nodes.createNode(this, config);

		const node = this;
		node.name = config.name;
		node.port = config.port;
		node.host = '0.0.0.0';

		node.listener_event = {};

		const discoveryListener = discovery_listener();
		if (discoveryListener) {
			node.status({ fill: 'red', shape: 'dot', text: 'starting...' });

			node.listener_event['state'] = function(state) {
				switch (state) {
					case 'listening':
						node.log('started listening on udp port ' + this.port);
						node.status({ fill: 'green', shape: 'dot', text: 'listening' });
						break;
					case 'stopped':
						node.log('stopped listening on udp port ' + node.port);
						node.status({ fill: 'red', shape: 'circle', text: 'stopped' });
						break;
				}
			}

			node.listener_event['error'] = function(error) {
				node.error(error);
				node.status({ fill: 'red', shape: 'circle', text: 'error' });
			}

			node.listener_event['discovery'] = function(discovery) {
				// node.log('discovered radio ' + radio_data);
				node.status({ fill: 'green', shape: 'dot', text: 'radio found' });
				const msg = {
					topic: discovery.type,
					payload: discovery.payload
				};

				node.send(msg);
			}

			// Subscribe to radio events with our listeners
			Object.entries(node.listener_event).forEach(([event, handler]) => {
				if (handler) {
					discoveryListener.on(event, handler)
				}
			});		

			node.log('start listener at udp4: ' + node.host + ':' + node.port);
		}

		node.on('close', function(done) {
			node.log('stop listnener at udp4: ' + node.host + ':' + node.port);
			Object.entries(node.listener_event).forEach(([event, handler]) => {
				if (handler && discoveryListener) {
					discoveryListener.off(event, handler)
				}
			});

			done();
		});

	}

	RED.nodes.registerType('flexradio-discovery', FlexRadioDiscoveryNode);
};
