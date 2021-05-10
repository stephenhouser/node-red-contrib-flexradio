
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

        node.status({fill:'red', shape:'dot', text:'not connected'});

        const radio = node.radio;
        if (node.outputRadioMessages) {
            radio.on('message', function(message) {
                console.log("MESSAGE" + message);
                const msg = {
                    message_id: message.message_id,
                    payload: message.message
                };

                node.send(msg);
            });
        }

        if (node.outputStatusMessages) {
            radio.on('status', function(message) {
                const msg = {
                    client_handle: message.handle,
                    payload: message.status
                };

                node.send(msg);
            });
        }

        radio.on('connecting', function() {
            node.log('connecting');
            node.status({fill:'green', shape:'circle', text:'connecting'});
        });

        radio.on('connected', function() {
			const radioName = radio.nickname ? radio.nickname : (radio.host + ':' + radio.port);
            node.log('connected:' + radioName);
            node.status({fill:'green', shape:'dot', text:radioName});
        });

        radio.on('disconnected', function() {
            node.log('disconnected');
            node.status({fill:'red', shape:'dot', text:'not connected'});
        });
    }

    RED.nodes.registerType("flexradio-messages", FlexRadioMessagesNode);
}