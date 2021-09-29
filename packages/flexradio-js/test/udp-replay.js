// UDP Client that will send faux FlexRadio data to listeners
const { strictEqual } = require('assert');
const dgram = require('dgram');
const pcap = require('pcap');
const { exit } = require('process');
const vita49 = require('vita49-js');
const flex = require('..');

const PORT = 4992;
const HOST = 'localhost';

const capture_file = process.argv[2];
const port = process.argv[3] || PORT;
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

let first_time = 0;
function packet_time(packet) {
	const p_time = packet.timestamp_s * 1000 + packet.timestamp_us / 1000;
	if (first_time === 0) {
		first_time = packet_time;
	}

	return p_time - first_time;
}

function flex_packet(packet) {
	return packet.dport === 4992 || packet.dport === 4993;
}

async function get_packets() {
	return new Promise((resolve, reject) => {
		const packets = [];
		const pcap_session = pcap.createOfflineSession(capture_file);
		pcap_session.on('packet', (raw_packet) => {
			const packet = pcap.decode.packet(raw_packet);
			if (packet) {
				if (first_time === 0) {
					first_time = packet.pcap_header.tv_sec * 1000 + packet.pcap_header.tv_usec / 1000;
				}

				try {
					const udp_packet = get_udp_packet(packet);				
					console.log(udp_packet);
					if (udp_packet && flex_packet(udp_packet)) {
						packets.push({ ...udp_packet });
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

let first_udp_packet = 0;
let last_time = 0;
async function packet_delay(packet) {
	const p_time = packet_time(packet);
	if (first_udp_packet === 0) {
		first_udp_packet = p_time;
		last_time = p_time;
	}

	const delay_ms = p_time - last_time;
	last_time = p_time;

	console.log(`Time: ${p_time / 1000}`);
	return new Promise((resolve) => {
		setTimeout(resolve, delay_ms)
	})
}

get_packets()
	.then(async (packets) => {
		for (i = 0; i < packets.length; i++) {
			const p = packets[i];
		
			await packet_delay(p);
			console.log(p);
			const vita_dgram = vita49.decode(p.data);
			if (vita_dgram) {
				console.log(vita_dgram);
			} else {
				process.exit();
			}

			const flex_dgram = flex.decode_realtime(p.data);
			if (flex_dgram) {
				console.log(flex_dgram);
			} else {
				process.exit();
			}

			udp_client.send(p.data, port, HOST);
		}
	})
	.finally(() => {
		udp_client.close();
	});
