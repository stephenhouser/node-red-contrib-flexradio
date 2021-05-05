
let udp = require('dgram');
const events = require('events');

const CONNECTION_RETRY_TIMEOUT = 5000;

let vita_discovery_port = 4992;
// let vita_meter_port		= 4991;


class Discovery {
	constructor(host, port) {
		this.host = host;
		this.port = port;
		this.isConnected = false;
		this.eventEmitter = new events.EventEmitter();
		this.discoveryListener = udp.createSocket('udp4');
	}

	Start() {
		console.log('Start()');
		this._emit('discovery', 'starting');
		this._startDiscoveryListener();
	}

	Stop() {
		console.log('Stop()');
		this._emit('discovery', 'stopped');
	}

	on(event, handlerFunction) {
		this.eventEmitter.on(event, handlerFunction);
	}

	_emit(event, data) {
		this.eventEmitter.emit(event, data);
	}

	_startDiscoveryListener() {
		console.log('_startDiscoveryListener()');

		const discovery = this;

		//emits after the socket is ??? using socket.close();
		this.discoveryListener.on('connect', function(){
			console.log('on connect');
		});
  
		//emits when socket is ready and listening for datagram msgs
		this.discoveryListener.on('listening', function() {
			console.log('on listening');
		});

		// emits when any error occurs
		this.discoveryListener.on('error', function(error){
			console.log('on error:' + error);
		});
  
		this.discoveryListener.on('message', function(msg, info) {
			console.log('on message');
		});

		this.discoveryListener.bind(4992);
	}

	_receiveData(data) {
		console.log('_receiveData()');
	}

}

module.exports = { Discovery : Discovery };