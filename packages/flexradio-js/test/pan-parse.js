// UDP Client that will send faux FlexRadio data to listeners
const pcap = require('pcap');
const flex = require('../index');
const vita49 = require('./vita49-parser');

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

const FlexStreamType = {
	meter: 0x00000700,
	discovery: 0x00000800
};

const FlexPacketClass = {
	meter: 0x8002,
	panadapter: 0x8003,
	waterfall: 0x8004,
	opus: 0x8005,
	daxReducedBw: 0x0123,
	daxIq24: 0x02e3,
	daxIq48: 0x02e4,
	daxIq96: 0x02e5,
	daxIq192: 0x02e6,
	daxAudio: 0x03e3,
	discovery: 0xffff,

	decode: function(code) {
		switch (code) {
			case this.meter: return 'meter';
			case this.panadapter: return 'panadapter';
			case this.waterfall: return 'waterfall';
			case this.opus: return 'opus';
			case this.daxReducedBw: return 'daxReducedBw';
			case this.daxIq24: return 'daxIq24';
			case this.daxIq48: return 'daxIq48';
			case this.daxIq96: return 'daxIq96';
			case this.daxIq192: return 'daxIq192';
			case this.daxAudio: return 'daxAudio';
			case this.discovery: return 'discovery';
			default: return 'unknown' + code;
		}
	}
};


const VITA_FLEX_OUI = 0x00001c2d;
const VITA_FLEX_INFORMATION_CLASS = 0x534c;

function isFlexClass(vita49_dgram) {
	return vita49_dgram.class.oui === VITA_FLEX_OUI &&
		vita49_dgram.class.information_class === VITA_FLEX_INFORMATION_CLASS;
}

function isDataStream(vita49_dgram) {
	return vita49_dgram.packet_type == vita49.PacketType.ext_data_stream
}

/*
{
  type: 'meter',
  count: 1,
  stream_id: 1792,
  payload: {
    '1': 1351,
    '2': 62283,
    '3': 33536,
    '4': 33536,
    '5': 33536,
    '6': 33536,
    '7': 33536,
    '8': 33536,
    '14': 33536,
    '15': 0,
    '23': 54457,
    '24': 34657,
    '25': 34657,
    '26': 40704
  }
}
*/
function decodeMeters(vita49_dgram) {
	const meterParser = new Parser()
		.uint16('meter')
		.uint16('value');

	const metersParser = new Parser()
		.array(null, {
			type: meterParser,
			readUntil: 'eof'
		});

	const meters = {};
	metersParser.parse(vita49_dgram.payload).forEach(function(m) {
		meters[m.meter] = m.value;
	})

	return {
		type: 'meter',
		sequence: vita49_dgram.sequence,
		payload: meters
	};
}

function decode_realtime(data) {
	const vita49_dgram = vita49.decode(data);
	if (isFlexClass(vita49_dgram) && isDataStream(vita49_dgram)) {
		console.log(vita49_dgram);

		switch (vita49_dgram.class.packet_class) {
			case FlexPacketClass.meter:
				return decodeMeters(vita49_dgram);
			default:
				return vita49_dgram;
		}
	}
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
