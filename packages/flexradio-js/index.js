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

const vita_discovery_stream = 0x00000800;
const vita_flex_oui = 0x00001c2d;
const vita_flex_information_class = 0x534cffff;

const parser = require('./flex-parser');

const PacketClassCode = {
	meter          : 0x8002,
	panadapter     : 0x8003,
	waterfall      : 0x8004,
	opus           : 0x8005,
	daxReducedBw   : 0x0123,
	daxIq24        : 0x02e3,
	daxIq48        : 0x02e4,
	daxIq96        : 0x02e5,
	daxIq192       : 0x02e6,
	daxAudio       : 0x03e3,
	discovery      : 0xffff,
};

function decode_packet_class(packet_class_code) {
	var pcc = packet_class_code
	if (typeof(pcc) != 'number') {
		pcc = parseInt(pcc, 16);
	}
	switch (pcc) {
		case 0x8002:	return 'meter';
		case 0x8003:	return 'panadapter';
		case 0x8004:	return 'waterfall';
		case 0x8005:	return 'opus';
		case 0x0123:	return 'daxReducedBw';
		case 0x02e3:	return 'daxIq24';
		case 0x02e4:	return 'daxIq48';
		case 0x02e5:	return 'daxIq96';   
		case 0x02e6:	return 'daxIq192';
		case 0x03e3:	return 'daxAudio';
		case 0xffff:	return 'discovery';
	}

	return 'unknown';
}

function decode_response_code(response_code) {
	var rc = response_code
	if (typeof(rc) != 'number') {
		rc = parseInt(rc, 16);
	}
	switch (rc) {
		case 0x00000000:    return 'success';
		case 0x5000002C:    return 'incorrect number of parameters';
		case 0x50001000:    return '';
		case 0x50000015:    return 'unknown command';
	}

	return 'unknown error';   
}

function decode(response) {
	// use PEGJS parser to parse response payloads.
	try {
		const parsed = parser.parse(response);
		return parsed;
	} catch (error) {
		console.log(error);
	}

	return null;
}

function decode_discovery(payload) {
	const radio = {};
	const fields = payload.split(' ');
	for (var i = 0; i < fields.length; i++) {
		const [key, value] = fields[i].split('=');
		radio[key] = value;
	}

	return {
		type: 'discovery',
		radio: radio
	};
}

function decode_meter(raw_data) {
	if (!raw_data || !(raw_data instanceof Uint8Array)) {
		return null;
	}

	const data = new DataView(new Uint8Array(raw_data).buffer);
	const meter_data = {};
	for (var idx = 0; idx < data.byteLength; idx += Uint32Array.BYTES_PER_ELEMENT) {
		const meter_index = data.getUint16(idx, false);
		const meter_value = data.getUint16(idx + 2, false);
		meter_data[meter_index] = meter_value;
	}

	return {
		type: 'meter',
		meters: meter_data
	}
}

function encode_request(sequence, request) {
	return 'C' + sequence + '|' + request.toString() + '\n';
}

module.exports = {
	packet_class: decode_packet_class,
	response_code: decode_response_code,

	decode: decode,
	decode_discovery: decode_discovery,
	decode_meter: decode_meter,

	encode_request: encode_request
};
