
## Meter data


http://wiki.flexradio.com/index.php?title=Metering_protocol#Meter_Extension_Packet

 dbm 	dBm power, referenced generally to the radio input connector, as described in VITA-49 7.1.5.9. (Two's complement, radix between bits 6/7)
dbfs 	power, referenced to full scale VITA-49 7.1.5.9. (Two's complement, radix between bits 6/7)
volts 	voltage in two's complement volts with ten bits to the right of the radix point and six to the left
amps 	amps in two's complement amps with ten bits to the right of the radix point and six to the left 


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

### Raw TCP data
### Parser/Radio.js output
### Node/flexradio-message output



flex.decode_vita49()
    {
        type: meter
        payload: {
            1: {},
            7: {}
        }
    }


    {
        type: audio...
    }


const meter_data = flex.decode_meter(vita49_message.payload);

    { 1: {}, 7: {}, ///}


if (meter_data && 'meters' in meter_data) {
    // for each meter in payload
    for (const [meter_num, meter_value] of Object.entries(meter_data.meters)) {
        if (meter_num in meters) {
            const meter = meters[meter_num];
            const value = this._scaleMeterValue(meter, meter_value);
            // Only update and emit when the value changes
            if (value != meter.value) {
                meter.value = value;
                this.emit('meter', meter);
            }
        }
    }
}
