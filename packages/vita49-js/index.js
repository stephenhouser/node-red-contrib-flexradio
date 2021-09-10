// http://wiki.flexradio.com/index.php?title=Discovery_protocol
// https://github.com/kc2g-flex-tools/flexclient
// https://discourse.nodered.org/t/vita-49-decoding/20792
// https://github.com/K3TZR/xLib6000/blob/master/Sources/xLib6000/Supporting/Vita.swift
// https://community.flexradio.com/discussion/7063537/meter-packet-protocol

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

function decode(raw_data) {
	if (!raw_data || !(raw_data instanceof Uint8Array)) {
		return null;
	}

	const data = new DataView(raw_data.buffer);
	const vita = {};

	// Decode the header flags
	const packet_flags_high = data.getUint8(0, false);
	vita.packet_type = packet_flags_high >> 4 & 0x0F;
	const has_class = (packet_flags_high & 0x08) ? 1 : 0;
	const has_trailer = (packet_flags_high & 0x04) ? 1 : 0;
	// reserved = packet_flags_high & 0x02;
	// reserved = packet_flags_high & 0x01;

	const packet_flags_low = data.getUint8(1, false);
	const tsi_type = packet_flags_low >> 6 & 0x03;
	const tsf_type = packet_flags_low >> 4 & 0x03;
	vita.count = packet_flags_low & 0x0F;

	vita.packet_size = data.getUint16(2, false) * 4;
	if (vita.packet_size !== data.byteLength) {
		return null;
	}

	let header_byte = 4;
	if ((vita.packet_type === PacketType.if_data_stream) ||
		(vita.packet_type === PacketType.ext_data_stream)) {
		// 32 bit packet stream identifier
		vita.stream_id = data.getUint32(header_byte, false);
		header_byte += 4;
	}

	if (has_class) {
		vita.class = {};

		// 64 bit class identifier
		// 32 bits OUI
		vita.class.oui = data.getUint32(header_byte, false);
		header_byte += 4;

		// 16 bits information class code
		// 16 bits packet class code
		vita.class.information_class = data.getUint16(header_byte, false);
		header_byte += 2;

		vita.class.packet_class = data.getUint16(header_byte, false);
		header_byte += 2;
	}

	// vita.tsi_type = tsi_type;
	if (tsi_type) {
		vita.timestamp_int = {};

		vita.timestamp_int.type = TimeStampIntegerType.decode(tsi_type);
		vita.timestamp_int.seconds = data.getUint32(header_byte, false);
		header_byte += 4;
	}

	// vita.tsf_type = tsf_type;
	if (tsf_type) {
		vita.timestamp_frac = {};
		vita.timestamp_frac.type = TimeStampFractionType.decode(tsf_type);
		vita.timestamp_frac.fraction = data.getBigInt64(header_byte, false);
		header_byte += 8;
	}

	// vita.payload = raw_data.slice(header_byte);
	vita.payload = raw_data.subarray(header_byte);

	// TODO: Vita Trailier... 4 bytes at end
	if (has_trailer) {
		vita.trailer = null;
	}

	return vita;
}

function encode(msg) {
	// TODO: Implement encoding of VITA-49 datagrams (for sending meter data)
	return msg;
}

module.exports = {
	decode: decode,
	encode: encode,
	PacketType: PacketType
};
