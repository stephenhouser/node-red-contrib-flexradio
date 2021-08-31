
module.exports = function(RED) {
    "use strict"

    function FlexRadioStatusNode(config) {
        RED.nodes.createNode(this, config);
        
        const node = this;
        node.name = config.name;
        node.radio = RED.nodes.getNode(config.radio);
        node.topic = config.topic; //new RegExp('^' + config.topic + '$');
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
        
        radio.on('status', function(status_data) {
            // node.log(JSON.stringify(status_data));
			const topic = extractMessageTopic(status_data);
            const status_msg = {
                topic: topic,
                client: status_data.client,
                payload: status_data[topic]
            };

            node.send(status_msg);
        });

        function extractMessageTopic(message) {
            // remove 'header' fields and find topical fields of message
            const topics = Object.keys(message).filter(function(key) {
                return !(['type', 'client'].includes(key));
            });

            if (topics.length != 1) {
                node.log("ERROR: message from radio has more than one TOPIC!");
                node.log(topics);
            }

            if (topics.length >= 1) {
                return topics[0];
            }

            return null;
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

			// Inject changes in radio state to the flow
            const status_msg = {
                topic: 'connection',
                client: null,
                payload: radio.state
            };

            node.send(status_msg);
        }

        updateNodeStatus();
    }

    RED.nodes.registerType("flexradio-status", FlexRadioStatusNode);
}