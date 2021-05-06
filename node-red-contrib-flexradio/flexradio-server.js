const { Radio } = require('flexradio/Radio');

module.exports = function(RED) {
    "use strict";

    function FlexRadioServerNode(config) {
        RED.nodes.createNode(this, config);
        
        const node = this;
        node.name = config.name;
        node.host = config.host;
        node.port = Number(config.port);

		if (config.station_mode != 'none') {
		    node.station_name = config.station_name;

            if (config.station_mode == 'slice') {
                node.slice = config.slice;
            }
        }

        node.radio = new Radio({ip:node.host, port:node.port});
        if (node.radio) {
            const radio = node.radio;

            radio.on('connecting', function() {
                node.log('radio connecting');
                node.emit('connecting');
            });

            radio.on('connected', function() {
                node.log('radio connect');
                node.emit('connected');
            });

            radio.on('handle', function(handle_data) {
                node.log('radio handle');
                node.emit('handle', handle_data);
            });
    
            radio.on('version', function(version_data) {
                node.log('radio version');
                node.emit('version', version_data);
            });
    
            radio.on('status', function(status_data) {
                node.log('radio status');
                node.emit('status', status_data);
            });
    
            radio.on('message', function(message_data) {
                node.log('radio message');
                node.emit('message', message_data);
            });

            radio.on('error', function(error) {
                node.log(error);
                //node.emit('error', error);
            });

            radio.on('disconnected', function() {
                node.log('radio close');
                node.emit('disconnected');                                
                node.reconnectTimeout = setTimeout(() => {
                    radio.Connect();
                }, 15000);
            });
        }

        node.send = function(msg, response_handler) {
            node.log('send:' + msg.payload);

            if (node.radio) {
                node.radio.Command(msg.payload, response_handler);
            }
        };

        node.on('close', function(done) {
            node.log('node close: ' + node.host + ':' + node.port);
            node.emit('state',' ');

            if (node.reconnectTimeout) {
                clearInterval(node.reconnectTimeout);
            }
        });

        node.radio.Connect();
    }

    RED.nodes.registerType("flexradio-server", FlexRadioServerNode);
}
