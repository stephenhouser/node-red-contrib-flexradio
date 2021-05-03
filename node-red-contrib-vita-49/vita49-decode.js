const vita49 = require('vita-49');

// Convert Buffer to ArrayBuffer and back again.
// https://gist.github.com/miguelmota/5b06ae5698877322d0ca
function toArrayBuffer(buffer) {
	return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
}

function toBuffer(byteArray) {
	return Buffer.from(byteArray);
}

module.exports = function(RED) {
	function Vita49DecodeNode(config) {
		RED.nodes.createNode(this, config);
		var node = this;
		node.on('input', function(msg) {
			vita_datagram = vita49.decode(toArrayBuffer(msg.payload))
			if (vita_datagram) {
				msg = {...msg, ...vita_datagram};
				if (config.datatype == 'utf8') {
					msg.payload = toBuffer(vita_datagram.payload).toString();
				} else {
					msg.payload = toBuffer(vita_datagram.payload);
				}
				
				node.send(msg);
				this.status({});
			} else {
				this.status({fill: 'red', shape: 'dot', text: 'invalid datagram'});
			}
		});
	}

	RED.nodes.registerType('vita49-decode', Vita49DecodeNode);
}