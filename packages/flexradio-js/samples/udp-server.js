// UDP Client that will send faux FlexRadio data to listeners
const dgram = require('dgram');
const pcap = require('pcap');

const PORT = 4992;
const HOST = '127.0.0.1';

const capture_file = 'flex-smartsdr.pcapng'; //process.argv[2];
const udp_client = dgram.createSocket('udp4');

const pcap_session = pcap.createOfflineSession(capture_file);

pcap_session.on('packet', function (raw_packet) {
    const packet = pcap.decode.packet(raw_packet);
	if (packet) {
		const ts = packet.pcap_header.tv_sec;
		if ( packet.payload.constructor.name == 'EthernetPacket' 
			&& packet.payload.payload
			&& packet.payload.payload.constructor.name == 'IPv4' 
			&& packet.payload.payload.payload
			&& packet.payload.payload.payload.constructor.name == 'UDP' ) {
			console.log(ts);
			console.log(packet.payload.payload.payload);
		}
		// const data = packet.payload.payload.payload.data;
		// console.log('DATA=');
		// console.log(data);
	}

	// udp_client.send(data, 0, data.length, PORT, HOST);
});
