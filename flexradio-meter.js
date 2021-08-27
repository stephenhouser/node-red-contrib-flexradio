mqp = require('mqtt-pattern');

module.exports = function (RED) {
    function FlexRadioMeterNode(config) {
        RED.nodes.createNode(this, config);

        const node = this;
        node.name = config.name;
        node.radio = RED.nodes.getNode(config.radio);
        node.topic = config.topic;
        // Should we include context with the injected message or just the value
        node.output_mode = config.output_mode;

        if (!node.radio) {  // No config node configured, should not happen
            node.status({ fill: 'red', shape: 'circle', text: 'not configured' });
            return;
        }

        const radio = node.radio;
        radio.on('meter', function (meter) {
            // node.log(JSON.stringify(meter));
            const topic = meterTopic(meter);
            if (!node.topic || mqp.matches(node.topic, topic)) {
                const msg = {
                    topic: meterTopic(meter),
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

        function meterTopic(meter) {
            const source_names = {
                "COD-": "codec",
                "RAD": "radio",
                "SLC": "slice",
                "TX-": "transmitter",
                "AMP": "amplifier",
                "WAVEFORM": "waveform"
            };

            const topic = [];
            if (meter.src in source_names) {
                topic.push(source_names[meter.src]);
            } else {
                topic.push(meter.src);
            }

            topic.push(meter.num);
            topic.push(meter.nam.toLowerCase());
            return topic.join('/');
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

        node.on('close', function(done) {
            // const radio = node.radio;
            // radio.off('meter');
            // radio.off('connecting');
            // radio.off('connected');
            // radio.off('disconnected');    
        });

        updateNodeStatus();
    }

    RED.nodes.registerType("flexradio-meter", FlexRadioMeterNode);
}