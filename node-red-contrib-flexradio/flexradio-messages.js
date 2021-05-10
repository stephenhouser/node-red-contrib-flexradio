
module.exports = function(RED) {
    "use strict"

    function FlexRadioMessagesNode(config) {
        RED.nodes.createNode(this, config);
        
        const node = this;
        node.name = config.name;
        node.radio = RED.nodes.getNode(config.radio);
        node.outputRadioMessages = config.radio_messages || false;
        node.outputStatusMessages = config.status_messages || false;
        node.clientHandle = config.client_handle;
        
        if (!node.radio) {  // No config node configured, should not happen
            node.status({fill:'red', shape:'circle', text:'not configured'});
            return;
        }

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
        
        radio.on('message', function(message) {
            if (message.type == 'message' && node.outputRadioMessages) {
                const msg = {
                    topic: radio.radioName() + '/' + message.type,
                    message_id: message.message_id,
                    payload: message.message
                };

                node.send(msg);
            }

            if (message.type == 'status' && node.outputStatusMessages) {
                const topic = radio.radioName() + '/' + message.handle + '/' + message.status.topic;
                delete message.status.topic;
                const msg = {
                    topic: topic,
                    payload: message.status
                };

                node.send(msg);
            }
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

    RED.nodes.registerType("flexradio-messages", FlexRadioMessagesNode);
}