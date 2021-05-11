const udp = require('dgram');
const EventEmitter = require('events');

const vita49 = require('vita49');
const flex = require('flexradio');

const DiscoveryStates = {
	connecting: 'connecting',
	connected: 'connected',
	listening: 'listening',
	stopped: 'stopped'
};

const CONNECTION_RETRY_TIMEOUT = 5000;
const VITA_DISCOVERY_PORT = 4992;

const VITA_DISCOVERY_STREAM 		= 0x00000800;
const VITA_FLEX_OUI 				= 0x1c2d;
const VITA_FLEX_INFORMATION_CLASS 	= 0x534c;
const VITA_FLEX_PACKET_CLASS		= 0xffff;

class DiscoveryListener extends EventEmitter {
	constructor(host, port) {
		super();

		this.host = host;
		this.port = port;
		this.discoveryState = DiscoveryStates.stopped;
		this.discoveryListener = null;
	}

	start() {
		// console.log('DiscoveryListener.start()');
		this._startDiscoveryListener();
	}

	stop() {
		// console.log('DiscoveryListener.stop()');
		this._stopDiscoveryListener();
	}

	_startDiscoveryListener() {
		const discovery = this;
		if (discovery.discoveryState == DiscoveryStates.stopped) {
			if (!discovery.discoveryListener) {
				discovery.discoveryListener = udp.createSocket('udp4');
			}

			const discoveryListener = discovery.discoveryListener;

			discoveryListener.on('connect', function() {
				discovery._setDiscoveryState(DiscoveryStates.connected);
			});
			
			discoveryListener.on('listening', function() {
				//emits when socket is ready and listening for datagram msgs
				discovery._setDiscoveryState(DiscoveryStates.listening);
			});

			discoveryListener.on('error', function(error) {
				// emits when any error occurs
				// MUST be handled by a listener somewhere or will
				// CRASH the program with an unhandled exception.
				discovery.emit('error', error);
			});
	
			discoveryListener.on('message', function(data, info) {
				discovery._receiveData(data, info);
			});

			discoveryListener.on('close', function(){
				discovery._setDiscoveryState(DiscoveryStates.stopped);
			});

			discovery._setDiscoveryState(DiscoveryStates.connecting);
			discoveryListener.bind(discovery.port);
		}
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
			const discovery_payload = vita49_message.payload.toString('utf8');
			// const discovery_payload = new StringDecoder('utf8').write(vita49_message.payload);
			const radio_descriptor = flex.decode_discovery(discovery_payload);			
			if (radio_descriptor) {
				this.emit('radio', radio_descriptor);
				// const radio = Radio.fromDiscoveryDescriptor(radio_descriptor);
				// if (radio) {
				// 	this.emit('radio', radio);
				// }
			}
		}
	}

	_stopDiscoveryListener() {
		const discovery = this;
		if (discovery.discoveryListener) {
			const discoveryListener = discovery.discoveryListener;
			discoveryListener.close();
		}
	}

	_setDiscoveryState(state) {
		const discovery = this;

		discovery.discoveryState = state;
		discovery.emit(state);
	}
}

module.exports = { DiscoveryListener : DiscoveryListener };