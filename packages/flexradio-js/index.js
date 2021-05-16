// http://wiki.flexradio.com/index.php?title=Discovery_protocol
// https://github.com/kc2g-flex-tools/flexclient
// https://discourse.nodered.org/t/vita-49-decoding/20792
// https://github.com/K3TZR/xLib6000/blob/master/Sources/xLib6000/Supporting/Vita.swift
// https://community.flexradio.com/discussion/7063537/meter-packet-protocol

const vita_discovery_stream = 0x00000800;
const vita_flex_oui = 0x00001c2d;
const vita_flex_information_class = 0x534cffff;

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
	//console.log('decode_response:' + response);
	const clean_data = response.replace(/\r?\n|\r/, '');

	const message = clean_data.split('|');
	const message_type = message[0].substring(0, 1);
	// const message_id = Number(message[0].substring(1));

	switch (message_type) {
		case 'R':
			return decode_response(message);
		case 'S':
			return decode_status(message);
		case 'M':
			return decode_message(message);
		case 'H':
			return decode_handle(message);
		case 'V':
			return decode_version(message);
	}

	return null;
}

function decode_response(message) {
	return {
		type: 'response',
		sequence_number: Number(message[0].substring(1)),
		response_code: Number(message[1]),
		message: decode_response_payload(message[2])
	};
}

function _decode_response_payload(fields) {
	if (!fields || fields.length == 0 || fields[0] == '') {
		return {};
	}

	const field = fields[0];
	const remainder = fields.slice(1);
	const response = _decode_response_payload(remainder);

	const [key, value] = decode_key_value(field);
	if (key) {
		if (key.includes('.')) {
			const [major_key, minor_key] = key.split('.');
			if (!response[major_key]) {
				response[major_key] = {};
			}

			response[major_key][minor_key] = value;
		} else {
			response[key] = value;
		}
	} else {
		return value;
	}

	return response;
}

function decode_response_payload(payload) {
	function payload_splitter(payload) {
		if (payload.startsWith('model=')) {				// 'info'
			return payload.split(',');
		} else if (payload.startsWith('meter ')) {		// 'meter list'
			return ['meter', ...payload.substring(6).split('#')];
		}

		return payload.split(' ');
	}

	const fields = payload_splitter(payload);
	return _decode_response_payload(fields);	
}


function decode_status(message) {
	let topic = null;
	const status = {};

	let collect_topic = true;
	const fields = message[1].split(' ');
	for (var i = 0; i < fields.length; i++) {
		const field = fields[i];
		if (field.includes('=')) {
			const [key, value] = decode_key_value(field);
			status[key] = value;
			collect_topic = false;
		} else if (collect_topic && field.length >= 1) {
			topic = topic ? topic + '/' + field : field;
		}
	}

	return {
		type: 'status',
		handle: message[0].substring(1),
		topic: topic,
		status: status
	}
}

function decode_message(message) {
	return {
		type: 'message',
		message_id: Number(message[0].substring(1)),
		message: message[1]
	};
}

function decode_handle(message) {
	return { 
		type: 'handle',
		handle: message[0].substring(1)
	};
}

function decode_version(message) {
	return { 
		type: 'version',
		version: message[0].substring(1)
	};
}

function decode_discovery(payload) {
	const discovery = {};
	const fields = payload.split(' ');
	for (var i = 0; i < fields.length; i++) {
		const [key, value] = fields[i].split('=');
		discovery[key] = value;
	}

	return discovery;
}

function decode_meter(raw_data) {
	if (!raw_data || !(raw_data instanceof Uint8Array)) {
		return null;
	}

	const data = new DataView(new Uint8Array(raw_data).buffer);
	const meter_data = {};
	for (var idx = 0; idx < data.byteLength; idx += Uint32Array.BYTES_PER_ELEMENT) {
		const meter_identifier = data.getUint16(idx, false);
		const meter_value = data.getUint16(idx + 2, false);
		meter_data[meter_identifier] = { value: meter_value };
	}

	return meter_data;
}

function decode_key_value(kv) {
	if (kv.includes('=')) {
		const [key, value] = kv.split('=');
		var clean_value = value.replace(/"/g, '');
		if (value.includes(',')) {
			clean_value = value.split(',');
		}

		return [key, clean_value];
	}

	if (kv.includes(',')) {
		return [null, kv.split(',')];
	}

	return kv;
}

function encode_request(sequence, request) {
	return 'C' + sequence + '|' + request.toString() + '\n';
}

function encode(msg) {
}

module.exports = {
	packet_class: decode_packet_class,
	response_code: decode_response_code,

	decode: decode,
	decode_status: decode_status,
	decode_message: decode_message,
	decode_discovery: decode_discovery,
	decode_response: decode_response,
	decode_meter: decode_meter,

	encode: encode,
	encode_request: encode_request
};
