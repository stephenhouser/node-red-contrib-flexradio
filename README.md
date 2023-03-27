# FlexRadio 6xxx Node-RED Nodes

This repository provides a number of [Node-RED](https://nodered.org) nodes to
interact with [FlexRadio 6xxx](http://flexradio.com) series software defined
and network attached radios.

![Dashboard](packages/node-red-contrib-flexradio/examples/dashboard.png)

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

For a more thorough explanation of how to use these nodes in your flows please refer to the documentation for the main package provided in this repository:

[node-red-contrib-flexradio/README.md](packages/node-red-contrib-flexradio/README.md)

## Issues

Please use the [GitHub issues](https://github.com/stephenhouser/node-red-contrib-flexradio/issues) tab above to report problems with these nodes. Be as precise as you can with the problem and include any log data you may have captured.