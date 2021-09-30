/* flexradio-discovery.js - NodeRed node for emitting FlexRadio discovery messages
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

		const discoveryListener = discovery_listener();
		if (discoveryListener) {
			node.status({ fill: 'red', shape: 'dot', text: 'starting...' });

			discoveryListener.on('listening', function() {
				node.log('started listening on udp port ' + this.port);
				node.status({ fill: 'green', shape: 'dot', text: 'listening' });
			});

			discoveryListener.on('error', function(error) {
				node.error(error);
				node.status({ fill: 'red', shape: 'circle', text: 'error' });
			});

			discoveryListener.on('discovery', function(discovery) {
				// node.log('discovered radio ' + radio_data);
				node.status({ fill: 'green', shape: 'dot', text: 'radio found' });
				const msg = {
					topic: discovery.type,
					payload: discovery.payload
				};

				node.send(msg);
			});

			discoveryListener.on('stopped', function() {
				node.log('stopped listening on udp port ' + node.port);
				node.status({ fill: 'red', shape: 'circle', text: 'stopped' });
			});

			node.log('start listener at udp4: ' + node.host + ':' + node.port);
			// discoveryListener.start();
		}

		node.on('close', function(done) {
			node.log('stop listnener at udp4: ' + node.host + ':' + node.port);
			// if (node.discoveryListener) {
			// 	node.discoveryListener.stop();
			// }

			done();
		});
	}

	RED.nodes.registerType('flexradio-discovery', FlexRadioDiscoveryNode);
};
