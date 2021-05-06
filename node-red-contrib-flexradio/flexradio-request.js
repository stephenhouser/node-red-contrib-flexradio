
module.exports = function(RED) {
    function FlexRadioRequestNode(config) {
        RED.nodes.createNode(this, config);

        const node = this;
        node.radio = RED.nodes.getNode(config.radio);
        if (!node.radio) {  // No config node configured, should not happen
            node.status({fill:'red', shape:'circle', text:'not configured'});
            return;
        } 
        
        node.status({fill:'red', shape:'dot', text:'not connected'});
        node.on('input', function(msg_in) {
            node.radio.send(msg_in, function(msg_out) {
                node.send(msg_out);
            });
        });

        const radio = node.radio;
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

    RED.nodes.registerType("flexradio-request", FlexRadioRequestNode);
}