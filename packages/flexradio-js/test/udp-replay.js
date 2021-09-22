// UDP Client that will send faux FlexRadio data to listeners
const dgram = require('dgram');
const pcap = require('pcap');
const { exit } = require('process');
const flex = require('..');

const PORT = 4992;
const HOST = '127.0.0.1';

const capture_file = process.argv[2];
const udp_client = dgram.createSocket('udp4');
const data = Buffer.from('hello');
udp_client.send(data, 4990, '127.0.0.1', function(err) {
	console.log(err);
});
process.exit();

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

function sleep(ms) {
	Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

let first_ts = 0;
let last_ts = 0;
function wait_for_packet(packet) {
	const ts = packet.pcap_header.tv_sec * 1000000 + packet.pcap_header.tv_usec;
	if (last_ts == 0) {
		last_ts = first_ts = ts;
	}

	const delay = ts - last_ts;
	last_ts = ts;

	sleep(delay / 1000);
}

const pcap_session = pcap.createOfflineSession(capture_file);
pcap_session.on('packet', async function(raw_packet) {
	const packet = pcap.decode.packet(raw_packet);
	if (packet) {
		wait_for_packet(packet);
		const u_packet = udp_packet(packet);
		if (u_packet) {
			let data = u_packet.data;
			console.log(data);
			console.log(flex.decode_realtime(data));
			udp_client.send('hello', 4992, '127.0.0.1', function(err) {
				console.log(err);
			});
			sleep(5000);
			process.exit();
		}
	}
});
