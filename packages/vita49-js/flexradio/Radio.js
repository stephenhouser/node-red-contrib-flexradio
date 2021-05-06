
const net = require('net');
const EventEmitter = require('events');
const { StringDecoder } = require('string_decoder');

const flex = require('flexradio');

const CONNECTION_RETRY_TIMEOUT = 5000;

class Radio extends EventEmitter {
	constructor(descriptor) {
		super();
		// {
		// 	discovery_protocol_version: "3.0.0.1",
		// 	model: "FLEX-6600M",
		// 	serial: "0621-1104-6601-1641",
		// 	version: "3.2.31.2837",
		// 	nickname: "FlexRadio",
		// 	callsign: "N1SH",
		// 	ip: "192.168.10.27",
		// 	port: "4992",
		// 	status: "Available",
		// 	max_licensed_version: "v3",
		// 	radio_license_id: "00-1C-2D-05-1A-68",
		// 	requires_additional_license: "0",
		// 	fpc_mac: "00:1C:2D:03:85:6A",
		// 	wan_connected: "1",
		// 	licensed_clients: "2",
		// 	available_clients: "2",
		// 	max_panadapters: "4",
		// 	available_panadapters: "4",
		// 	max_slices: "4",
		// 	available_slices: "4",
		// 	gui_client_handles: "\u0000\u0000\u0000",
		//   }
		for (const [key, value] of Object.entries(descriptor)) {
			this[key] = value;
		}

		// If there is no configured hostname, use ip
		if (!this.host && this.ip) {
			this.host = this.ip;
		}

		this.isConnected = false;
		this.isConnecting = false;
		this.connection = null;
		this.clientId = null;
		this.streamBuffer = '';
	}

	static fromDiscoveryDescriptor(radio_descriptor) {
		const radio = new Radio(radio_descriptor);
		return radio;
	}

	Connect(guiClientId, callback) {
		// console.log('Connect(' + this.host + ':' + this.port + ')');

		this.clientId = guiClientId;
		this._connectToRadio();
	}

	Command(command, callback) {
		
	}

	Disconnect() {
		console.log('Disconnect()');
	}

	RefreshLicenseState() {
		console.log('RefreshLicenseState()');
	}

	MonitorNetworkQuality() {
		console.log('MonitorNetworkQuality()');
	}

	// Connect to radio and setup handlers for TCP/IP data and state changes.
	_connectToRadio() {
		const radio = this;
		if (!radio.isConnected && !radio.isConnecting) {
			radio.isConnecting = true;
			radio.emit('connecting');

			radio.connection = net.connect(radio.port, radio.host, function() {
				// Called when connection is complete
				radio.isConnected = true;
				radio.isConnecting = false;
				radio.emit('connected');
			});

			radio.connection.on('data', function(data) {
				// Called when data arrives on the socket
				radio._receiveData(data);
			});

			radio.connection.on('error', function(error) {
				// Called when there is an error on the channel
				// MUST be handled by a listener somewhere or will
				// CRASH the program with an unhandled exception.
				radio.emit('error', error);
			});

			radio.connection.on('close', function() {
				// Called as the socket is closed (either end or error)
				radio.isConnected = false;
				radio.isConnecting = false;
				radio.emit('disconnected');
			});
		}
	}

	// Receives a "chunk" of data on the TCP/IP stream
	// Accumulates it and passes off individual lines to be handled
	_receiveData(raw_data) {
		const radio = this;

		radio.streamBuffer += new StringDecoder('utf8').write(raw_data);

		var idx;
		while ((idx = radio.streamBuffer.indexOf('\n')) >= 0) {
			const message = radio.streamBuffer.substring(0, idx);
			radio.streamBuffer = radio.streamBuffer.substring(idx + 1);

			radio._receiveMessage(message);
		}
	}

	// Handles a singluar, separated, message line from TCP/IP stream
	_receiveMessage(message) {
		const radio = this;

		console.log('_receiveMessage(' + message + ')');

		const msg = flex.decode_response(message);
		if (msg.type == 'response') {
			// TODO: correlate with command id
		} 

		radio.emit(msg.type, msg);
	}
}

module.exports = { Radio : Radio };