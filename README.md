# FlexRadio 6xxx NodeRed Nodes

The modules in this (mono)repository are as follows:

NodeRed Nodes:

- VITA-49 encoder/decoder nodes for NodeRed
- FlexRadio 6xxx Discovery Message decoder node for NodeRed

Support Libraries:

- VITA-49 datagram encoder/decoder library
- FlexRadio 6xxx discovery message encoder/decoder

- flex-decode

## flexradio-discovery

Connected to a UDP/VITA-49 node, output discovery messages

## flexradio-meter

Connected to a UDP/VITA-49 node, output meter messages

## flexradio-request

Connected to a flex-config node to accept flex commands and send response codes.

Sends commands from input and the response codes from those commands to the output of the node. May emit messages that are not a result of a command.

## flexradio-server

Configuration node that manages a TCP/IP connection to a flex radio.

Configuration:
    - host
    - port
    - station_name
    - slice | headless

Connects to host/port and to either the given slice (A, B, C, D) of station station_name or creates a new station_name in headless mode.

