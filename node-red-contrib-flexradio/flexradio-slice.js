module.exports = function(RED) {
    function FlexRadioSliceNode(n) {
        RED.nodes.createNode(this, config);
        
        this.name = config.server;
		if (config.mode != 'headless') {
			this.slice = config.slice_name;
		}
    }
    
    RED.nodes.registerType("flexradio-slice", FlexRadioSliceNode);
}