# Protocols and Data Formats Across Layers

This document shows by example the data format as it is moves through the layers of the `node-red-contrib-flexradio` code. Each section shows what the *Raw TCP data* looks like, then how the parser in `flexradio-js` interprets that raw data, and finally what the `node-red-contrib-flexradio` nodes will output from the same data.

These are used to document what we want the data to look like and can be used as test cases.

## Discovery messages

### Raw TCP data
### Parser/Radio.js output

### Node/flexradio-message output


## Version messages

There will be one of these at connection time. They are not sent thereafter. This is the version of the protocol.

### Raw TCP data
```
V1.4.0.0
```

### Parser/Radio.js output
```
{
  "type": "version",
  "payload": {
    "version": "1.4.0.0",
    "major": 1,
    "minor": 4,
    "patch": 0,
    "build": 0
  }
}
```

### Node/flexradio-message output
```
{
  "topic": "version",
  "payload": {
    "version": "1.4.0.0",
    "major": 1,
    "minor": 4,
    "patch": 0,
    "build": 0
    }
}
```

## Handle messages

There will be one of these at connection time. They are not sent thereafter. This is the handle assigned to the connected client.

### Raw TCP data
```
H18A12655
```

### Parser/Radio.js output
```
{
  "type": "handle",
  "payload": "18A12655"
}
```

### Node/flexradio-message output
```
{
  "topic": "handle",
  "payload": "18A12655"
}
```

## Message messages

These are sent asynchronously acrocss the socket during the connection.

### Raw TCP data
```
M10000001|Client connected from IP 192.168.10.25
```

### Parser/Radio.js output
```
{
  "type": "message",
  "message_id": 10000001,
  "payload": "Client connected from IP 192.168.10.25"
}
```

### Node/flexradio-message output
```
{
  "topic": "message",
  "message_id": 10000001,
  "payload": "Client connected from IP 192.168.10.25"
}
```

## Status messages

These are sent asynchronously acrocss the socket during the connection.
### Raw TCP data
```
S18A12655|radio filter_sharpness VOICE level=2 auto_level=1
```

### Parser/Radio.js output
```
{
  "type": "status",
  "client": "18A12655",
  "topic": "radio/filter_sharpness/VOICE",
  "payload": {
    "level": "2",
    "auto_level": "1"
  }
}
```

### Node/flexradio-message output
```
{
  "topic": "status",
  "client": "18A12655",
  "topic": "radio/filter_sharpness/VOICE",
  "payload": {
    "level": "2",
    "auto_level": "1"
  }
}
```


## Response messages

These are received as direct responses to a command/request that was previously sent to the radio.

### Raw TCP data
```
>>> C3|client ip
R3|0|192.168.10.25

>>> C6|info
R6|0|model="FLEX-6600",chassis_serial="0621-1104-6601-1641",name="Flex-6600M",callsign="N1SH",gps="Not Present",atu_present=1,num_scu=2,num_slice=4,num_tx=1,software_ver=3.2.34.3128,mac=00:1C:2D:05:1A:68,ip=192.168.10.27,netmask=255.255.255.0,gateway=192.168.10.1,location="",region="USA",screensaver=model,options="None"

>>> C7|version
R7|0|SmartSDR-MB=3.2.34.3128#PIC-DECPU=1.0.3.0#PSoC-MBPA100=3.0.1.1#FPGA-MB=0.0.23.205

>>> C8|ant list
R8|0|ANT1,ANT2,RX_A,RX_B,XVTA,XVTB

>>> C9|mic list
R9|0|MIC,BAL,LINE,ACC,PC

>>> C43|display panafall rfgain_info 0x0
R43|50000029|
```

### Parser/Radio.js output
```
{
  "type": "response",
  "sequence_number": 3,
  "response_code": "0",
  "topic": null,
  "payload": "192.168.10.25"
}

{
  "type": "response",
  "sequence_number": 6,
  "response_code": "0",
  "topic": "info",
  "payload": {
    "model": "FLEX-6600",
    "chassis_serial": "0621-1104-6601-1641",
    "name": "Flex-6600M",
    "callsign": "N1SH",
    "gps": "Not Present",
    "atu_present": "1",
    "num_scu": "2",
    "num_slice": "4",
    "num_tx": "1",
    "software_ver": "3.2.34.3128",
    "mac": "00:1C:2D:05:1A:68",
    "ip": "192.168.10.27",
    "netmask": "255.255.255.0",
    "gateway": "192.168.10.1",
    "location": "",
    "region": "USA",
    "screensaver": "model",
    "options": "None"
  }
}

{
  "type": "response",
  "sequence_number": 7,
  "response_code": "0",
  "topic": "version",
  "payload": {
    "SmartSDR-MB": "3.2.34.3128",
    "PIC-DECPU": "1.0.3.0",
    "PSoC-MBPA100": "3.0.1.1",
    "FPGA-MB": "0.0.23.205"
  }
}

{
  "type": "response",
  "sequence_number": 8,
  "response_code": "0",
  "topic": null,
  "payload": "ANT1,ANT2,RX_A,RX_B,XVTA,XVTB"
}

{
  "type": "response",
  "sequence_number": 9,
  "response_code": "0",
  "topic": null,
  "payload": "MIC,BAL,LINE,ACC,PC"
}

{
  "type": "response",
  "sequence_number": 43,
  "response_code": "50000029",
  "topic": null,
  "payload": null
}
```

