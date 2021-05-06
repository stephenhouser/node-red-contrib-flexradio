
module.exports = function(RED) {
    function FlexRadioMeterNode(config) {
        RED.nodes.createNode(this, config);
        
        const node = this;              
        node.radio = RED.nodes.getNode(config.radio);
		node.client_handle = config.client_handle;

        if (!node.radio) {  // No config node configured, should not happen
            node.status({fill:'red', shape:'circle', text:'not configured'});
            return;
        } 

        node.status({fill:'red', shape:'dot', text:'not connected'});

        const radio = node.radio;
        radio.on('meter', function(meter) {
            const msg = {
                handle: meter.handle,
                payload: meter.message
            };

            node.send(msg);
        });

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

    RED.nodes.registerType("flexradio-meter", FlexRadioMeterNode);
}