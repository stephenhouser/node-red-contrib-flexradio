
const net = require('net');
const udp = require('dgram');
const EventEmitter = require('events');

const vita49 = require('vita-49');
const flex = require('flexradio');

const CONNECTION_RETRY_TIMEOUT = 5000;

const ConnectionStates = {
	disconnected: 'disconnected',
	connecting: 'connecting',
	connected: 'connected',
	listening: 'listening'
};

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

		this.clientId = null;

		this.connectionState = ConnectionStates.disconnected;
		this.connection = null;

		this.realtimeListenerPort = this.port;
		this.realtimeListenerState = ConnectionStates.disconnected;
		this.realtimeListener = null;

		this.streamBuffer = '';

		this.nextRequestSequenceNumber = 1;
		this.requests = {};

		this.connectedClientCount = 0;
	}

	static fromDiscoveryDescriptor(radio_descriptor) {
		const radio = new Radio(radio_descriptor);
		return radio;
	}

	connect(guiClientId, callback) {
		// console.log('Radio.connect(' + this.host + ':' + this.port + ')');

		this.clientId = guiClientId;
		this._connectToRadio();
		this.connectedClientCount++;
	}

	send(request, callback) {
		// console.log('Radio.send(' + request + ')');
		this._sendRequest(request, callback);
	}

	disconnect() {
		// console.log('Radio.disconnect()');
		this.connectedClientCount--;
		if (this.connectedClientCount <= 0) {
			this._disconnectFromRadio();
		}
	}

	// Connect to radio and setup handlers for TCP/IP data and state changes.
	_connectToRadio() {
		const radio = this;
		if (radio.connectionState == ConnectionStates.disconnected) {
			radio._setConnectionState(ConnectionStates.connecting);

			radio.connection = net.connect(radio.port, radio.host, function() {
				// Called when connection is complete
				radio._startRealtimeListener();
				radio._setConnectionState(ConnectionStates.connected);
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
				radio._stopRealtimeListener();
				radio._setConnectionState(ConnectionStates.disconnected);
			});
		}
	}

	_disconnectFromRadio() {
		const radio = this;

		radio.connection.close();
	}

	_startRealtimeListener() {
		const radio = this;
		if (radio.realtimeListenerState == ConnectionStates.disconnected) {
			if (!radio.realtimeListener) {
				radio.realtimeListener = udp.createSocket({ type: 'udp4', reuseAddr: false});
			}

			const realtimeListener = radio.realtimeListener;

			realtimeListener.on('connect', function() {
				radio._setRealtimeListenerState(ConnectionStates.connected);
			});
			
			realtimeListener.on('listening', function() {
				//emits when socket is ready and listening for datagram msgs
				const listenAddress = realtimeListener.address();
				radio.realtimeListenerPort = listenAddress.port;
				// console.log('realtimListener on udp4: ' + radio.realtimeListenerPort);
				radio._setRealtimeListenerState(ConnectionStates.listening);

				setTimeout(function() {
					radio.send('client udpport ' + radio.realtimeListenerPort);
				}, 1000);
				
			});

			realtimeListener.on('error', function(error) {
				// emits when any error occurs
				// MUST be handled by a listener somewhere or will
				// CRASH the program with an unhandled exception.
				radio.emit('error', error);
			});
	
			realtimeListener.on('message', function(data, info) {
				radio._receiveRealtimeData(data, info);
			});

			realtimeListener.on('close', function(){
				radio._setRealtimeListenerState(ConnectionStates.disconnected);
			});

			radio._setRealtimeListenerState(ConnectionStates.connecting);
			realtimeListener.bind();
		}
	}

	// Receives a "chunk" of data on the TCP/IP stream
	// Accumulates it and passes off individual lines to be handled
	_receiveData(raw_data) {
		const radio = this;

		radio.streamBuffer += raw_data.toString('utf8');

		var idx;
		while ((idx = radio.streamBuffer.indexOf('\n')) >= 0) {
			const response = radio.streamBuffer.substring(0, idx);
			radio.streamBuffer = radio.streamBuffer.substring(idx + 1);

			radio._receiveResponse(response);
		}
	}

	// Handles a singluar, separated, message line from TCP/IP stream
	_receiveResponse(encoded_response) {
		const radio = this;

		// console.log('_receiveResponse(' + encoded_response + ')');
		const response = flex.decode(encoded_response);
		if (response.type == 'response') {
			const request = radio.requests[response.sequence_number];
			if (request && request.callback) {
				request.callback(response);
			}
		} else {
			radio.emit(response.type, response);
		}
	}

	_receiveRealtimeData(data) {
		const radio = this;

		const vita49_message = vita49.decode(data);
		if (vita49_message) {
			const payload = vita49_message.payload.toString('utf8');
			// console.log('receiveRealtimeData: ' + payload);

			// const realtime_data = flex.decode(payload);			
			// if (realtime_data) {
			// 	//this.emit('realtime', realtime_data);
			// }
		}
	}

	_sendRequest(request, callback) {
		const radio = this;

		const sequenceNumber = radio.nextRequestSequenceNumber++;
		radio.requests[sequenceNumber] = {
			sequence_number: sequenceNumber,
			request: request,
			callback: callback
		};

		const encoded_request = flex.encode_request(sequenceNumber, request);
		radio.connection.write(encoded_request);
	}

	_stopRealtimeListener() {
		const radio = this;

		if (radio.realtimeListener && radio.realtimeListenerState != disconnected) {
			radio.realtimeListener.close();
		}
	}

	getConnectionState() {
		const radio = this;

		return radio.connectionState;
	}

	_setConnectionState(state) {
		const radio = this;

		radio.connectionState = state;
		radio.emit(state, 'command');
	}

	_setRealtimeListenerState(state) {
		const radio = this;

		radio.realtimeListenerState = state;
		radio.emit(state, 'realtime');
	}
}

module.exports = { Radio : Radio };