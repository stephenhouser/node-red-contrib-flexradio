
module.exports = function(RED) {
    "use strict"

    function FlexRadioSubscriptionNode(config) {
        RED.nodes.createNode(this, config);
        
        const node = this;
        node.name = config.name;
        node.radio = RED.nodes.getNode(config.radio);
        node.topic = config.topic
        node.topic_filter = config.topic_filter || 'all';
        
        if (!node.radio) {  // No config node configured, should not happen
            node.status({fill:'red', shape:'circle', text:'not configured'});
            return;
        } 

        node.status({fill:'red', shape:'dot', text:'not connected'});

        const radio = node.radio;
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
			const radioName = radio.nickname ? radio.nickname : (radio.host + ':' + radio.port);
            node.log('connected:' + radioName);
            node.status({fill:'green', shape:'dot', text:radioName});
        });

        radio.on('disconnected', function() {
            node.log('disconnected');
            node.status({fill:'red', shape:'dot', text:'not connected'});
        });
    }

    RED.nodes.registerType("flexradio-subscription", FlexRadioSubscriptionNode);
}