const { Radio } = require('flexradio/Radio');

module.exports = function(RED) {
    "use strict";

    function FlexRadioServerNode(config) {
        RED.nodes.createNode(this, config);
        
        const node = this;
        this.name = config.name;
        this.host = config.host;
        this.port = Number(config.port);

		if (config.station_mode != 'none') {
		    this.station_name = config.station_name;

            if (config.station_mode == 'slice') {
                this.slice = config.slice;
            }
        }

        function connect_to_radio() {
            //node.log('connect_to_radio()');
            node.radio = new Radio({host: node.host, port: node.port});
            const radio = node.radio;

            radio.on('connect', function(connect_data) {
                //node.log('radio connect');
                node.emit('state', 'connected');
            });

            radio.on('handle', function(handle_data) {
                // node.log('radio handle');
                node.emit('handle', handle_data);
            });
    
            radio.on('version', function(version_data) {
                // node.log('radio version');
                node.emit('version', version_data);
            });
    
            radio.on('status', function(status_data) {
                // node.log('radio status');
                node.emit('status', status_data);
            });
    
            radio.on('message', function(message_data) {
                // node.log('radio message');
                node.emit('message', message_data);
            });

            radio.on('error', function(error) {
                // node.log('radio error');
                node.emit('state', 'error');
            });

            radio.on('close', function(connect_data) {
                // node.log('radio close');
                node.emit('state', ' ');
            });

            // node.log('connecting');
            node.emit('state', 'connecting');
            radio.Connect();
        }

        this.send = function(msg, response_handler) {
            // node.log('send:' + msg.payload);

            if (node.radio) {
                node.radio.Command(msg.payload, response_handler);
            }
        };

        this.on('close', function(done) {
            // node.log('node close: ' + node.host + ':' + node.port);
            node.emit('state',' ');

            if (reconnectTimeout) {
                clearInterval(this.reconnectTimeout);
            }
        });
        
        connect_to_radio();
    }

    RED.nodes.registerType("flexradio-server", FlexRadioServerNode);
}
