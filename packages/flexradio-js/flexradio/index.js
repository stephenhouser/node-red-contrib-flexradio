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

function decode_key_value(pairs) {
	values = {};
	pairs.forEach(
		m => {
		  var [k, v] = m.split('=');
		  values[k] = v.replace(/"/g, '');
		}
  	);

	return values;
}

function decode_response(response) {
	//console.log('decode_response:' + response);
	const clean_data = response.replace(/\r?\n|\r/, '');

	const message = clean_data.split('|');
	const message_type = message[0].substring(0, 1);
	const message_id = Number(message[0].substring(1));

	switch (message_type) {
		case 'R':
			return decode_command_response(message);
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

function decode_command_response(message) {
	return {
		type: 'response',
		sequence_number: Number(message[0].substring(1)),
		response_code: Number(message[1]),
		message: message[2]
	};
}

function decode_status(message) {
	return {
		type: 'status',
		handle: message[0].substring(1),
		message: message[1]
	};
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
	matches = payload.match(/[^ ]+=[^ ]+/g);
	return decode_key_value(matches);
}

function decode_info(payload) {
	matches = payload.match(/[^,]+=[^,]+/g);
	return decode_key_value(matches);
}

function decode(payload) {
	const clean_payload = payload.toString('utf8');

	if (clean_payload.includes(',')) {
		return info_decoder(clean_payload);
	} else {
		return discovery_decoder(clean_payload);
	}

	return null;
}

function encode_request(sequence, request) {
	return 'C' + sequence + '|' + request.toString() + '\n';

}

function encode(msg) {
}

module.exports = {
	decode: decode,
	encode: encode,
	packet_class: decode_packet_class,
	response_code: decode_response_code,
	decode_status: decode_status,
	decode_message: decode_message,
	decode_discovery: decode_discovery,
	decode_info: decode_info,
	decode_response: decode_response,
	encode_request: encode_request
};
