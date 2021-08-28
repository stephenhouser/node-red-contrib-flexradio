# flexradio-js FlexRadio 6xxx JavaScript Library

This is a simple JavaScript library that takes advantage of the FlexRadio 6xxx series' network interface. There are no other applications, programs, or libraries needed. This library communicates directly with the radio and offers a JavaScript interface.

## The library offers...

- Radio discovery; listening for and emitting data about radios that are advertising themselves on the local network using the `Discovery` class.

- Command and control of the radio; able to send commands to control the radio and receive responses about success and failure as well as emit informational status messages (TCP-based data).

- Collection of meter and other realtime data sent by the radio to clients (UDP-based data). NOTE: meter data is emitted, panadapter and other data is still a work in progress (May 2021).

## Using the Library

### Setup

The primary way to interact with the library is via the `Radio` class. Once setup the `Radio` will emit asynchronous events for incoming data.

```
const { Radio } = require('flexradio-js/Radio');

const radio = new Radio({ip:'192.168.10.100', port:4992});
radio.on('connected', function() {
    console.log('connected to radio');
});

radio.on('status', function(status) {
    // capture asynchronous status messages
    console.log('received status: ' + JSON.stringify(status));
});

radio.on('meter', function(meter) {
    // capture asynchronous/realtime meter data, need to `sub meter` to get these
    console.log('received meters: ' + JSON.stringify(meter));
});

radio.on('error', function(error) {
    console.log(error);
});

radio.connect();
```

### Emitted Events

#### Connection events:

- `connecting` - trying to connect to radio
- `connected` - connected to radio
- `disconnected` - disconnected from radio
- `listening` - listening for asynchronous data from radio
- `error` - an error in communicating. **Must be caught or will crash!**

#### Data events:

- `message` - an inter-radio message
- `handle` - client handle (sent as part of client connection process)
- `version` - the radio interface version (sent as part of client connection process).
- `status` - asynchronous status update (usually result of a `sub` command)
- `meter` - asynchronous meter update (usually result of a `sub` command)

### Sending Commands

The `Radio` class can also be used to send commands to the radio. 

To change the transmit power to 25:

```
radio.send('transmit rfpower 25', function(response) {
    console.log('recevied response: ' + JSON.stringify(response));
```

To ask the radio to send meter data, which will trigger the `meter` events:

```
radio.send('sub meter 18', function(response) {
    // this response is just an acknoledgement the meter was subscribed to
    // actual meter data will be emitted with the topic `meter` and can be
    // captured as in the example above.
    console.log('recevied response: ' + JSON.stringify(response));
```

## Decoding FlexRadio Data

There is also a decoder for data sent by the radio included as part of this library that can be accessed independently of the `Radio` and `Discovery` classes. The decoder decodes the textual portion of the TCP data the radio sends back to clients. This includes version, handle, message, status, and response messages. 

Normally you will not be needing this as the `Radio` class already decodes these data for you. But, just in case, there it is.
 
```
const flex = require('flexradio');
const message = flex.decode(encoded_message);
```

