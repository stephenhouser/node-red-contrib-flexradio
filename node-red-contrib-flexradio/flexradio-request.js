
module.exports = function(RED) {
    function FlexRadioRequestNode(config) {
        RED.nodes.createNode(this, config);
        
        this.radio = RED.nodes.getNode(config.radio);

        if (this.radio) {
            const node = this;

            node.on('input', function(msg_in) {
                node.radio.send(msg_in, function(msg_out) {
                    node.send(msg_out);
                });
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

    RED.nodes.registerType("flexradio-request", FlexRadioRequestNode);
}