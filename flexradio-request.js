const { Radio, RadioConnectionStates } = require("flexradio/Radio");

module.exports = function(RED) {
    function FlexRadioRequestNode(config) {
        RED.nodes.createNode(this, config);

        const node = this;
        node.name = config.name;
        node.radio = RED.nodes.getNode(config.radio);
        
        if (!node.radio) {  // No config node configured, should not happen
            node.status({fill:'red', shape:'circle', text:'not configured'});
            return;
        }
        
        node.on('input', function(msg_in) {
            node.radio.send(msg_in, function(msg_out) {
                if (Object.keys(msg_out.payload).length === 0) {
                    msg_out.payload = msg_in.payload;
                }

                node.send(msg_out);
            });
        });

        const radio = node.radio;        
        radio.on('connecting', function() {
            updateNodeStatus();
        });

        radio.on('connected', function() {
            updateNodeStatus();
        });

        radio.on('disconnected', function() {
            updateNodeStatus();
        });

        function updateNodeStatus() {
            switch (radio.state) {
                case 'connecting':
                    node.status({fill:'green', shape:'circle', text:'connecting'});
                    break;
                case 'connected':
                    node.status({fill:'green', shape:'dot', text:radio.radioName()});
                    break;
                case 'disconnected':
                    node.status({fill:'red', shape:'dot', text:'not connected'});
                    break;        
                default:
                    node.status({fill:'red', shape:'circle', text:radio.state});
                    break;
            }
        }

        updateNodeStatus();
    }

    RED.nodes.registerType("flexradio-request", FlexRadioRequestNode);
}