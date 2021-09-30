/*
{
	"type": "discovery",
	"stream": 2048,
	"sequence": 1,
	"payload": {
		"discovery_protocol_version": "3.0.0.1",
		"model": "FLEX-6600M",
		"serial": "0621-1104-6601-1641",
		"version": "3.2.39.3374",
		"nickname": "Flex-6600M",
		"callsign": "N1SH",
		"ip": "192.168.10.27",
		"port": 4992,
		"status": "Available",
		"inuse_ip": 0,
		"inuse_host": 0,
		"max_licensed_version": "v3",
		"radio_license_id": "00-1C-2D-05-1A-68",
		"requires_additional_license": 0,
		"fpc_mac": "00:1C:2D:03:85:6A",
		"wan_connected": 1,
		"licensed_clients": 2,
		"available_clients": 2,
		"max_panadapters": 4,
		"available_panadapters": 4,
		"max_slices": 4,
		"available_slices": 4,
		"gui_client_ips": 0,
		"gui_client_hosts": 0,
		"gui_client_programs": 0,
		"gui_client_stations": 0,
		"gui_client_handles": 0
	}
}
*/
const udp = require('dgram');
const EventEmitter = require('events');
const flex = require('./flex');

const log_info = function(msg) { console.log(msg); };
const log_debug = function(msg) { };

const FLEX_DISCOVERY_PORT = 4992;

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
		this.port = port || FLEX_DISCOVERY_PORT;
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
		// Return a copy not the original in case the caller modifies it
		return this.discovered_radios;
	}

	_startDiscoveryListener() {
		log_info('DiscoveryListener::_startDiscoveryListener()');

		this.discoverySocket = udp.createSocket({ type: 'udp4', reuseAddr: true });
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
			if (flex_msg.payload && flex_msg.payload.serial) {
				this.discovered_radios[flex_msg.payload.serial] = flex_msg.payload;
				this.emit('discovery', flex_msg);
			}
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

// Singleton for discovery listener
// As we cannot properly "share" the UDP port and may need this in
// multiple places.
let _discovery_listener = null;
function discovery_listener() {
	if (!_discovery_listener) {
		_discovery_listener = new DiscoveryListener('0.0.0.0', FLEX_DISCOVERY_PORT);
		_discovery_listener.start();
	}

	return _discovery_listener;
}

module.exports = { discovery_listener: discovery_listener };
