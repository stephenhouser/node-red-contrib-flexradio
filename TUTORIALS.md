# Tutorials for node-red-contrib-flexradio

The following are a list of tutorials for using the `node-red-contrib-flexradio` nodes in your flows. If you are new to the nodes, start with the _Installation and Overview_.

## NodeRed/FlexRadio Introduction and Overview (complete v0.7.8)

YouTube: [NodeRed/FlexRadio Introduction and Overview](https://www.youtube.com/watch?v=8TXno7R7i2Y&t=16s)

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

### Script

* dashboard node
	- serial, radio_license_id
* debug node
* text - radio name -- nickname
* text - model number -- model
* text - version - version
* text - callsign - callsign
* text - status - status
* text - stations - gui_client_stations
* trigger - 5s {"status": "off" }
* inject - on startup {"status": "off"}
* change - flow.discovery = msg.payload

## NodeRed/FlexRadio Messages and Status

**TODO**

Describe the `flexradio-messages` node, the types of data from the radio that it will emit, how to use the topic filter settings, and how to decode data it injects.

### Script

* Messages vs Status vs Connection
* Topic filtering
* on connected to radio (connection/tcp)
* watch for state (interlock) changes
	* we can watch for Transmit
* drop a sub slice all request node
	* now we can watch for audio level changes
	* now we can watch for RF frequency changes

* Now lets build something useful, monitor audio level
* Connect "connection/tcp" node to reuqest "sub slice all" when payload === 'connected'
* drop a function node that shows payload as node.status for audio level


## NodeRed/FlexRadio Sending Requests / Commands

**TODO**

## NodeRed/FlexRadio Monitoring Radio Meters

**TODO**

## NodeRed/FlexRadio Radio Controls

**TODO**
