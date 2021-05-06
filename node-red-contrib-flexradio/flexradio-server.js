const flex = require('flexradio');

module.exports = function(RED) {
    "use strict";
    var net = require('net');

    var next_command_id = 1;
    var commands = {};

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

        this.is_connecting = false;
        this.is_connected = false;

        this.connected = function() {
            return node.is_connected;
        }

        function send_command(command, response_handler) {
            // C[D]<seq_number>|command<terminator>
            // C             = indicates a command
            // D             = optional D after the C requests verbose debug output for this command execution which is returned in the response
            // <seq_number>  = numeric, up to 32-bits
            // <terminator>  = 0x0D, 0x0A, or 0x0D 0x0A
            const command_id = next_command_id++;
            const command_line = 'C' + command_id + '|' + command.toString() + '\n';

            commands[command_id] = { 
                command: command, 
                complete: false, 
                handler: response_handler
            };

            node.connection.write(command_line);
        }

        function handle_response(command_id, data) {
            // R<seq_number>|<hex_response>|Message[|Debug output]
            // <seq_number>   = numeric, up to 32-bits -- echoed from the command sent from the client
            // <hex response> = ASCII hexadecimal number (32-bit) return value (see table below for possibilities)
            // <message>      = response value for parsing
            // <debug output> = optional debug free-format text to assist in application development.  
            node.log('handle_response(' + command_id + ',' + data + ')');
            const msg = {
                command_id: command_id,
                command: commands[command_id].command,
            };

            if (data.length >= 2) {
                msg.response_code = data[1];
                msg.response = flex.decode_response_code(msg.response_code);
            }

            if (data.length >= 3) {
                msg.payload = data[2];
            }

            if (data.length >= 4) {
                msg.debug = data[3];
            }

            commands[command_id].handler(msg);
        }

        function handle_handle(handle, data) {
            // H<handle>
            // H         = indicates that the handle follows
            // <handle>  = 32-bit hexadecimal handle
        }

        function handle_version(version, data) {
            // V<d.e.a.b>
            // V          = indicates version information
            // <d.e.a.b>  = major version number in decimal '.' minor version number in decimal '.' a '.' b
        }

        function handle_status(handle, data) {
            // S<handle>|<message>
            // <handle>    = the handle of the client that triggered the update (or 0 for a command line/system change)
            // <message>   = status value for parsing
            const msg = {
                client_handle: handle,
                payload: data[1]
            }
            node.emit('status', msg);
        }

        function handle_message(message_id, data) {
            // M<message_num>|<message_text>
            // <message_num>    = 32-bit hexadecimal number where bits 24-25 contain the severity of the message (0=Informational, 1=Warning, 2=Error, 3=Fatal Error)
            // <message_text>   = text to show operator if this message should be displayed
            const msg = {
                message_id: message_id,
                payload: data[1]
            }
            node.emit('message', msg);
        }

        function receive_data(raw_data) {
            const clean_data = raw_data.toString('utf8').replace(/\r?\n|\r/, '');
            node.log('data: ' + clean_data);
            node.emit('data', clean_data);

            const message = clean_data.split('|');
            const message_type = message[0].substring(0, 1);
            const message_id = Number(message[0].substring(1));

            switch (message_type) {
                case 'R':
                    handle_response(message_id, message);
                    break;
                case 'S':
                    handle_status(message_id, message);
                    break;
                case 'M':
                    handle_message(message_id, message);
                    break;
                case 'H':
                    handle_handle(message_id, message);
                    break;
                case 'V':
                    handle_version(message_id, message);
                    break;
                default:
                    break;
            }
        }

        function connect_to_radio() {
            if (!node.is_connected && !node.is_connecting) {
                node.connecting = true;

                node.log('connecting: ' + node.host + ':' + node.port);
                node.emit("state", "connecting");

                node.connection = net.connect(node.port, node.host, function() {
                    node.log('connected: ' + node.host + ':' + node.port);
                    node.emit("state", "connected");

                    node.is_connected = true;
                    node.is_connecting = false;
                });

                node.connection.on('data', function(data) {
                    receive_data(data);
                });

                node.connection.on('error', function (err) {
                    node.log('error:' + err);
                    node.emit("state", err.code);
                });

                node.connection.on('end', function() {
                    node.log('end: ' + node.host + ':' + node.port);
                    node.emit("state", "ended");
                });

                node.connection.on('close', function() {
                    node.log('close: ' + node.host + ':' + node.port);
                    node.emit("state", "closed");

                    node.is_connected = false;
                    node.reconnectTimeout = setTimeout(connect_to_radio, 5000);
                });
            }
        }

        this.send = function(msg, response_handler) {
            if (!node.is_connected) {
                node.log('don\'t send: ' + msg.toString());
                return;
            }

            node.log('send: ' + msg.payload);
            send_command(msg.payload, response_handler);
        };

        this.on('close', function(done) {
            node.log('node close: ' + node.host + ':' + node.port);
            node.emit("state"," ");

            if (reconnectTimeout) {
                clearInterval(this.reconnectTimeout);
            }
            node.is_connected = false;
            node.is_connecting = false;
            node.connection.destroy();
        });
        
        connect_to_radio();
    }

    RED.nodes.registerType("flexradio-server", FlexRadioServerNode);
}
