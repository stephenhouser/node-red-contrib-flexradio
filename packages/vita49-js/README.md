# VITA-49 Packet decoder for JavaScript

A simple JavaScript libray to decode the VITA-49 (UDP) data sent by FlexRadio 6xxx series radios.

Primarily intended to be used with [flexradio-js](https://github.com/stephenhouser/node-red-contrib-flexradio/packages/flexradio-js) package to receive discovery and realtime data updates from FlexRadio 6xxx series software defined radios.

Really there is only one major interface point for the library, `decode` and it's used thusly:

```
const vita49 = require('vita49');

// binary data received from the radio
const discovery_data = ...

const vita49_message = vita49.decode(data);

console.log(vita49_message.stream_id);
console.log(vita49_message.class.oui);
console.log(vita49_message.class.information_class);
console.log(vita49_message.class.packet_class);
console.log(vita49_message.payload);
```