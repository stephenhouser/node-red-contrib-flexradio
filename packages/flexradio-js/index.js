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
const vita49 = require('../vita49-js');

const VITA_FLEX_OUI = 0x1c2d;
const VITA_FLEX_INFORMATION_CLASS = 0x534c;

const PacketClassCode = {
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
			case this.meter: return 'meter'; break;
			case this.panadapter: return 'panadapter'; break;
			case this.waterfall: return 'waterfall'; break;
			case this.opus: return 'opus'; break;
			case this.daxReducedBw: return 'daxReducedBw'; break;
			case this.daxIq24: return 'daxIq24'; break;
			case this.daxIq48: return 'daxIq48'; break;
			case this.daxIq96: return 'daxIq96'; break;
			case this.daxIq192: return 'daxIq192'; break;
			case this.daxAudio: return 'daxAudio'; break;
			case this.discovery: return 'discovery'; break;
			default: return 'unknown' + code;
		}
	}
};

// decode() -- decode data sent from a FlexRadio on the TCP control stream.
function decode(response) {
	try {
		// use PEGJS parser to parse response payloads.
		const parsed = parser.parse(response);
		return parsed;
	} catch (error) {
		console.log(error);
	}

	return null;
}

// decode_discovery() -- decode FlexRadio discovery datagrams sent as UDP broadcast messages
function decode_discovery(payload) {
	const radio = {};
	const fields = payload.split(' ');
	for (var i = 0; i < fields.length; i++) {
		const [key, value] = fields[i].split('=');
		radio[key] = value;
	}

	return {
		type: 'discovery',
		payload: radio
	};
}

/*
const VITA_METER_STREAM = 0x00000700;
const VITA_FLEX_OUI = 0x1c2d;
const VITA_FLEX_INFORMATION_CLASS = 0x534c;
const VITA_FLEX_METER_CLASS = 0x8002;
_isRealtimeData(message) {
	return message
		&& message.stream_id == VITA_METER_STREAM
		&& message.class.oui == VITA_FLEX_OUI
		&& message.class.information_class == VITA_FLEX_INFORMATION_CLASS
		&& message.class.packet_class == VITA_FLEX_METER_CLASS;
}
*/
function flex_datagram_type(v49_data) {
	if (v49_data.packet_type == vita49.PacketType.ext_data_stream
		&& v49_data.class.oui == VITA_FLEX_OUI
		&& v49_data.class.information_class == VITA_FLEX_INFORMATION_CLASS ) {

		return v49_data.class.packet_class;
		}

	return 'unknown';
}

const VITA_METER_STREAM = 0x00000700;

// decode_realtime() -- decode data sent from a FlexRadio on the UDP data channel
function decode_realtime(data) {
	const v49_data = vita49.decode(data);
	if (v49_data) {
		const type = flex_datagram_type(v49_data);
		if (type) {
			const decoded_msg = {
				type: PacketClassCode.decode(type),
				count: v49_data.count,
				stream_id: v49_data.stream_id,
			};

			switch (type) {
				case PacketClassCode.meter:
					decoded_msg.payload = decode_meter(v49_data.payload)
					break;

				default:
					decoded_msg.payload = v49_data.payload;
					break;
			}

			return decoded_msg;
		}

		return null;
	}
}

// decode_meter() -- decode FlexRadio meter data received as UDP datagrams
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

	return meter_data;
}

// encode_request() -- encode a FlexRadio command/request to be sent on the TCP control stream
function encode_request(sequence, request) {
	return 'C' + sequence + '|' + request.toString() + '\n';
}

function decode_packet_class(packet_class_code) {
	var pcc = packet_class_code;
	if (typeof (pcc) != 'number') {
		pcc = parseInt(pcc, 16);
	}
	switch (pcc) {
		case 0x8002: return 'meter';
		case 0x8003: return 'panadapter';
		case 0x8004: return 'waterfall';
		case 0x8005: return 'opus';
		case 0x0123: return 'daxReducedBw';
		case 0x02e3: return 'daxIq24';
		case 0x02e4: return 'daxIq48';
		case 0x02e5: return 'daxIq96';
		case 0x02e6: return 'daxIq192';
		case 0x03e3: return 'daxAudio';
		case 0xffff: return 'discovery';
	}

	return 'unknown';
}

function decode_response_code(response_code) {
	var rc = response_code;
	if (typeof (rc) != 'number') {
		rc = parseInt(rc, 16);
	}
	switch (rc) {
		case 0x00000000: return 'success';
		case 0x5000002C: return 'incorrect number of parameters';
		case 0x50001000: return '';
		case 0x50000015: return 'unknown command';
	}

	return 'unknown error';
}


module.exports = {
	packet_class: decode_packet_class,
	response_code: decode_response_code,

	decode: decode,
	decode_realtime: decode_realtime,

	decode_discovery: decode_discovery,
	decode_meter: decode_meter,

	encode_request: encode_request
};
