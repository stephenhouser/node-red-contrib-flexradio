
const udp = require('dgram');
const EventEmitter = require('events');
const { StringDecoder } = require('string_decoder');

const vita49 = require('vita-49');
const flex = require('flexradio');
const { Radio } = require('flexradio/Radio');


const CONNECTION_RETRY_TIMEOUT = 5000;
const VITA_DISCOVERY_PORT = 4992;

const VITA_DISCOVERY_STREAM 		= 0x00000800;
const VITA_FLEX_OUI 				= 0x1c2d;
const VITA_FLEX_INFORMATION_CLASS 	= 0x534c;
const VITA_FLEX_PACKET_CLASS		= 0xffff;

class Discovery extends EventEmitter {
	constructor(host, port) {
		super();

		this.host = host;
		this.port = port;
		this.isConnected = false;
		this.isConnecting = false;
		this.eventEmitter = new events.EventEmitter();
		this.discoveryListener = udp.createSocket('udp4');
	}

	Start() {
		console.log('Start()');
		this._startDiscoveryListener();
	}

	Stop() {
		console.log('Stop()');
		this._stopDiscoveryListener();
	}

	_startDiscoveryListener() {
		const discovery = this;

		discovery.discoveryListener.on('connect', function(){
			discovery.isConnected = true;
			discovery.isConnecting = false;
		});
  		
		discovery.discoveryListener.on('listening', function() {
			//emits when socket is ready and listening for datagram msgs
			this.emit('started');
		});

		discovery.discoveryListener.on('error', function(error){
			// emits when any error occurs
			// MUST be handled by a listener somewhere or will
			// CRASH the program with an unhandled exception.
			discovery.emit('error', err);
		});
  
		discovery.discoveryListener.on('message', function(data, info) {
			discovery._receiveData(data, info);
		});

		discovery.discoveryListener.on('close', function(){
			discovery.isConnected = false;
			discovery.isConnecting = false;

			discovery.emit('stopped');
		});

		discovery.isConnecting = true;
		discovery.discoveryListener.bind(this.port);
	}

	_isDiscoveryMessage(message) {
		return message 
			&& message.stream_id == VITA_DISCOVERY_STREAM
			&& message.class.oui == VITA_FLEX_OUI
			&& message.class.information_class == VITA_FLEX_INFORMATION_CLASS
			&& message.class.packet_class == VITA_FLEX_PACKET_CLASS;
	}

	_receiveData(data, info) {
		const vita49_message = vita49.decode(data);
		if (this._isDiscoveryMessage(vita49_message)) {
			const discovery_payload = new StringDecoder('utf8').write(vita49_message.payload);
			const radio_descriptor = flex.decode_discovery(discovery_payload);
			if (radio_descriptor) {
				const radio = Radio.fromDiscoveryDescriptor(radio_descriptor);
				if (radio) {
					this.emit('radio', radio);
				}
			}
		}
	}

	_stopDiscoveryListener() {
		this.discoveryListener.close();
	}
}

module.exports = { Discovery : Discovery };