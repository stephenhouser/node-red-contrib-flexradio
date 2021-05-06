
module.exports = function(RED) {
    function FlexRadioStatusNode(config) {
        RED.nodes.createNode(this, config);
        
        this.radio = RED.nodes.getNode(config.radio);
		this.client_handle = config.client_handle;

        if (this.radio) {
            const node = this;

            node.radio.on('status', function(status_message) {
                const msg = {
                    handle: status_message.handle,
                    payload: status_message.message
                };
                
				node.send(msg);
			});

            node.radio.on('state', function(state) {
                switch (state) {
                    case 'connecting':
                        node.status({fill: 'green', shape: 'circle', text: state});
                        break;
                    case 'connected':
                        node.status({fill: 'green', shape: 'dot', text: state});
                        break;
                    default:
                        node.status({fill: 'red', shape: 'dot', text: state});
                        break;
                }
            });
        } else {
            // No config node configured
            node.status({fill: 'red', shape: 'dot', text: 'not configured'});
        }
    }

    RED.nodes.registerType("flexradio-status", FlexRadioStatusNode);
}