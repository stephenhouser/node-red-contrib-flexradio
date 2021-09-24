/* vita49-decode.js - NodeRed node to decode FlexRadio VITA-49 datagrams
 *
 * 2021/09/09 Stephen Houser, MIT License
 */
const flex = require('flexradio-js');

module.exports = function(RED) {
	'use strict';

	function Vita49DecodeNode(config) {
		RED.nodes.createNode(this, config);
		const node = this;

		node.on('input', function(msg) {
			const flex_msg = flex.decode_realtime(msg.payload);
			if (flex_msg) {
				node.status({ fill: 'green', shape: 'dot', text: 'decoded' });
				node.send(flex_msg);
			} else {
				node.status({ fill: 'red', shape: 'dot', text: 'invalid datagram' });
			}
		});
	}

	RED.nodes.registerType('vita49-decode', Vita49DecodeNode);
};
