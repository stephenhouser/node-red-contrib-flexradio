
var net = require('net');

const CONNECTION_RETRY_TIMEOUT = 5000;

class Radio {
	constructor(host, port) {
		this.host = host;
		this.port = port;
		this.clientId = null
		this.isConnected = false;
		this.isConnecting = false;
		this.connection = null;
	}

	Connect(guiClientId) {
		console.log('Connect(' + guiClientId + ')');

		this.clientId = guiClientId;
		this._connectToRadio();
	}

	Disconnect() {
		console.log('Disconnect()');
	}

	RefreshLicenseState() {
		console.log('RefreshLicenseState()');
	}

	MonitorNetworkQuality() {
		console.log('MonitorNetworkQuality()');
	}

	_connectToRadio() {
		console.log('_connectToRadio()');

		const radio = this;
		if (!radio.isConnected && !radio.isConnecting) {
			radio.isConnecting = true;

			radio.connection = net.connect(radio.port, radio.host, function() {
				// Called when connection is complete
				console.log('on connected');

				radio.isConnected = true;
				radio.isConnecting = false;
			});

			radio.connection.on('data', function(data) {
				// Called when data arrives on the socket
				console.log('on data');

				receive_data(data);
			});

			radio.connection.on('error', function (err) {
				// Called when there is an error on the channel
				console.log('on error');
			});

			radio.connection.on('end', function() {
				// Called when the other end closed the connection
				console.log('on end');
			});

			radio.connection.on('close', function() {
				// Called as the socket is closed (either end or error)
				console.log('on close');

				radio.isConnected = false;
				radio.reconnectTimeout = setTimeout(radio._connectToRadio, CONNECTION_RETRY_TIMEOUT);
			});
		}
	}

	_receiveData(data) {
		console.log('_receiveData()');
	}
}

module.exports = { Radio : Radio };