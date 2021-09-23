const udp = require('dgram');
const EventEmitter = require('events');

const vita49 = require('vita49-js');
const flex = require('flexradio-js');

const log_info = function(msg) { console.log(msg); };
const log_debug = function(msg) { };

const DiscoveryStates = {
	connecting: 'connecting',
	connected: 'connected',
	listening: 'listening',
	stopped: 'stopped'
};

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
			discovery.discoveryListener = udp.createSocket({type: 'udp4', reuseAddr: true});

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

	_receiveData(data, info) {
		const flex_msg = flex.decode_realtime(data);
		if (flex_msg.type === 'discovery') {
				log_debug('DiscoveryListener::_receiveData(' + JSON.stringify(flex_msg) + ')');
				this.emit(flex_msg.type, flex_msg);
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
