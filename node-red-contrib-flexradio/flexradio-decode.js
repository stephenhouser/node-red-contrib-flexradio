const flex = require('flexradio')

module.exports = function(RED) {
	function FlexDecodeNode(config) {
		RED.nodes.createNode(this, config);

		var node = this;
		node.on('input', function(msg) {
			flex_packet = flex.decode(msg.payload)
			if (flex_packet) {
				msg.payload = flex_packet;
				node.send(msg);

				node.status({});
			} else {
				node.status({fill: 'red', shape: 'dot', text: 'invalid message'});
			}
		});
	}

	RED.nodes.registerType('flexradio-decode', FlexDecodeNode);
}