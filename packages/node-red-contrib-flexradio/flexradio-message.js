
module.exports = function(RED) {
    "use strict";

    function FlexRadioMessageNode(config) {
        RED.nodes.createNode(this, config);

        const node = this;
        node.name = config.name;
        node.radio = RED.nodes.getNode(config.radio);
        node.topic = config.topic;

        if (!node.radio) {
            node.status({ fill: 'red', shape: 'circle', text: 'not configured' });
            return;
        }

        const radio = node.radio;
        radio.on('connecting', function(connection) {
            // node.debug(JSON.stringify(connection, null, 2));
            updateNodeStatus(connection);

            if (radio.matchTopic(node.topic, connection.topic)) {
                node.send(connection);
            }
        });

        radio.on('connected', function(connection) {
            // node.debug(JSON.stringify(connection, null, 2));
            updateNodeStatus(connection);

            if (radio.matchTopic(node.topic, connection.topic)) {
                node.send(connection);
            }
        });

        radio.on('disconnected', function(connection) {
            // node.debug(JSON.stringify(connection, null, 2));
            updateNodeStatus(connection);

            if (radio.matchTopic(node.topic, connection.topic)) {
                node.send(connection);
            }
        });

        radio.on('message', function(message) {
            // node.debug(JSON.stringify(message, null, 2));
            if (radio.matchTopic(node.topic, message.topic)) {
                node.send(message);
            }
        });

        radio.on('status', function(status) {
            // node.debug(JSON.stringify(status, null, 2));
            if (radio.matchTopic(node.topic, status.topic)) {
                node.send(status);
            }
        });

        function updateNodeStatus(connection) {
            const status = connection.payload;
            switch (status) {
                case 'connecting':
                    node.status({ fill: 'green', shape: 'circle', text: status });
                    break;
                case 'connected':
                    node.status({ fill: 'green', shape: 'dot', text: radio.radioName() });
                    break;
                case 'disconnected':
                    node.status({ fill: 'red', shape: 'dot', text: status });
                    break;
                default:
                    node.status({ fill: 'red', shape: 'circle', text: status });
                    break;
            }
        }

        updateNodeStatus('starting up');
    }

    RED.nodes.registerType("flexradio-message", FlexRadioMessageNode);
};