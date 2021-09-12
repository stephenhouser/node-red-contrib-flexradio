# Demonstration Script

## Discovery

1. drop discovery node on flow
2. drop debug node and watch output
3. drop change, flow.discovery = msg.payload and discovery_time to timestamp
3. build simple dashboard UI to show
    - radio name
4. add timer to "turn off" panel when no discovery packets in a while

## Requests and Status Messages

1. drop inject 'sub slice 0'
2. drop -message and topic 'slice/0'
3. drop switch, if msg.payload has key RF_frequency
4. drop change, set msg.payload to msg.payload.RF_frequency
5. drop function to show freqency in flow

```
node.status({fill:"green",shape:"dot",text:msg.payload});
return msg;
```


## Meters

Fan speed

1.