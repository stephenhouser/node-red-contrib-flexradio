# FlexRadio 6xxx Node-RED Nodes

This repository provides a number of [Node-RED](https://nodered.org) nodes to 
interact with [FlexRadio 6xxx](http://flexradio.com) series software defined
and network attached radios.

![Dashboard](packages/node-red-contrib-flexradio/examples/dashboard.png) ![Dashboard](examples/dashboard.png)

The nodes in this collection are as follows:

- `flexradio-request` node to send commands to a radio (and get responses)
- `flexradio-message` node that injects messages and status from a radio into the flow
- `flexradio-meter` node that injects meter data from a radio
- `flexradio-stream` node that injects streaming data from radio (panadapter, waterfall, audio)
- `flexradio-radio` configuration node that manages communication with radios
- `flexradio-discovery` node that injects radio discovery messages into the flow

The following support libraries are dependencies of these Node-RED nodes. They should be automatically installed when you install the `node-red-contrib-flexradio` nodes. They are contained in the same source repository and listed here for completeness sake. These provide two additional nodes to access some of the internal decoding functions of the `flexradio-js` and `vita49-js` libraries for testing. They should not be used under normal circumstances.

- `flexradio-decode` node that will run the internal decoder on TCP messages (used for development and debugging only)
- `vita49-decode` node that will run the internal decoder on TCP messages (used for development and debugging only)

- [VITA-49 datagram encoder/decoder library](https://github.com/stephenhouser/node-red-contrib-flexradio/tree/master/packages/vita49-js)
- [FlexRadio 6xxx discovery message encoder/decoder](https://github.com/stephenhouser/node-red-contrib-flexradio/tree/master/packages/flexradio-js)

## Using these nodes in your flows

The `examples` directory has the example flows shown below. You can install this flow in your Node Red instance from Import / Examples. You will have to set the radio address to make the flows work with your setup.

There are also a handful of videos on YouTube: [https://www.youtube.com/playlist?list=PLFeSzqhDMutUQJwLXwDYo94M8RThH9I6U](https://www.youtube.com/playlist?list=PLFeSzqhDMutUQJwLXwDYo94M8RThH9I6U)

The `flexradio-request` node is most likely the first node you will use. It allows you to send requests (or commands if you like) to a radio. You first need to configure the radio connection within the node after you add it to your flow. This radio configuration will be shared by other nodes in your flows, so you should only have to set it up once and you should have only one for each radio you want to connect to. If you have only a single radio, choose _Automatic_. If you have multiple radios on your network, _Discovery_ will allow you to choose the radio to connect to based on it's advertised nickname. _Manual_ will allow you to specify an IP address or DNS host name along with a port. _Dynamic_ configuration is an advanced topic, best left for later explanation.

![Meters](packages/node-red-contrib-flexradio/examples/meters.png) ![Meters](examples/meters.png)

Once you have a `flexradio-request` node in your flow, you can send a request to your radio and see the response. Add an inject node with the payload `info` and a debug node at the other end to see the response from the radio. When you run the flow you should get an object in the debug window with all your radio parameters. In the above example, we send `sub meter 18` to the radio to subscribe to updates on the main fan speed.

You are now ready to look through the [FlexRadio Wiki](http://wiki.flexradio.com/index.php?title=SmartSDR_TCP/IP_API#SmartSDR_TCP.2FIP_Commands) and start sending other requests to your radio. There is a lot you can do with just this simple flow. Try `ant list`, or the more complex `audio client 0 slice 0 gain 20`. Note that the [FlexRadio Wiki](http://wiki.flexradio.com/index.php?title=SmartSDR_TCP/IP_API#SmartSDR_TCP.2FIP_Commands) describes the raw request format with a preceeding _command number_. Something like `C1|`. You don't need to include those in the request you send. The `flexradio-request` node takes care of those details for you. You only need the command itself as described above.

The next step is to start getting some real-time information out of your radio. There are two ways the radio reports this information as it operates and two nodes that get that information into your flows; the `flexradio-message` node and the `flexradio-meter` node. The easier of the two is `flexradio-message`.

The `flexradio-message` will grab status reports and updates from the radio and inject them into your flows. With this node you can see information like `transmit/band/#` which will report (among other things) the RF power being used for transmitting. Note the format of the *topic* in that last sentence. These nodes use the same format that MQTT uses for subscribing to topics when we want to monitor events from the radio. This one in particular is looking for a `transmit` on a `band` where that band is *any* band (the `#`). NOTE: To get RF power updates this way, you need to have a station connected to the radio and first issue a `sub client all` request to your radio.

You cah use the topic `#` or an empty topic to have the `flexradio-message` node inject *all* the status messages from the radio into your flow. This is a great way to learn and understand what your radio is sending and what you can act upon.

The other node for getting data out of your radio is the `flexradio-meter` node. This node will generate a *lot* more data into your flow and can easily generate *too much* data if not used carefully. This node allows the *real-time meter data* from the radio to be injected into the flow. These are data like the SWR while transmitting, the actual forward power, and the system temperature. You can put a `flexradio-meter` node into your flow and configure it much like the `flexradio-messages` node; with a radio and a topic.

The `flexradio-meter` node will not get any data until you tell your radio to start sending those meter data to it. Start with a `meter list` request to get the list of meters available. Make a note of the meter number that you want. Then you can tell the radio to start sending them to your flow with a `sub meter` request. You can also use `sub meter all` to send all the meter data if you like. Then you can use the *topic* of the `flexradio-meter` node to filter what you want where.

## Topics

These nodes draw on and emulate many of the concepts from the [Node-RED MQTT nodes](https://cookbook.nodered.org/#mqtt). They adapt the radio's messages and status updates to an MQTT *topic* system and adopt the MQTT topic *wildcard* patterns (using `+` and `#`). The [MQTT man page](https://mosquitto.org/man/mqtt-7.html) has some good detail on how these wildcards and MQTT topics work. It's worth reading to understand the idea of topics and topic matching.

To create *topics* from messages, these nodes use the type of data being received and parts of the message. For example a simple [message](http://wiki.flexradio.com/index.php?title=SmartSDR_TCP/IP_API#Message_Format) from the radio will have a `topic` of `message` and a `payload` corresponding to the message data itself.

Message received from the radio:
```
M10000001|Client connected from IP 192.168.10.25
```

JSON on the output of a `flexradio-message` node:
```
{
  "topic": "message",
  "message_id": "0x10000001",
  "payload": "Client connected from IP 192.168.10.25"
}
```

Status messages get a little more complicated. Their topic is built from the starting tokens (words) of the status message itself. Note in the below example at how the delimited words that don't have a '=' are joined together to create the topic.

Status Message received from the radio:
```
S10C05077|radio filter_sharpness DIGITAL level=2 auto_level=1
```

JSON on the output of a `flexradio-message` node:
```
{
  "topic": "radio/filter_sharpness/DIGITAL",
  "client": "0x10C05077",
  "payload": {
    "level": "2",
    "auto_level": "1"
  }
}
```

Meter updates captured and inected from `flexradio-meter` have a similar construct as status messages. However the radio does not report the meter configuration with each update, so the topic is drawn from an initial `meter list` command and responses when a `sub meter` request is sent. The topic is created from the meter's `SRC`, `NUM`, and `NAM` fields concatenated together with the `/` character.

First a `sub meter` request is sent and gets a response
```
C18|sub meter 1
R18|0|
```

Then asynchronously the meter configuration is reported:
```
S10C05077|meter 1.src=COD-#1.num=3#1.nam=MICPEAK#1.low=-150.0#1.hi=20.0#1.desc=Signal strength of MIC output in CODEC#1.unit=dBFS#1.fps=40#
```

Which would generate output on a `flexradio-message` node if configured and generate the JSON below. **NOTE**: This is *not* the meter data, it is the meter *configuration*.
```
{
  "client": "0x10C05077",
  "topic": "meter",
  "payload": {
    "1": {
      "src": "COD-",
      "num": "3",
      "nam": "MICPEAK",
      "low": "-150.0",
      "hi": "20.0",
      "desc": "Signal strength of MIC output in CODEC",
      "unit": "dBFS",
      "fps": "40"
    }
  }
}
```

Eventually you will start seeing *meter data* on a properly configured `flexradio-meter` node. In the case above, configured with a topic of `COD-/3/MICPEAK`.

## Meter Names

FlexRadio's use meter numbers to identify meters. Unfortunately these numbers change from version to version and even during a session depending on how many slices are active and what equipment is connected to the radio. To enable a more stable system, these nodes allow subscribing and monitoring meters by name rather than their number.

As described above the `flexradio-meter` node assigns a topic to reported meter values using the meter configuration. The topic is created from the meter's `SRC`, `NUM`, and `NAM` fields concatenated together with the `/` character. 

Thus the meter with configuration:
```
{
  "client": "0x10C05077",
  "topic": "meter",
  "payload": {
    "1": {
      "src": "COD-",
      "num": "3",
      "nam": "MICPEAK",
      "low": "-150.0",
      "hi": "20.0",
      "desc": "Signal strength of MIC output in CODEC",
      "unit": "dBFS",
      "fps": "40"
    }
  }
}
```

Will have a topic of `COD-/3/MICPEAK`.

You typically use this topic when sorting out meter data, perhaps in a switch node, or when configuring a `flexradio-meter` node to monitor only a single meter value.

You can also use this meter name when *subscribing* to a meter. NOTE: the `NUM` field of the meter is *different* than the meter number, which is `1` in this example.

```
sub meter COD-/3/MICPEAK
```

Will have the same effect as knowing the meter number and subscribing to it with that number. In this example it was meter `1`, so the above is equivalent to:

```
sub meter 1
```

For even more flexibility, in both `meter sub` requests and `flexradio-meter` nodes we can use MQTT wildcard characters. This means we don't have to know any of the numbers.

The request:
```
sub meter COD-/+/MICPEAK
```

Will search for any active meters that match the MQTT pattern (note the `+` in the middle) and subscribe to any matching meters. The same pattern (`COD-/+/MICPEAK`) can be used on a `flexradio-meter` node to receive updates to those meters.

## Issues

Please use the [GitHub issues](https://github.com/stephenhouser/node-red-contrib-flexradio/issues) tab above to report problems with these nodes. Be as precise as you can with the problem and include any log data you may have captured.