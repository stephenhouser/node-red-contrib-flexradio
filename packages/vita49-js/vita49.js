/* vita49-js/index.js - Parser for VITA-49 datagrams
 *
 * 2021/09/19 Stephen Houser, MIT License
 *
 * Some reference materials:
 * http://wiki.flexradio.com/index.php?title=Discovery_protocol
 * https://github.com/kc2g-flex-tools/flexclient
 * https://discourse.nodered.org/t/vita-49-decoding/20792
 * https://github.com/K3TZR/xLib6000/blob/master/Sources/xLib6000/Supporting/Vita.swift
 * https://community.flexradio.com/discussion/7063537/meter-packet-protocol
*/
const binaryParser = require("binary-parser").Parser;

const PacketType = {
	if_data: 0x00,
	if_data_stream: 0x01,
	ext_data: 0x02,
	ext_data_stream: 0x03,
	if_context: 0x04,
	ext_context: 0x05,
	if_cmd_stream: 0x06,
	ext_cmd_stream: 0x07,

	decode: function(type_code) {
		const type_strings = [
			'if_data',
			'if_data_stream',
			'ext_data',
			'ext_data_stream',
			'if_context',
			'ext_context',
			'if_cmd_stream',
			'ext_cmd_stream'
		];

		return type_strings[type_code % type_strings.length];
	}
};

const TimeStampIntegerType = {
	none: 0x00,
	utc: 0x01,
	gps: 0x02,
	other: 0x03,

	decode: function(type_code) {
		const type_strings = [
			'none',
			'utc',
			'gps',
			'other'
		];
		return type_strings[type_code % type_strings.length];
	}
};

const TimeStampFractionType = {
	none: 0x00,
	sampleCount: 0x01,
	realtime: 0x02,
	freeRunning: 0x03,

	decode: function(type_code) {
		const type_strings = [
			'none',
			'sample_count',
			'realtime',
			'free_running'
		];
		return type_strings[type_code % type_strings.length];
	}
};

const nullParser = new binaryParser();

const classIdParser = new binaryParser()
	.uint32('oui')
	.uint16('information_class')
	.uint16('packet_class');

const ifDataParser = new binaryParser();
// TODO: ifDataParser() is not implemented.

const ifDataStreamParser = new binaryParser();
// TODO: ifDataStreamParser() is not implemented.

const extDataParser = new binaryParser();
// TODO: extDataParser() is not implemented.

const extDataStreamParser = new binaryParser()
	.uint32('stream')
	.choice('class', {
		tag: '_class_present',
		choices: {
			0: nullParser,
			1: classIdParser
		}
	})
	.choice('timestamp_int', {
		tag: '_tsi_type',
		defaultChoice: new binaryParser().uint32('seconds'),
		choices: {
			0: nullParser
		}
	})
	.choice('timestamp_frac', {
		tag: '_tsf_type',
		defaultChoice: new binaryParser().uint64('fraction'),
		choices: {
			0: nullParser,
		}
	})
	.saveOffset('_payload_offset')
	.buffer('payload', {
		length: function(vars) {
			return ((vars.packet_size - vars._trailer_present) * 4) - vars._payload_offset;
		}
	});

const ifContextParser = new binaryParser();
// TODO: ifContextParser() is not implemented.

const extContextParser = new binaryParser();
// TODO: extContextParser() is not implemented.

const ifCmdStreamParser = new binaryParser();
// TODO: ifCmdStreamParser() is not implemented.

const extCmdStreamParser = new binaryParser();
// TODO: extCmdStreamParser() is not implemented.

const vita49Parser = new binaryParser()
	.bit4('packet_type')
	.bit1('_class_present')
	.bit2('_reserved')
	.bit1('_trailer_present')
	.bit2('_tsi_type')
	.bit2('_tsf_type')
	.bit4('sequence')
	.uint16('packet_size')
	.choice(null, {
		tag: 'packet_type',
		choices: {
			0x00: ifDataParser,
			0x01: ifDataStreamParser,
			0x02: extDataParser,
			0x03: extDataStreamParser,
			0x04: ifContextParser,
			0x05: extContextParser,
			0x06: ifCmdStreamParser,
			0x07: extCmdStreamParser,
			0x08: nullParser
		}
	});

function decode(data) {
	if (!data || !(data instanceof Uint8Array)) {
		return null;
	}

	const vita49_dgram = vita49Parser.parse(data);
	if (vita49_dgram) {
		// Map the timestamp to a struct
		if (vita49_dgram._tsi_type && vita49_dgram.timestamp_int) {
			vita49_dgram.timestamp_int.type = TimeStampIntegerType.decode(vita49_dgram._tsi_type);
		}

		if (vita49_dgram._tsf_type && vita49_dgram.timestamp_frac) {
			vita49_dgram.timestamp_frac.type = TimeStampFractionType.decode(vita49_dgram._tsf_type);
		}

		// Clean up the '_' properties, they are temporary
		const remove_keys = Object.keys(vita49_dgram).filter(function(key) {
			return key.startsWith('_');
		});
		remove_keys.forEach(function(key) {
			delete vita49_dgram[key];
		});
	}

	return vita49_dgram;
}

function encode(data) {
	// TODO: encode() has not been implemented
	return null;
}

module.exports = {
	decode: decode,
	encode: encode,
	PacketType: PacketType,
	TimeStampIntegerType: TimeStampIntegerType,
	TimeStampFractionType: TimeStampFractionType
};
