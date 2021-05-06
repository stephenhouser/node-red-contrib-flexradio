
const net = require('net');
const events = require('events');
const { StringDecoder } = require('string_decoder');

const flex = require('flexradio');

const CONNECTION_RETRY_TIMEOUT = 5000;

class Radio {
	constructor(descriptor) {
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

		this.isConnected = false;
		this.isConnecting = false;
		this.connection = null;
		this.clientId = null;
		this.streamBuffer = '';

		this.eventEmitter = new events.EventEmitter();
	}

	static fromDiscovery(radio_descriptor) {
		const radio = new Radio(radio_descriptor);
		return radio;
	}

	Connect(guiClientId) {
		console.log('Connect(' + guiClientId + ')');

		this.clientId = guiClientId;
		this._connectToRadio();
	}

	Command(command, completion_handler) {
		
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
		//console.log('_connectToRadio()');
		const radio = this;
		if (!radio.isConnected && !radio.isConnecting) {
			radio.isConnecting = true;
			radio._emit('state', 'connecting');

			radio.connection = net.connect(radio.port, radio.host, function() {
				// Called when connection is complete
				//console.log('on connected');
				radio.isConnected = true;
				radio.isConnecting = false;
				radio._emit('state', 'connected');
				radio._emit('connect');
			});

			radio.connection.on('data', function(data) {
				// Called when data arrives on the socket
				//console.log('on data');
				radio._receiveData(data);
			});

			radio.connection.on('error', function (err) {
				// Called when there is an error on the channel
				console.log('on error');
				radio._emit('error', err);
			});

			radio.connection.on('end', function() {
				// Called when the other end closed the connection
				//console.log('on end');
			});

			radio.connection.on('close', function() {
				// Called as the socket is closed (either end or error)
				// console.log('on close');
				radio.isConnected = false;
				radio._emit('state', 'disconnected');
				radio._emit('close');
			});
		}
	}

	// Receives a "chunk" of data on the TCP/IP stream
	// Accumulates it and passes off individual lines to be handled
	_receiveData(raw_data) {
		// console.log('_receiveData()');
		// console.log(raw_data.toString());
		this.streamBuffer += new StringDecoder('utf8').write(raw_data);

		var idx;
		while ((idx = this.streamBuffer.indexOf('\n')) >= 0) {
			const message = this.streamBuffer.substring(0, idx);
			this.streamBuffer = this.streamBuffer.substring(idx + 1);

			this._receiveMessage(message);
		}
	}

	// Handles a singluar, separated, message line from TCP/IP stream
	_receiveMessage(message) {
		console.log('_receiveMessage(' + message + ')');

		const msg = flex.decode_response(message);
		if (msg.type == 'response') {
			// TODO: correlate with command id
		} 

		this._emit(msg.type, msg);
	}

	// Client subscribe to events
	on(event, handlerFunction) {
		this.eventEmitter.on(event, handlerFunction);
	}

	// Emit an envet
	_emit(event, data) {
		this.eventEmitter.emit(event, data);
	}

}

module.exports = { Radio : Radio };