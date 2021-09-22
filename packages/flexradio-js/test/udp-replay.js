// UDP Client that will send faux FlexRadio data to listeners
const { strictEqual } = require('assert');
const dgram = require('dgram');
const pcap = require('pcap');
const { exit } = require('process');
const vita49 = require('vita49-js');
const flex = require('..');

const PORT = 4995;
const HOST = 'localhost';

const capture_file = process.argv[2];
const udp_client = dgram.createSocket('udp4');

function get_udp_packet(packet) {
	if (packet &&
		packet.payload.constructor.name == 'EthernetPacket' &&
		packet.payload.payload &&
		packet.payload.payload.constructor.name == 'IPv4' &&
		packet.payload.payload.payload &&
		packet.payload.payload.payload.constructor.name == 'UDP') {
		const data = {
				timestamp_s: packet.pcap_header.tv_sec,
				timestamp_us: packet.pcap_header.tv_usec,
				data: Buffer.from(packet.payload.payload.payload.data),
				sport: packet.payload.payload.payload.sport,
				dport: packet.payload.payload.payload.dport,
				length: packet.payload.payload.payload.length,
				checksum: packet.payload.payload.payload.checksum
			};
		
		return data;
	}

	return null;
}

function get_packets() {
	return new Promise((resolve, reject) => {
		const packets = [];
		const pcap_session = pcap.createOfflineSession(capture_file);
		pcap_session.on('packet', (raw_packet) => {
			const packet = pcap.decode.packet(raw_packet);
			if (packet) {
				try {
					const udp_packet = get_udp_packet(packet);
					if (udp_packet) {
						packets.push(udp_packet);
					}
				} catch (error) {
					console.error(error);
				}
			}
		});		

		pcap_session.on("complete", () => {
			resolve(packets);
		});
	})
}

async function packet_delay(packet) {
	cons
	return new Promise((resolve) => {
		setTimeout(resolve, delay_ms)
	})
}

get_packets().then(async (packets) => {
	for (i = 0; i < packets.length; i++) {
		const p = packets[i];
	
		await packet_delay(p);
	}
	// packets.forEach(function(p) {
	// 	console.log(p);
	// 	udp_client.send(p.data, PORT, HOST)
	// });

	udp_client.close();	
});



