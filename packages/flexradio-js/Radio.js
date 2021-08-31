
const net = require('net');
const udp = require('dgram');
const EventEmitter = require('events');

const vita49 = require('vita49-js');
const flex = require('flexradio-js');

const CONNECTION_RETRY_TIMEOUT = 5000;

const VITA_METER_STREAM = 0x00000700;
const VITA_FLEX_OUI = 0x1c2d;
const VITA_FLEX_INFORMATION_CLASS = 0x534c;
const VITA_FLEX_METER_CLASS = 0x8002;

const ConnectionStates = {
	disconnected: 'disconnected',
	connecting: 'connecting',
	connected: 'connected',
	listening: 'listening'
};

class Radio extends EventEmitter {
	constructor(descriptor) {
		super();
		
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

		this.meters = {};
	}

	static fromDiscoveryDescriptor(radio_descriptor) {
		const radio = new Radio(radio_descriptor);
		return radio;
	}

	connect(guiClientId, callback) {
		console.log('Radio.connect(' + this.host + ':' + this.port + ')');

		this.clientId = guiClientId;
		this._connectToRadio();
		this.connectedClientCount++;
	}

	send(request, callback) {
		// console.log('Radio.send(' + request + ')');
		this._sendRequest(request, callback);
	}

	disconnect() {
		console.log('Radio.disconnect()');

		this.connectedClientCount--;
		if (this.connectedClientCount <= 0) {
			this._disconnectFromRadio();
		}
	}

	// Connect to radio and setup handlers for TCP/IP data and state changes.
	_connectToRadio() {
		const radio = this;

		console.log('Radio::_connectToRadio():');
		// console.log('\tdata=' + radio.listenerCount('data'));
		// console.log('\terror=' + radio.listenerCount('error'));
		// console.log('\tclose=' + radio.listenerCount('close'));

		if (radio.connectionState == ConnectionStates.disconnected) {
			radio._setConnectionState(ConnectionStates.connecting);

			radio.connection = net.connect(radio.port, radio.host, function () {
				// Called when connection is complete
				console.log('Radio::connection.on(\'connect\')');
				radio._setConnectionState(ConnectionStates.connected);
				radio._startRealtimeListener();
				radio._updateMeterList();
			});

			radio.handle_data = function (data) {
				// Called when data arrives on the socket
				radio._receiveData(data);
			};
			radio.connection.on('data', radio.handle_data);

			radio.handle_error = function (error) {
				// Called when there is an error on the channel
				// MUST be handled by a listener somewhere or will
				// CRASH the program with an unhandled exception.
				console.log('Radio::connection.on(\'error\')');
				radio.emit('error', error);
			};
			radio.connection.on('error', radio.handle_error);

			radio.handle_close = function () {
				// Called as the socket is closed (either end or error)
				console.log('Radio::connection.on(\'close\')');
				radio._stopRealtimeListener();
				radio._setConnectionState(ConnectionStates.disconnected);
			};
			radio.connection.on('close', radio.handle_close);
		}
	}

	_disconnectFromRadio() {
		const radio = this;
		console.log('Radio::_disconnectFromRadio()');

		radio.connection.close();
		radio.connection.off('data', radio.handle_data);
		radio.connection.off('error', radio.handle_error);
		radio.connection.off('close', radio.handle_close);
		radio.connectionState == ConnectionStates.disconnected;
		radio.connection = null;
	}

	_startRealtimeListener() {
		const radio = this;

		console.log('Radio::_startRealtimeListener():');
		if (radio.realtimeListenerState == ConnectionStates.disconnected) {
			if (!radio.realtimeListener) {
				radio.realtimeListener = udp.createSocket({ type: 'udp4', reuseAddr: false });
			}

			const realtimeListener = radio.realtimeListener;

			radio.handle_realtime_connect = function () {
				console.log('Radio::realtimeListener.on(\'connect\')');
				radio._setRealtimeListenerState(ConnectionStates.connected);
			};
			realtimeListener.on('connect', radio.handle_realtime_connect);

			radio.handle_realtime_listening = function () {
				//emits when socket is ready and listening for datagram msgs
				console.log('Radio::realtimeListener.on(\'listening\')');
				const listenAddress = realtimeListener.address();
				radio.realtimeListenerPort = listenAddress.port;
				// console.log('realtimListener on udp4: ' + radio.realtimeListenerPort);
				radio._setRealtimeListenerState(ConnectionStates.listening);

				setTimeout(function () {
					radio.send('client udpport ' + radio.realtimeListenerPort);
				}, 1000);
			};
			realtimeListener.on('listening', radio.handle_realtime_listening);

			radio.handle_realtime_error = function (error) {
				// emits when any error occurs
				// MUST be handled by a listener somewhere or will
				// CRASH the program with an unhandled exception.
				console.log('Radio::realtimeListener.on(\'error\')');
				radio.emit('error', error);
			};
			realtimeListener.on('error', radio.handle_realtime_error);

			radio.handle_realtime_message = function (data, info) {
				radio._receiveRealtimeData(data, info);
			};
			realtimeListener.on('message', radio.handle_realtime_message);

			radio.handle_realtime_close = function () {
				console.log('Radio::realtimeListener.on(\'close\')');
				radio._setRealtimeListenerState(ConnectionStates.disconnected);
			};
			realtimeListener.on('close', radio.handle_realtime_close);

			radio._setRealtimeListenerState(ConnectionStates.connecting);
			realtimeListener.bind();
		}
	}

