
module.exports = function(RED) {
    function FlexRadioMeterNode(config) {
        RED.nodes.createNode(this, config);
        
        const node = this;          
        node.name = config.name;    
        node.radio = RED.nodes.getNode(config.radio);
		node.client_handle = config.client_handle;

        if (!node.radio) {  // No config node configured, should not happen
            node.status({fill:'red', shape:'circle', text:'not configured'});
            return;
        }

        const radio = node.radio;
        radio.on('meter', function(meter) {
            node.log(JSON.stringify(meter));

            const msg = {
                topic: 'meter/' + meter.nam,
                payload: meter
            };

            node.send(msg);
        });

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

    RED.nodes.registerType("flexradio-meter", FlexRadioMeterNode);
}