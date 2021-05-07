const vita49 = require('vita-49');

module.exports = function(RED) {
	function Vita49DecodeNode(config) {
		RED.nodes.createNode(this, config);
		var node = this;

		node.datatype_in = config.datatype_in;
		node.datatype_out = config.datatype_out;

		node.on('input', function(msg) {
			msg_vita = vita49.decode(msg.payload)
			if (msg_vita) {
				msg = {...msg, ...msg_vita};
				if (msg_vita.payload) {
					switch (node.datatype_out) {
						case 'utf8':
						case 'base64':
							msg.payload = msg_vita.payload.toString(node.datatype_out)
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
				node.status({fill: 'red', shape: 'dot', text: 'invalid datagram'});
			}
		});
	}

	RED.nodes.registerType('vita49-decode', Vita49DecodeNode);
}