	// Receives a "chunk" of data on the TCP/IP stream
	// Accumulates it and passes off individual lines to be handled
	_receiveData(raw_data) {
		const radio = this;

		// console.log('Radio::_receiveData(raw_data):');
		radio.streamBuffer += raw_data.toString('utf8');

		var idx;
		while ((idx = radio.streamBuffer.indexOf('\n')) >= 0) {
			const response = radio.streamBuffer.substring(0, idx);
			radio.streamBuffer = radio.streamBuffer.substring(idx + 1);

			radio._receiveMessage(response);
		}
	}

	// Handles a singluar, separated, message line from TCP/IP stream
	_receiveMessage(encoded_message) {
		const radio = this;

		console.log('_receiveResponse(' + encoded_message + ')');
		const message = flex.decode(encoded_message);
		if (message) {
			if (message.type == 'response') {
				const request = radio.requests[message.sequence_number];
				if (request && request.callback) {
					request.callback(message);
				}
			} else {
				radio.emit(message.type, message);
			}
		}
	}

	_isRealtimeData(message) {
		return message
			&& message.stream_id == VITA_METER_STREAM
			&& message.class.oui == VITA_FLEX_OUI
			&& message.class.information_class == VITA_FLEX_INFORMATION_CLASS
			&& message.class.packet_class == VITA_FLEX_METER_CLASS;
	}

	_receiveRealtimeData(data) {
		const radio = this;

		const vita49_message = vita49.decode(data);
		if (vita49_message) {
			// console.log('receiveRealtimeData: ' + payload);
			// TODO: Expand to panadapter and other data from radio.
			// use message.class.packet_class as the emitted message topic
			// e.g. emit(vita49.decode_packet_class(message.class.packet_class));
			if (this._isRealtimeData(vita49_message)) {
				const meter_data = flex.decode_meter(vita49_message.payload)
				if (meter_data && 'meters' in meter_data) {
					const meters = radio.meters;
					for (const [meter_num, meter_value] of Object.entries(meter_data.meters)) {
						if (meter_num in meters) {
							const meter = meters[meter_num];
							const value = radio._scaleMeterValue(meter, meter_value);
							// Only update and emit when the value changes
							if (value != meter.value) {
								meter.value = value;
								this.emit('meter', meter);
							}
						}
					}
				}
			} else {
				// TODO: Handle receipt of realtime data that is not a meter (e.g. panadapter)
				console.log("Received real-time data that is not a meter. Not implemented!");
				console.log(vita49_message.payload);
			}
		}
	}

	// Divisor values from:
	// https://github.com/K3TZR/xLib6000/blob/master/Sources/xLib6000/Models/Dynamic/Meter.swift
	_scaleMeterValue(meter, value) {
		if ('unit' in meter) {
			const units = meter.unit.toLowerCase();
			switch (units) {
				case 'db':
				case 'dbm':
				case 'dbfs':
				case 'swr':
					// Converted to VitaDB value ( converted_value = ((int32)(MeterValue * 128) & 0xFFFF) )
					value = (value << 16) >> 16; // convert uint16 to int16
					return parseFloat(value / 128.0).toFixed(1);

				case 'volts':
				case 'amps':
					// Converted to floating point value ( converted_value = (float) ( MeterValue * 256.0) 
					return parseFloat(value / 256.0).toFixed(1);

				case 'degc':
				case 'degf':
					//  Converted to floating point value ( converted_value = (float) ( MeterValue * 64.0) ) 
					value = (value << 16) >> 16; // convert uint16 to int16
					return parseFloat(value / 64.0).toFixed(1);

				case 'rpm':
				case 'watts':
				case 'percent':
					return value;
			}
		}

		return value;
	}

	_sendRequest(request, callback) {
		const radio = this;

		console.log('_sendRequest(' + request + ')');
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
		console.log('Radio::_stopRealtimeListener()');
		const radio = this;

		if (radio.realtimeListener) {
			radio.realtimeListener.close();
			radio.realtimeListener.off('connect', radio.handle_realtime_close);
			radio.realtimeListener.off('listening', radio.handle_realtime_listening);
			radio.realtimeListener.off('message', radio.handle_realtime_message);
			radio.realtimeListener.off('error', radio.handle_realtime_error);
			radio.realtimeListener.off('close', radio.handle_realtime_close);
			radio.realtimeListenerState == ConnectionStates.disconnected;
			radio.realtimeListener = null;
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

	_updateMeterList() {
		const radio = this;

		radio.send('meter list', function (response) {
			radio.meters = { ...radio.meters, ...response.response.meter };
		});
	}

	getMeter(meter_index) {
		const radio = this;
		if (meter_index in radio.meters) {
			return radio.meters[meter_index]
		}

		return null;
	}
}

module.exports = {
	Radio: Radio,
	RadioConnectionStates: ConnectionStates
};