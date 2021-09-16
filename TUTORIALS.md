# Tutorials for node-red-contrib-flexradio

The following are a list of tutorials for using the `node-red-contrib-flexradio` nodes in your flows. If you are new to the nodes, start with the _Installation and Overview_.

## NodeRed/FlexRadio Installation and Overview (complete v0.3.2)

**Needs to be Updated**

YouTube: [NodeRed Contrib FlexRadio v0.3.2 Install and Use](https://youtu.be/x9Ga6DZKIGI)

How to install and configure the `node-red-contrib-flexradio` nodes in your existing NodeRed instance. Basic overview of the nodes provided by the package and their uses.

The nodes and links to video tutorial of each:

* `flexradio-request` node to send commands to a radio (and get responses)
* `flexradio-message` node that injects messages and status from a radio into the flow
* `flexradio-meter` node that injects meter data from a radio (NOT WORKING)
* [`flexradio-discovery`](https://youtu.be/imn7q8B6PoM) node that injects radio discovery messages into the flow
* `flexradio-radio` configuration node that manages communication with radios

### Script

#### Install
- install from palette
- show the nodes
	- request
	- message
	- meter
	- discovery

#### Discovery Node
- drop discovery node
- add debug node
- deploy and observe

#### Message Node
- drop message node
- configure message node radio
- configure message node topic
- add debug node
- deploy and observe

#### Request Node
- drop request node
- configure request node
- drop inect node, configure with "info"
- drop debug node
- deploy and observe
- drop another inect node, configure with "meter list"
- deploy and observe

#### Meter Node
- drop meter node
- configure meter node
- drop debug node
- change request inect node, configure with "sub meter RAD/3/MAINFAN"
- deploy and observe

## NodeRed/FlexRadio Discovery Dashboard (complete v0.7.7)

YouTube: [NodeRed/FlexRadio Discovery Dashboard](https://youtu.be/imn7q8B6PoM)

Using `node-red-contrib-flexradio` nodes within NodeRed to create a simple dashboard that shows basic information about your radio (model, version, callsign)

* NodeRed -- https://nodered.org
* NodeRed Dashboard -- https://flows.nodered.org/node/node-red-dashboard
* FlexRadio Nodes -- https://flows.nodered.org/node/node-red-contrib-flexradio

## NodeRed/FlexRadio Messages and Status

**TODO**

## NodeRed/FlexRadio Sending Requests / Commands

**TODO**

## NodeRed/FlexRadio Monitoring Radio Meters

**TODO**

## NodeRed/FlexRadio Radio Controls

**TODO**
