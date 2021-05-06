
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

        node.log('outputmessages: ' + node.outputRadioMessages);
        
        if (!node.radio) {  // No config node configured, should not happen
            node.status({fill:'red', shape:'circle', text:'not configured'});
            return;
        } 

        node.status({fill:'red', shape:'dot', text:'not connected'});

        const radio = node.radio;
        if (node.outputRadioMessages) {
            radio.on('message', function(message) {
                const msg = {
                    messageId: message.message_id,
                    payload: message.message
                };

                node.send(msg);
            });
        }

        if (node.outputStatusMessages) {
            radio.on('status', function(message) {
                const msg = {
                    clientHandle: message.handle,
                    payload: message.message
                };

                node.send(msg);
            });
        }

        radio.on('connecting', function() {
            node.log('connecting');
            node.status({fill:'green', shape:'circle', text:'connecting'});
        });

        radio.on('connected', function() {
            node.log('connected');
            const status = radio.nickname || radio.ip + ':' + radio.port || 'connected';
            node.status({fill:'green', shape:'dot', text:status});
        });

        radio.on('disconnected', function() {
            node.log('disconnected');
            node.status({fill:'red', shape:'dot', text:'not connected'});
        });
    }

    RED.nodes.registerType("flexradio-messages", FlexRadioMessagesNode);
}