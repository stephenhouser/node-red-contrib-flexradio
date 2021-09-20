// UDP Client that will send faux FlexRadio data to listeners
const pcap = require('pcap');
const flexParser = require('../index');
const vita49Parser = require('./vita49-parser');

const Parser = require("binary-parser").Parser;

const capture_file = process.argv[2];

function udp_packet(packet) {
	if (packet &&
		packet.payload.constructor.name == 'EthernetPacket' &&
		packet.payload.payload &&
		packet.payload.payload.constructor.name == 'IPv4' &&
		packet.payload.payload.payload &&
		packet.payload.payload.payload.constructor.name == 'UDP') {
		return packet.payload.payload.payload;
	}

	return null;
}

const packets = [];
const pcap_session = pcap.createOfflineSession(capture_file);
pcap_session.on('packet', function(raw_packet) {

	const packet = pcap.decode.packet(raw_packet);
	if (packet) {
		const u_packet = udp_packet(packet);
		if (u_packet) {
			const data = new Uint8Array(u_packet.data);
			packets.push(data);
		}
	}
});

for (i = 0; i < 10000000; i++) {
	packets.forEach(function(data) {
		const flex_dgram = decode_realtime(data);
		if (flex_dgram) {
			switch (flex_dgram.type) {
				case 'meter':
					// console.log('METER Data');
					// console.log(flex_dgram);
					break;

				default:
			}
		}
	});
}