### Node/flexradio-request output
```
{
  "request": "client ip",

  "topic": null,
  "sequence_number": 3,
  "response_code": "0",
  "payload": "192.168.10.25"
}

{
  "request": "info",

  "topic": "info",
  "sequence_number": 6,
  "response_code": "0",
  "payload": {
    "model": "FLEX-6600",
    "chassis_serial": "0621-1104-6601-1641",
    "name": "Flex-6600M",
    "callsign": "N1SH",
    "gps": "Not Present",
    "atu_present": "1",
    "num_scu": "2",
    "num_slice": "4",
    "num_tx": "1",
    "software_ver": "3.2.34.3128",
    "mac": "00:1C:2D:05:1A:68",
    "ip": "192.168.10.27",
    "netmask": "255.255.255.0",
    "gateway": "192.168.10.1",
    "location": "",
    "region": "USA",
    "screensaver": "model",
    "options": "None"
  }
}

{
  "request": "version",

  "topic": "version",
  "sequence_number": 7,
  "response_code": "0",
  "payload": {
    "SmartSDR-MB": "3.2.34.3128",
    "PIC-DECPU": "1.0.3.0",
    "PSoC-MBPA100": "3.0.1.1",
    "FPGA-MB": "0.0.23.205"
  }
}

{
  "request": "ant list",

  "sequence_number": 8,
  "response_code": "0",
  "topic": null,
  "payload": "ANT1,ANT2,RX_A,RX_B,XVTA,XVTB"
}

{
  "request": "mic list",

  "sequence_number": 9,
  "response_code": "0",
  "topic": null,
  "payload": "MIC,BAL,LINE,ACC,PC"
}

{
  "request": "display panafall rfgain_info 0x0",

  "sequence_number": 43,
  "response_code": "50000029",
  "topic": null,
  "payload": null
}
```

## Meter updates

These are re

### Raw UDP data

A bit too binary to express here. The [FlexRadio wiki](http://wiki.flexradio.com/index.php?title=Main_Page) has some information in the *Metering Protocol* section. More details can be found from other locations:

 * https://github.com/kc2g-flex-tools/flexclient
 * https://discourse.nodered.org/t/vita-49-decoding/20792
 * https://github.com/K3TZR/xLib6000/blob/master/Sources/xLib6000/Supporting/Vita.swift
 * https://community.flexradio.com/discussion/7063537/meter-packet-protocol

### Parser/Radio.js output

The payload will contain a dictionary/object with a key for each meter number being reported. Count is usually ignored but allows for detecting missed packets and packet sequence.

```
{
    "type":"meter",
    "count":1,
    "stream_id":1792,
    "payload": {
        "1": 39936,
        "19": 0,
        "21":128
    }
}
```

### Node/flexradio-message output

```
# When "Value and Context" is selected
{
    "topic": "TX-/8/CODEC",
    "payload": {
        "src": "TX-",
        "num": "8",
        "nam": "CODEC",
        "low": "-150.0",
        "hi": "20.0",
        "desc": "Signal strength of CODEC output",
        "unit": "dBFS",
        "fps": "10",
        "value": "-250.0"
    }
}

# When "Value Only" is selected
{
    "topic": "TX-/1/FWDPWR",
    "payload": 0
}

{
    "topic": "TX-/3/SWR"
    "payload": 1.2
}
```

Meters that the system does not know about, e.g. does not have the proper context information, are still reported but with much less information. The following example is assuming the same `Radio.js` output as above but where the system does not have the context information for the meters.

```
{
    "topic":"meter/1",
    "payload": 39936
}

{
    "topic":"meter/19",
    "payload": 0
}

{
    "topic":"meter/21",
    "payload": 128
}
```
