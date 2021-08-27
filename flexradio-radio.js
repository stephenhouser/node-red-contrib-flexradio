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

            radio.on('connecting', function(data) {
                updateNodeState(data);
            });

            radio.on('connected', function(data) {
                updateNodeState(data);
            });
    
            radio.on('message', function(message) {
                // node.log('received message: ' + JSON.stringify(message));
                node.emit('message', message);                    
            });

            radio.on('status', function(status) {
                // node.log('received status: ' + JSON.stringify(status));
                node.emit('status', status);                    
            });

            radio.on('meter', function(meter) {
                // node.trace('received meters: ' + JSON.stringify(meter));
                node.emit('meter', meter);
            });

            radio.on('error', function(error) {
                // don't re-emit errors. They are treated differently by
                // the EventEmitter and will crash if not handled.
                node.error(error);
            });

            radio.on('disconnected', function(data) {
                updateNodeState(data);

                node.reconnectTimeout = setTimeout(() => {
                    radio.connect();
                }, RECONNECT_TIMEOUT);
            });

            radio.connect();
            updateNodeState();
        }

        function updateNodeState(data) {
            if (node.radio) {
                const state = node.radio.getConnectionState();
                node.state = state;

                node.log('radio ' + state + ' ' + (data ? data : ''));
                node.emit(node.state);
            } else {
                node.state = '';
            }
        }

        node.radioName = function() {
            const node = this;
            const radio = node.radio;
            return radio.nickname ? radio.nickname : (radio.host + ':' + radio.port);
        }

        node.getMeterName = function(meter_index) {
            return this.getMeter(meter_index).nam;
        }

        node.getMeter = function(meter_index) {
            const node = this;
            const radio = node.radio;
            return radio.getMeter(meter_index);
        }

        node.send = function(msg, response_handler) {
            // node.log('send request: ' + msg.payload);
            if (node.radio) {
                const radio = node.radio;
                radio.send(msg.payload, function(response) {
                    if (response_handler) {
                        const response_data = {
                            sequence_number: response.sequence_number,
                            status_code: response.response_code,
                            payload: response.response
                        };

                        // node.log('recevied response: ' + JSON.stringify(response_data));
                        response_handler(response_data);
                    }
                });
            }
        };

        node.on('close', function(done) {
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
