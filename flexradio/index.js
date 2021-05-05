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

function decode(payload) {
	const clean_payload = payload.toString('utf8');

	var matches = [];
	if (clean_payload.includes(',')) {
		matches = clean_payload.match(/[^,]+=[^,]+/g);
	} else {
		matches = clean_payload.match(/[^ ]+=[^ ]+/g);
	}

	var discovery = {};	
	matches.forEach(
  		m => {
    		var [k, v] = m.split('=');
    		discovery[k] = v.replace(/"/g, '');
  		}
	);

	return discovery;
}

function encode(msg) {
}

module.exports = {
	packet_class: PacketClassCode,
	decode: decode,
	encode: encode
};
