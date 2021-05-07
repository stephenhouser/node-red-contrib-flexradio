const { DiscoveryListener } = require('flexradio/DiscoveryListener');

module.exports = function(RED) {
    "use strict"

    function FlexRadioDiscoveryNode(config) {
        RED.nodes.createNode(this, config);
        
        const node = this;
        node.name = config.name;
        node.port = config.port;
		node.host = '0.0.0.0';

        node.discoveryListener = new DiscoveryListener(node.host, node.port);
        if (node.discoveryListener) {
            const discoveryListener = node.discoveryListener;

            discoveryListener.on('connecting', function() {
				node.log('connecting');
				node.status({fill:'green', shape:'circle', text:'connecting'});
				});

            discoveryListener.on('connected', function() {
				node.log('connected');
				node.status({fill:'green', shape:'circle', text:'connected'});
			});

            discoveryListener.on('listening', function() {
				node.log('listening');
				node.status({fill:'green', shape:'dot', text:'listening'});
            });

            discoveryListener.on('error', function(error) {
				node.log('error');
				node.status({fill:'red', shape:'dot', text:'error'});
            });

			discoveryListener.on('radio', function(radio_data) {
				node.log('discovered radio ' + radio_data);
				node.status({fill:'green', shape:'dot', text:'radio found'});

                const msg = {
                    payload: radio_data
                };

                node.send(msg);
            });

            discoveryListener.on('stopped', function() {
				node.log('stopped');
				node.status({fill:'red', shape:'circle', text:'stopped'});
            });

			node.log('listener at udp4' + node.host + ':' + node.port);
	        node.status({fill:'red', shape:'dot', text:'not connected'});
			discoveryListener.start();
		}

		node.on('close', function(done) {
            node.log('node close: ' + node.host + ':' + node.port);
            if (node.discoveryListener) {
                node.discoveryListener.close();
            }
        });
    }

    RED.nodes.registerType("flexradio-discovery", FlexRadioDiscoveryNode);
}