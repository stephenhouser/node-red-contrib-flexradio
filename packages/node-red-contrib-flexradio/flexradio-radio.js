const { Radio } = require('flexradio-js/Radio');

const RECONNECT_TIMEOUT = 15000;

module.exports = function(RED) {
    "use strict";

    function FlexRadioNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        node.name = config.name;
        node.host = config.host;
        node.port = Number(config.port);
        node.closing = false;

        if (config.station_mode != 'none') {
            node.station_name = config.station_name;

            if (config.station_mode == 'slice') {
                node.slice = config.slice;
            }
        }

        // Allows any number of listeners to attach. Default is 10
        // which is way too few for many flows.
        node.setMaxListeners(0);

        node.log('creating host=' + node.host + ' port=' + node.port);
        node.radio = new Radio({ ip: node.host, port: node.port });
        if (node.radio) {
            const radio = node.radio;

            radio.on('connecting', function(data) {
                updateNodeState(data);
            });

            radio.on('connected', function(data) {
                updateNodeState(data);
            });

            radio.on('message', function(message) {
                node.debug('message: ' + JSON.stringify(message));
                node.emit('message', message);
            });

            radio.on('status', function(status) {
                node.debug('status: ' + JSON.stringify(status));
                node.emit('status', status);
            });

            radio.on('meter', function(meter) {
                // node.debug('meters: ' + JSON.stringify(meter));
                node.emit('meter', meter);
            });

            radio.on('error', function(error) {
                // don't re-emit errors. They are treated differently by
                // the EventEmitter and will crash if not handled.
                node.error(error);
            });

            radio.on('disconnected', function(data) {
                updateNodeState(data);

                clearInterval(node.reconnectTimeout);
                if (!node.closing) {
                    node.reconnectTimeout = setTimeout(() => {
                        radio.connect();
                    }, RECONNECT_TIMEOUT);
                }
            });

            radio.connect();
            // updateNodeState();
        };

        node.send = function(msg, response_handler) {
            node.debug('send: ' + msg.payload);

            const radio = node.radio;
            if (msg && msg.payload && radio) {
                if (node.subscribeToNamedMeters(msg.payload, response_handler)) {
                    return;
                }

                const requests = Array.isArray(msg.payload) ? msg.payload : [msg.payload];
                requests.forEach(function(request) {
                    radio.send(request, function(response) {
                        if (response_handler) {
                            const response_data = {
                                request: request,
                                sequence_number: response.sequence_number,
                                status_code: response.response_code,
                                payload: response.response
                            };

                            node.debug('response: ' + JSON.stringify(response_data));
                            response_handler(response_data);
                        }
                    });
                });
            }
        };

        node.subscribeToNamedMeters = function(request, response_handler) {
            const node = this;
            const radio = node.radio;
            if (request && !Array.isArray(request)) {
                const subMeterMatch = request.match(/^sub meter (?<meter>[^\d].+)/i);
                if (subMeterMatch && subMeterMatch.groups.meter != 'all') {
                    const subscribeTopic = subMeterMatch.groups.meter;
                    radio.send('meter list', function(response) {
                        const meters = response.response.meter;
                        const sub_request = [];
                        for (const [meter_number, meter] of Object.entries(meters)) {
                            if (node.matchTopic(subscribeTopic, node.meterTopic(meter))) {
                                sub_request.push('sub meter ' + meter_number);
                            }
                        }

                        node.send({ 'payload': sub_request }, response_handler);
                    });

                    return true;
                }
            }

            return false;
        };

        node.meterTopic = function(meter) {
            return [meter.src, meter.num, meter.nam].join('/');
        };

        node.messageTopic = function(message) {
            // remove 'header' fields and find topical fields of message
            const topics = Object.keys(message).filter(function(key) {
                return !(['type', 'client'].includes(key));
            });

            if (topics.length != 1) {
                node.log("ERROR: message from radio has more than one TOPIC!");
                node.log(topics);
            }

            if (topics.length >= 1) {
                return topics[0];
            }

            return null;
        };

        node.matchTopic = function(pattern, topic) {
            // default value and match all is always true
            if (!pattern || pattern === '' || pattern === '#') {
                return true;
            }

            // Remove any actual regex expressions
            const clean_pattern = pattern.replace(/([\[\]\?\(\)\\\\$\^\*\.|])/g, "\\$1");
            // replace + with regex
            const plus_pattern = clean_pattern.replace(/\+/g, "[^/]+");
            // replace # with regex
            const hash_pattern = plus_pattern.replace(/\/#$/, "(\/.*)?");
            // Build regex to test with
            const regex = new RegExp('^' + hash_pattern + '$', 'i');
            return regex.test(topic);
        };

        node.radioName = function() {
            const radio = this.radio;
            return radio.nickname ? radio.nickname : (radio.host + ':' + radio.port);
        };

        node.on('close', function(done) {
            node.log('closing host=' + node.host + ' port=' + node.port);

            node.closing = true;
            if (node.radio) {
                node.radio.disconnect();
            }

            done();
        });

        function updateNodeState(data) {
            if (node.radio) {
                const state = node.radio.getConnectionState();
                node.state = state;

                node.log('radio ' + state + ' ' + (data ? data : ''));
                node.emit(node.state, data);
            } else {
                node.state = '';
            }
        }
    }

    RED.nodes.registerType("flexradio-radio", FlexRadioNode);
};
