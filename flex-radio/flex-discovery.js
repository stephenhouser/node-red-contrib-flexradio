const flex = require('./flexradio.js')

module.exports = function(RED) {
	function FlexDiscoveryDecodeNode(config) {
		RED.nodes.createNode(this, config);
		var node = this;
		node.on('input', function(msg) {
			flex_discovery = flex_discovery_decode(msg.payload)
			if (flex_discovery) {
				//msg = {...msg, ...flex_discovery};

				node.send(msg);
				this.status({});
			} else {
				this.status({fill: 'red', shape: 'dot', text: 'invalid message'});
			}
		});
	}

	RED.nodes.registerType('flex-discovery', FlexDiscoveryDecodeNode);
}