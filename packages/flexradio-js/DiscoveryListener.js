const udp = require('dgram');
const EventEmitter = require('events');

const vita49 = require('vita49-js');
const flex = require('flexradio-js');

const log_debug = function(msg) { }; // { console.log(msg); }
const log_info = function(msg) { console.log(msg); };

const DiscoveryStates = {
	connecting: 'connecting',
	connected: 'connected',
	listening: 'listening',
	stopped: 'stopped'
};

const VITA_DISCOVERY_STREAM = 0x00000800;
const VITA_FLEX_OUI = 0x1c2d;
const VITA_FLEX_INFORMATION_CLASS = 0x534c;
const VITA_FLEX_PACKET_CLASS = 0xffff;

class DiscoveryListener extends EventEmitter {
	constructor(host, port) {
		super();

		this.host = host;
		this.port = port;
		this.discoveryState = DiscoveryStates.stopped;
		this.discoveryListener = null;
	}

	start() {
		log_info('DiscoveryListener::start()');
		this._startDiscoveryListener();
	}

	stop() {
		log_info('DiscoveryListener::stop()');
		this._stopDiscoveryListener();
	}

	_startDiscoveryListener() {
		log_info('DiscoveryListener::_startDiscoveryListener()');

		const discovery = this;
		if (discovery.discoveryState === DiscoveryStates.stopped) {
			discovery.discoveryListener = udp.createSocket('udp4');

			const discoveryListener = discovery.discoveryListener;

			discoveryListener.on('listening', function() {
				log_info('DiscoveryListener::connection.on(\'listening\')');
				discovery._setDiscoveryState(DiscoveryStates.listening);
			});

			discoveryListener.on('error', function(error) {
				// MUST be handled by a listener somewhere or will
				// CRASH the program with an unhandled exception.
				console.error('DiscoveryListener::connection.on(\'error\')');
				discovery.emit('error', error);
			});

			discoveryListener.on('message', function(data, info) {
				log_debug('DiscoveryListener::connection.on(\'message\')');
				discovery._receiveData(data, info);
			});

			discoveryListener.on('close', function() {
				log_info('DiscoveryListener::connection.on(\'close\')');
				discovery._setDiscoveryState(DiscoveryStates.stopped);
			});

			discovery._setDiscoveryState(DiscoveryStates.connecting);
			discoveryListener.bind(discovery.port);
		}
	}

	_isDiscoveryMessage(message) {
		return message &&
			message.stream_id === VITA_DISCOVERY_STREAM &&
			message.class.oui === VITA_FLEX_OUI &&
			message.class.information_class === VITA_FLEX_INFORMATION_CLASS &&
			message.class.packet_class === VITA_FLEX_PACKET_CLASS;
	}

	_receiveData(data, info) {
		const vita49_message = vita49.decode(data);
		if (this._isDiscoveryMessage(vita49_message)) {
			const discovery_payload = vita49_message.payload.toString('utf8');
			const radio_descriptor = flex.decode_discovery(discovery_payload);
			if (radio_descriptor) {
				log_debug('DiscoveryListener::_receiveData(' + JSON.stringify(radio_descriptor) + ')');
				this.emit('discovery', radio_descriptor);
			}
		}
	}

	_stopDiscoveryListener() {
		log_info('DiscoveryListener::_stopDiscoveryListener()');
		if (this.discoveryState !== DiscoveryStates.stopped) {
			this.discoveryListener.close();
		}
	}

	_setDiscoveryState(state) {
		this.discoveryState = state;
		this.emit(state);
	}
}

module.exports = { DiscoveryListener: DiscoveryListener };
