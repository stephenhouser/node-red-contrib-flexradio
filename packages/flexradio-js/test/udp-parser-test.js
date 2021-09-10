// UDP Client that will send faux FlexRadio data to listeners
const pcap = require('pcap');
const vita49 = require('../../vita49-js');

const flex = require('../index');

const capture_file = process.argv[2];

function udp_packet(packet) {
	if ( packet 
		&& packet.payload.constructor.name == 'EthernetPacket' 
		&& packet.payload.payload
		&& packet.payload.payload.constructor.name == 'IPv4'
		&& packet.payload.payload.payload
		&& packet.payload.payload.payload.constructor.name == 'UDP' ) {
			return packet.payload.payload.payload;
	}

	return null;
}


const VITA_METER_STREAM = 0x00000700;
const VITA_FLEX_OUI = 0x1c2d;
const VITA_FLEX_INFORMATION_CLASS = 0x534c;
const VITA_FLEX_METER_CLASS = 0x8002;

function isFlexMeterStream(message) {
	return message
		&& message.stream_id == VITA_METER_STREAM
		&& message.class.oui == VITA_FLEX_OUI
		&& message.class.information_class == VITA_FLEX_INFORMATION_CLASS
		&& message.class.packet_class == VITA_FLEX_METER_CLASS;
}


const pcap_session = pcap.createOfflineSession(capture_file);
pcap_session.on('packet', function (raw_packet) {
    const packet = pcap.decode.packet(raw_packet);
	if (packet) {
		const u_packet = udp_packet(packet);
		if (u_packet) {
			const data = new Uint8Array(u_packet.data);
			console.log(packet.payload.payload.payload);

			const vita49_message = vita49.decode(data);
			if (isFlexMeterStream(vita49_message)) {
				console.log('METER Data');
				const meter_data = flex.decode_meter(vita49_message.payload);

				console.log(meter_data);
			} else {
				console.log('OTHER Data');
				console.log(vita49_message);
			}
		}
	}
});
