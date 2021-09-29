const udp = require('dgram');
const EventEmitter = require('events');

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

		this.host = host || '0.0.0.0';
		this.port = port || 4992;
		this.discoveryState = DiscoveryStates.stopped;
		this.discoverySocket = null;

		this.discovered_radios = {};
	}

	start() {
		log_info('DiscoveryListener::start()');
		if (this.discoveryState === DiscoveryStates.stopped) {
			this._startDiscoveryListener();
		}
	}

	stop() {
		log_info('DiscoveryListener::stop()');
		if (this.discoveryState !== DiscoveryStates.stopped) {
			this._stopDiscoveryListener();
		}
	}

	get radios() {
		// Return a copy not the original
		return { ...this.discovered_radios };
	}

	_startDiscoveryListener() {
		log_info('DiscoveryListener::_startDiscoveryListener()');

		this.discoverySocket = udp.createSocket({type: 'udp4', reuseAddr: true});
		const discoverySocket = this.discoverySocket;

		const discoveryListener = this;
		
		discoverySocket.on('listening', function() {
			log_info('DiscoveryListener::connection.on(\'listening\')');
			discoveryListener._setDiscoveryState(DiscoveryStates.listening);
		});

		discoverySocket.on('error', function(error) {
			// MUST be handled by a listener somewhere or will
			// CRASH the program with an unhandled exception.
			console.error('DiscoveryListener::connection.on(\'error\')');
			console.error(error);
			// this.emit('error', error);
		});

		discoverySocket.on('message', function(data, info) {
			log_debug('DiscoveryListener::connection.on(\'message\')');
			discoveryListener._receiveData(data, info);
		});

		discoverySocket.on('close', function() {
			log_info('DiscoveryListener::connection.on(\'close\')');
			discoveryListener._setDiscoveryState(DiscoveryStates.stopped);
		});

		this._setDiscoveryState(DiscoveryStates.connecting);
		discoverySocket.bind(this.port);
	}

	_receiveData(data, info) {
		// const discoveryListener = this;
		const flex_msg = flex.decode_realtime(data);
		if (flex_msg.type === 'discovery') {
				log_debug('DiscoveryListener::_receiveData(' + JSON.stringify(flex_msg) + ')');
				this.emit('discovery', flex_msg);
		}
	}

	_stopDiscoveryListener() {
		log_info('DiscoveryListener::_stopDiscoveryListener()');
		if (this.discoveryState !== DiscoveryStates.stopped) {
			this.discoverySocket.close();
		}
	}

	_setDiscoveryState(state) {
		this.discoveryState = state;
		this.emit('state', state);
	}
}

module.exports = { DiscoveryListener: DiscoveryListener };
