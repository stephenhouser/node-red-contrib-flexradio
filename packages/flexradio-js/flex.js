/* FlexRadio message decoder functions.
 * Decodes the payloads that come back from a FlexRadio on
 * both the TCP connection and via VITA-49 over UDP (meter and discovery)
 * payloads.
 *
 * Some references used in building this:
 * http://wiki.flexradio.com/index.php?title=Discovery_protocol
 * https://github.com/kc2g-flex-tools/flexclient
 * https://discourse.nodered.org/t/vita-49-decoding/20792
 * https://github.com/K3TZR/xLib6000/blob/master/Sources/xLib6000/Supporting/Vita.swift
 * https://community.flexradio.com/discussion/7063537/meter-packet-protocol
 */

const binaryParser = require('binary-parser').Parser;
const flexParser = require('./flex-parser');
const vita49 = require('vita49-js');

const VITA_FLEX_OUI = 0x00001c2d;
const VITA_FLEX_INFORMATION_CLASS = 0x534c;

const StreamType = {
	meter: 0x00000700,
	discovery: 0x00000800
};

const RealtimePacketClass = {
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

const ResponseCode = {
	success: 0,
	parameter_number: 0x5000002C,
	unknown_command: 0x50000015,
	unknown_1: 0x50001000,

	decode: function(code) {
		switch (code) {
			case 0x00000000: return 'success';
			case 0x5000002C: return 'incorrect number of parameters';
			case 0x50001000: return '';
			case 0x50000015: return 'unknown command';
			default: return 'unknwon ' + code;
		}
	}
};

// decode() -- decode data sent from a FlexRadio on the TCP control stream.
function decode(response) {
	if (response) {
		try {
			// use PEGJS parser to parse response payloads.
			const parsed = flexParser.parse(response);
			return parsed;
		} catch (error) {
			console.log(error);
			return {
				type: 'error',
				payload: { ...error, response: response }
			};
		}
	}

	return null;
}

// decode_discovery() -- decode FlexRadio discovery datagrams sent as UDP broadcast messages
function decode_discovery(payload) {
	function tokenValue(token) {
		return isNaN(Number(token)) ? token : Number(token);
 	}
 
	const radio = {};
	const clean_payload = payload.replace(/[^\x20-\x7E]/g, '');
	const fields = clean_payload.split(' ').forEach(function(kv) {
		const [key, value] = kv.split('=');
		radio[key] = tokenValue(value);
	});

	return {
		type: 'discovery',
		payload: radio
	};
}

// decode_meters() -- decode the meter reporting datagram (just the payload)
function decode_meters(dgram) {
	const meterParser = new binaryParser()
		.uint16('meter')
		.uint16('value');

	const metersParser = new binaryParser()
		.array(null, {
			type: meterParser,
			readUntil: 'eof'
		});

	const meters = {};
	metersParser.parse(dgram.payload).forEach(function(m) {
		meters[m.meter] = m.value;
	});

	return {
		type: RealtimePacketClass.decode(dgram.class.packet_class),
		sequence: dgram.sequence,
		payload: meters
	};
}

function decode_panadapter(dgram) {
	const panadapterParser = new binaryParser()
		.uint16('start_bin')
		.uint16('number_of_bins')
		.uint16('bin_size')
		.uint16('bins_in_frame')
		.uint32('frame_index')
		.array("data", {
			type: new binaryParser().uint16(),
			length: 'bins_in_frame'
		});

	return {
		type: RealtimePacketClass.decode(dgram.class.packet_class),
		stream: dgram.stream,
		sequence: dgram.sequence,
		payload: panadapterParser.parse(dgram.payload)
	};
}

function decode_waterfall(dgram) {
	return {
		type: RealtimePacketClass.decode(dgram.class.packet_class),
		stream: dgram.stream,
		sequence: dgram.sequence,
		payload: dgram.payload
	};
}

// decode_realtime() -- decode data sent from a FlexRadio on the UDP data channel
function decode_realtime(data) {
	function isFlexClass(vita49_dgram) {
		return vita49_dgram.class.oui === VITA_FLEX_OUI &&
			vita49_dgram.class.information_class === VITA_FLEX_INFORMATION_CLASS;
	}

	function isDataStream(vita49_dgram) {
		return vita49_dgram.packet_type == vita49.PacketType.ext_data_stream;
	}

	const vita49_dgram = vita49.decode(data);
	if (isFlexClass(vita49_dgram) && isDataStream(vita49_dgram)) {
		const packet_class = RealtimePacketClass.decode(vita49_dgram.class.packet_class);
		
		switch (vita49_dgram.class.packet_class) {
			case RealtimePacketClass.meter:
				return decode_meters(vita49_dgram);

			case RealtimePacketClass.panadapter:
				return decode_panadapter(vita49_dgram);

			case RealtimePacketClass.waterfall:
				return decode_waterfall(vita49_dgram);

			case RealtimePacketClass.discovery:
				const discovery_payload = new TextDecoder().decode(vita49_dgram.payload);
				return decode_discovery(discovery_payload);
				
			default:
				return {
					type: packet_class,
					payload: vita49_dgram
				};
		}
	}
}

// encode_request() -- encode a FlexRadio command/request to be sent on the TCP control stream
function encode_request(sequence, request) {
	return 'C' + sequence + '|' + request.toString();
}

module.exports = {
	response_code: ResponseCode.decode,
	decode: decode,
	decode_realtime: decode_realtime,
	decode_discovery: decode_discovery,
	encode_request: encode_request
};
