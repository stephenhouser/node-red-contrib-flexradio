const { Radio, RadioConnectionStates } = require("flexradio-js/Radio");

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
        
        node.on('input', function(msg, send, done) {
            if (Array.isArray(msg.payload)) {
                msg.payload.forEach(function(payload) {
                    sendRequest({ ...msg, 'payload': payload }, send);
                })
            } else {
                sendRequest(msg, send);
            }

            if (done) {
                done();
            }
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

        function sendRequest(msg, send) {
            radio.send(msg, function(response) {
                send(response);
            });
        }

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