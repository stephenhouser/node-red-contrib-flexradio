/* vita49-decode.js - NodeRed node to decode FlexRadio VITA-49 datagrams
 *
 * 2021/09/09 Stephen Houser, MIT License
 */
const vita49 = require('vita49-js');

module.exports = function(RED) {
	'use strict';

	function Vita49DecodeNode(config) {
		RED.nodes.createNode(this, config);
		const node = this;

		node.datatype_in = config.datatype_in;
		node.datatype_out = config.datatype_out;

		node.on('input', function(msg) {
			msg_vita = vita49.decode(msg.payload);
			if (msg_vita) {
				msg = { ...msg, ...msg_vita };
				if (msg_vita.payload) {
					switch (node.datatype_out) {
						case 'utf8':
						case 'base64':
							msg.payload = msg_vita.payload.toString(node.datatype_out);
							break;
						case 'buffer':
							msg.payload = Buffer.from(msg_vita.payload);
							break;
						default:
							msg.payload = msg_vita.payload;
					}
				} else {
					msg.payload = '';
				}

				node.send(msg);
				node.status({});
			} else {
				node.status({ fill: 'red', shape: 'dot', text: 'invalid datagram' });
			}
		});
	}

	RED.nodes.registerType('vita49-decode', Vita49DecodeNode);
};
