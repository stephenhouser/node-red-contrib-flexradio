
var net = require('net');

const CONNECTION_RETRY_TIMEOUT = 5000;

class Radio {
	constructor(descriptor) {
		// {
		// 	discovery_protocol_version: "3.0.0.1",
		// 	model: "FLEX-6600M",
		// 	serial: "0621-1104-6601-1641",
		// 	version: "3.2.31.2837",
		// 	nickname: "FlexRadio",
		// 	callsign: "N1SH",
		// 	ip: "192.168.10.27",
		// 	port: "4992",
		// 	status: "Available",
		// 	max_licensed_version: "v3",
		// 	radio_license_id: "00-1C-2D-05-1A-68",
		// 	requires_additional_license: "0",
		// 	fpc_mac: "00:1C:2D:03:85:6A",
		// 	wan_connected: "1",
		// 	licensed_clients: "2",
		// 	available_clients: "2",
		// 	max_panadapters: "4",
		// 	available_panadapters: "4",
		// 	max_slices: "4",
		// 	available_slices: "4",
		// 	gui_client_handles: "\u0000\u0000\u0000",
		//   }
		for (const [key, value] of Object.entries(descriptor)) {
			this[key] = value;
		  }

		this.isConnected = false;
		this.isConnecting = false;
		this.connection = null;
		this.clientId = null;
	}

	static fromDiscovery(radio_descriptor) {
		const radio = new Radio(radio_descriptor);
		return radio;
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