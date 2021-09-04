
module.exports = function (RED) {
    function FlexRadioMeterNode(config) {
        RED.nodes.createNode(this, config);

        const node = this;
        node.name = config.name;
        node.radio = RED.nodes.getNode(config.radio);
        node.topic = config.topic;
        node.output_mode = config.output_mode;

        if (!node.radio) {  // No config node configured, should not happen
            node.status({ fill: 'red', shape: 'circle', text: 'not configured' });
            return;
        }

        const radio = node.radio;
        radio.on('meter', function (meter) {
            // node.debug(JSON.stringify(meter));
            const topic = extractMeterTopic(meter);
            if (radio.matchTopic(node.topic, topic)) {
                const msg = {
                    topic: topic,
                    payload: node.output_mode == 'value' ? meter.value : meter
                };

                node.send(msg);
            };
        });

        radio.on('connecting', function () {
            updateNodeStatus();
        });

        radio.on('connected', function () {
            updateNodeStatus();
        });

        radio.on('disconnected', function () {
            updateNodeStatus();
        });

        function extractMeterTopic(meter) {
            return [meter.src, meter.num, meter.nam].join('/');
        }

        function updateNodeStatus() {
            switch (radio.state) {
                case 'connecting':
                    node.status({ fill: 'green', shape: 'circle', text: 'connecting' });
                    break;
                case 'connected':
                    node.status({ fill: 'green', shape: 'dot', text: radio.radioName() });
                    break;
                case 'disconnected':
                    node.status({ fill: 'red', shape: 'dot', text: 'not connected' });
                    break;
                default:
                    node.status({ fill: 'red', shape: 'circle', text: radio.state });
                    break;
            }
        }

        updateNodeStatus();
    }

    RED.nodes.registerType("flexradio-meter", FlexRadioMeterNode);
}