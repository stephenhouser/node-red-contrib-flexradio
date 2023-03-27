/* flexradio-decode.js - Node-RED node to decode FlexRadio command responses
 *
 * 2021/09/09 Stephen Houser, MIT License
 */
const flex = require('flexradio-js');

module.exports = function(RED) {
	'use strict';

	function FlexRadioDecodeNode(config) {
		RED.nodes.createNode(this, config);
		const node = this;

		node.on('input', function(msg) {
			const flex_msg = flex.decode(msg.payload);
			if (flex_msg) {
				node.status({ fill: 'green', shape: 'dot', text: 'decoded' });
				node.send(flex_msg);
			} else {
				node.status({ fill: 'red', shape: 'dot', text: 'invalid message' });
				node.error('could not decode flexradio message.', msg);
			}
		});
	}

	RED.nodes.registerType('flexradio-decode', FlexRadioDecodeNode);
};
