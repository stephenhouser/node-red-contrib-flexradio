const { Radio } = require('flexradio/Radio');

const RECONNECT_TIMEOUT = 15000;

module.exports = function(RED) {
    "use strict";

    function FlexRadioNode(config) {
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
                updateNodeState();
            });

            radio.on('connected', function() {
                updateNodeState();
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
                // don't re-emit errors. They are treated differently by
                // the EventEmitter and will crash if not handled.
                node.log(error);
            });

            radio.on('disconnected', function() {
                updateNodeState();

                node.reconnectTimeout = setTimeout(() => {
                    radio.connect();
                }, RECONNECT_TIMEOUT);
            });

            radio.connect();
            updateNodeState();
        }

        function updateNodeState() {
            if (node.radio) {
                const state = node.radio.getConnectionState();
                node.state = state;
                node.log('radio ' + state);
                node.emit(node.state);
            } else {
                node.state = '';
            }
        }

        node.send = function(msg, response_handler) {
            node.log('send:' + msg.payload);

            if (node.radio) {
                const radio = node.radio;

                radio.send(msg.payload, function(response) {
                    if (response_handler) {
                        response_handler({
                            sequenceNumber: response.sequence_number,
                            statusCode: response.response_code,
                            payload: response.message
                        });
                    }
                });
            }
        };

        node.on('close', function(done) {
            node.log('node close: ' + node.host + ':' + node.port);            
            if (node.reconnectTimeout) {
                clearInterval(node.reconnectTimeout);
            }

            if (node.radio) {
                node.radio.disconnect();
            }
        });
    }

    RED.nodes.registerType("flexradio-radio", FlexRadioNode);
}
