
const net = require('net');
const udp = require('dgram');
const EventEmitter = require('events');

const vita49 = require('vita49-js');
const flex = require('flexradio-js');

const log_debug = function (msg) { console.log(msg); }
const log_info = function (msg) { console.log(msg); }

const CLIENT_SETUP_COMMAND_DELAY = 1000;

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

		if (!this.host && this.ip) {
			// If there is no configured hostname, use ip
			this.host = this.ip;
		}

		this.connectionState = ConnectionStates.disconnected;
		this.connection = null;

		this.realtimeListenerPort = this.port;
		this.realtimeListenerState = ConnectionStates.disconnected;
		this.realtimeListener = null;

		this.streamBuffer = '';

		this.nextRequestSequenceNumber = 1;
		this.requests = {};

		this.meters = {};
	}

	static fromDiscoveryDescriptor(radio_descriptor) {
		return new Radio(radio_descriptor);
	}

	connect() {
		log_info('Radio.connect(' + this.host + ':' + this.port + ')');
		this._connectToRadio();
	}

	send(request, callback) {
		// log_debug('Radio.send(' + request + ')');		
		this._sendRequest(request, callback);
	}

	disconnect() {
		log_info('Radio.disconnect()');
		this._disconnectFromRadio();
	}

	// Connect to radio and setup handlers for TCP/IP data and state changes.
	_connectToRadio() {
		log_info('Radio::_connectToRadio():');
		if (this.connectionState == ConnectionStates.disconnected) {
			this._setConnectionState(ConnectionStates.connecting);

			const radio = this;
			this.connection = net.connect(radio.port, radio.host, function () {
				log_info('Radio::connection.on(\'connect\')');
				radio._setConnectionState(ConnectionStates.connected);
				radio._startRealtimeListener();
				radio._updateMeterList();
			});

			this.connection.on('data', function (data) {
				radio._receiveData(data);
			});

			this.connection.on('error', function (error) {
				// Called when there is an error on the channel
				// MUST be handled by a listener somewhere or will
				// CRASH the program with an unhandled exception.
				console.error('Radio::connection.on(\'error\')');
				radio.emit('error', error);
			});

			this.connection.on('close', function () {
				log_info('Radio::connection.on(\'close\')');
				radio._stopRealtimeListener();
				radio._setConnectionState(ConnectionStates.disconnected);
			});
		}
	}

	_disconnectFromRadio() {
		log_info('Radio::_disconnectFromRadio()');
		if (this.connectionState != ConnectionStates.disconnected) {
			this.connection.destroy();
		}
	}

	_startRealtimeListener() {
		log_info('Radio::_startRealtimeListener():');
		if (this.realtimeListenerState == ConnectionStates.disconnected) {
			this.realtimeListener = udp.createSocket({ type: 'udp4', reuseAddr: false });

			const radio = this;
			const realtimeListener = this.realtimeListener;

			realtimeListener.on('listening', function () {
				log_info('Radio::realtimeListener.on(\'listening\')');

				const listenAddress = realtimeListener.address();
				radio.realtimeListenerPort = listenAddress.port;

				log_info('Radio::realtimeListener listening on udp4: ' + radio.realtimeListenerPort);
				radio._setRealtimeListenerState(ConnectionStates.listening);

				setTimeout(function () {
					radio.send('client udpport ' + radio.realtimeListenerPort);
				}, CLIENT_SETUP_COMMAND_DELAY);
			});

			realtimeListener.on('error', function (error) {
				// MUST be handled by a listener somewhere or will
				// CRASH the program with an unhandled exception.
				console.error('Radio::realtimeListener.on(\'error\')');
				radio.emit('error', error);
			});

			realtimeListener.on('message', function (data, info) {
				radio._receiveRealtimeData(data, info);
			});

			realtimeListener.on('close', function () {
				log_info('Radio::realtimeListener.on(\'close\')');
				radio._setRealtimeListenerState(ConnectionStates.disconnected);
			});

			this._setRealtimeListenerState(ConnectionStates.connecting);
			realtimeListener.bind();
		}
	}

	// Receives a "chunk" of data on the TCP/IP stream
	// Accumulates it and passes off individual lines to be handled
	_receiveData(raw_data) {
		// log_debug('Radio::_receiveData(raw_data):');
		this.streamBuffer += raw_data.toString('utf8');

		var idx;
		while ((idx = this.streamBuffer.indexOf('\n')) >= 0) {
			const response = this.streamBuffer.substring(0, idx);
			this.streamBuffer = this.streamBuffer.substring(idx + 1);

			this._receiveMessage(response);
		}
	}

	// Handles a singluar, separated, message line from TCP/IP stream
	_receiveMessage(encoded_message) {
		log_debug('_receiveResponse(' + encoded_message + ')');
		const message = flex.decode(encoded_message);
		if (message) {
			if (message.type == 'response') {
				const request = this.requests[message.sequence_number];
				if (request && request.callback) {
					request.callback(message);
				}
			} else {
				this.emit(message.type, message);
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
		const meters = this.meters;
		const vita49_message = vita49.decode(data);

		if (vita49_message) {
			// log_debug('receiveRealtimeData: ' + data);
			// TODO: Expand to panadapter and other data from radio.
			// use message.class.packet_class as the emitted message topic
			// e.g. emit(vita49.decode_packet_class(message.class.packet_class));
			if (this._isRealtimeData(vita49_message)) {
				const meter_data = flex.decode_meter(vita49_message.payload)
				// log_debug('receiveRealtimeData: ' + JSON.stringify(meter_data));
				if (meter_data && 'meters' in meter_data) {
					for (const [meter_num, meter_value] of Object.entries(meter_data.meters)) {
						if (meter_num in meters) {
							const meter = meters[meter_num];
							const value = this._scaleMeterValue(meter, meter_value);
							// Only update and emit when the value changes
							if (value != meter.value) {
								meter.value = value;
								this.emit('meter', meter);
							}
						}
					}
				}
			} else {
				console.warn("Received real-time data that is not a meter. Not implemented!");
				console.warn(vita49_message.payload);
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
		log_debug('_sendRequest(' + request + ')');
		const sequenceNumber = this.nextRequestSequenceNumber++;
		this.requests[sequenceNumber] = {
			sequence_number: sequenceNumber,
			request: request,
			callback: callback
		};

		const encoded_request = flex.encode_request(sequenceNumber, request);
		this.connection.write(encoded_request);
	}

	_stopRealtimeListener() {
		log_info('Radio::_stopRealtimeListener()');
		if (this.realtimeListenerState != ConnectionStates.disconnected) {
			this.realtimeListener.close();
		}
	}

	getConnectionState() {
		return this.connectionState;
	}

	_setConnectionState(state) {
		this.connectionState = state;
		this.emit(state, 'tcp');
	}

	_setRealtimeListenerState(state) {
		this.realtimeListenerState = state;
		this.emit(state, 'udp');
	}

	_updateMeterList() {
		const radio = this;
		this.send('meter list', function (response) {
			radio.meters = { ...radio.meters, ...response.response.meter };
		});
	}

	getMeter(meter_index) {
		if (meter_index in radio.meters) {
			return this.meters[meter_index]
		}

		return null;
	}
}

module.exports = {
	Radio: Radio,
	RadioConnectionStates: ConnectionStates
};