# Development Notes

* Using a monorepo and [lerna](https://github.com/lerna/lerna) to manage the included modules.

* Typically use a docker container to test within


## Make, publish, etc..

1. Make your changes, etc, etc.. 
2. Commit changes. Optional push (lerna will push and tag version)
3. `lerna publish from-git`


### Prerelase

`lerna publish --dist-tag prerelease`

### Updated Radio Ideas

    - push RadioConnection down into sub-object, keep Radio Object top-level
        RadioConnection - maintain TCP and UDP data, send/receive-to-callback, parsing?
        Radio uses RadioConnection, parsing?, manage meters, streams, clients...
        May make it more usable as stand-alone instead of Node-RED specific.

    - create members and maintain in Radio
    	//scus
		//slices
		//panadapters
		//waterfalls
		//cleints

### Dynamic Control -- adapted from MQTT in Node-RED 2.1

-request node
    `msg.action = connect | disconnect`

    - connect needs a radio to connect to:
        msg.radio = { host: '...', port: '...' } -- a.k.a. manual
                    { nickname: '...' } -- from discovery

-stream node
    Action = Subscribe to stream | Dynamic subscription
    if subscribe, show topic field and use as normal
    if dyanmic, hide topic and...
        show input connector
        msg.action = subscribe | unsubscribe
        msg.topic = stream id to subscribe or unsubscribe from

-meter node
    Action = Subscribe to meter | Dynamic subscription
    if subscribe, show topic field and use as normal
    if dyanmic, hide topic and...
        show input connector
        msg.action = subscribe | unsubscribe
        msg.topic = meter to subscribe or unsubscribe from

-messages node

action string
the name of the action the node should perform. Available actions are: "connect", "disconnect", "subscribe" and "unsubscribe".
topic string|object|array
For the "subscribe" and "unsubscribe" actions, this property provides the topic. It can be set as either:
a String containing the topic filter
an Object containing topic and qos properties
an array of either strings or objects to handle multiple topics in one
broker broker
For the "connect" action, this property can override any of the individual broker configuration settings, including:
broker
port
url - overrides broker/port to provide a complete connection url
username
password
If this property is set and the broker is already connected an error will be logged unless it has the force property set - in which case it will disconnect from the broker, apply the new settings and reconnect.

## Panadapter
C19|sub pan all

S10C05077|display pan 0x40000000 client_handle=0x10C05077 wnb=0 wnb_level=0 wnb_updating=0 band_zoom=0 segment_zoom=0 x_pixels=50 y_pixels=20 center=14.100000 bandwidth=0.200000 min_dbm=-125.00 max_dbm=-40.00 fps=25 average=0 weighted_average=0 rfgain=0 rxant=ANT1 wide=0 loopa=0 loopb=0 band=20 daxiq_channel=0 waterfall=0x42000000 min_bw=0.001230 max_bw=14.745601 xvtr= pre= ant_list=ANT1,ANT2,RX_A,RX_B,XVTA,XVTB


003ee1bfc577001c2d051a680800450000ac000040004011a4bcc0a80a1bc0a80a191381137f0098dc06385000244000000000001c2d534c8003613699850000000000000000

0000 3200 0200 3200 0000 0000 10001000100010001000100010000f00100010001000100010001000100010001000100010001000100010001000100010001000100010001000100010001000100010001000100010001000100010001000100010001000100010001000100010001000000000

S10C05077|display waterfall 0x42000000 client_handle=0x10C05077 x_pixels=50 center=14.100000 bandwidth=0.200000 band_zoom=0 segment_zoom=0 line_duration=100 rfgain=0 rxant=ANT1 wide=0 loopa=0 loopb=0 band=20 daxiq_channel=0 panadapter=0x40000000 color_gain=50 auto_black=1 black_level=0 gradient_index=0 xvtr=

C39|display panafall rfgain_info 0x0
S10C05077|display pan 0x40000000 center=14.022560 xvtr=


    "display pan set 0x40000000 xpixels=1024 ypixels=700 fps=10 center=14.1 bandwidth=0.2 min_dbm=-130 max_dbm=-50"

[
    "client gui 8BB112FA-46E0-4002-B9B1-0C7EDC605661",
    "client program xSDR6000",
    "client station xSDR6000",
    "info",
    "version",
    "client set enforce_network_mtu=1 network_mtu=1500",
    "client set send_reduced_bw_dax=0"
]

S10C05077|display pan 0x40000000 rfgain=32 pre=+32dB
S10C05077|display waterfall 0x42000000 rfgain=32

S10C05077|display pan 0x40000000 client_handle=0x10C05077 wnb=0 wnb_level=0 wnb_updating=0 band_zoom=0 segment_zoom=0 x_pixels=50 y_pixels=20 center=14.022560 bandwidth=0.075000 min_dbm=-135.00 max_dbm=-30.00 fps=25 average=50 weighted_average=0 rfgain=32 rxant=ANT1 wide=0 loopa=0 loopb=0 band=20 daxiq_channel=0 waterfall=0x42000000 min_bw=0.001230 max_bw=14.745601 xvtr= pre=+32dB ant_list=ANT1,ANT2,RX_A,RX_B,XVTA,XVTB

S10C05077|display waterfall 0x42000000 client_handle=0x10C05077 x_pixels=50 center=14.022560 bandwidth=0.075000 band_zoom=0 segment_zoom=0 line_duration=87 rfgain=32 rxant=ANT1 wide=0 loopa=0 loopb=0 band=20 daxiq_channel=0 panadapter=0x40000000 color_gain=20 auto_black=1 black_level=1 gradient_index=1 xvtr=


S10C05077|display pan 0x40000000 client_handle=0x10C05077 wnb=0 wnb_level=0 wnb_updating=0 band_zoom=0 segment_zoom=0 x_pixels=50 y_pixels=20 center=14.022560 bandwidth=0.075000 min_dbm=-135.00 max_dbm=-30.00 fps=25 average=50 weighted_average=0 rfgain=32 rxant=ANT1 wide=0 loopa=0 loopb=0 band=20 daxiq_channel=0 waterfall=0x42000000 min_bw=0.001230 max_bw=14.745601 xvtr= pre=+32dB ant_list=ANT1,ANT2,RX_A,RX_B,XVTA,XVTB
S10C05077|display waterfall 0x42000000 client_handle=0x10C05077 x_pixels=50 center=14.022560 bandwidth=0.075000 band_zoom=0 segment_zoom=0 line_duration=87 rfgain=32 rxant=ANT1 wide=0 loopa=0 loopb=0 band=20 daxiq_channel=0 panadapter=0x40000000 color_gain=20 auto_black=1 black_level=1 gradient_index=1 xvtr=

S10C05077|display pan 0x40000000 client_handle=0x10C05077 wnb=0 wnb_level=0 wnb_updating=0 band_zoom=0 segment_zoom=0 x_pixels=50 y_pixels=20 center=14.022560 bandwidth=0.075000 min_dbm=-135.00 max_dbm=-30.00 fps=25 average=50 weighted_average=0 rfgain=32 rxant=ANT1 wide=0 loopa=0 loopb=0 band=20 daxiq_channel=0 waterfall=0x42000000 min_bw=0.001230 max_bw=14.745601 xvtr= pre=+32dB ant_list=ANT1,ANT2,RX_A,RX_B,XVTA,XVTB
S10C05077|display waterfall 0x42000000 client_handle=0x10C05077 x_pixels=50 center=14.022560 bandwidth=0.075000 band_zoom=0 segment_zoom=0 line_duration=87 rfgain=32 rxant=ANT1 wide=0 loopa=0 loopb=0 band=20 daxiq_channel=0 panadapter=0x40000000 color_gain=20 auto_black=1 black_level=1 gradient_index=1 xvtr=
R19|0|

---
C7|stream create type=dax_rx dax_channel=1
R7|0|4000008

S3D63A6E7|slice 0 dax=1 dax_clients=0 
S3D63A6E7|stream 0x04000008 type=dax_rx dax_channel=1 slice=A client_handle=0x3D63A6E7 ip=192.168.10.20
S3D63A6E7|stream 0x04000008 type=dax_rx dax_channel=1 slice=A client_handle=0x3D63A6E7 ip=192.168.10.20

C8|audio stream 0x4000008 slice 0 gain 50
R8|0|

C9|stream create type=dax_tx1
R9|0|84000000
S3D63A6E7|stream 0x84000000 type=dax_tx client_handle=0x3D63A6E7 tx=1 ip=192.168.10.20


S3D63A6E7|stream 0x04000008 removed
S3D63A6E7|stream 0x84000000 removed

---- smart sdr
C22|sub audio_stream all
S4DF2C247|stream 0x04000008 type=dax_rx dax_channel=1 slice=A client_handle=0x7F44809F ip=192.168.10.20
S4DF2C247|stream 0x84000000 type=dax_tx client_handle=0x7F44809F tx=1 ip=192.168.10.20
R2|0|


C26|sub daxiq all
C27|sub dax all



---
## Audio
// node-red-dashboard/src/main.js
            
			if (msg.hasOwnProperty("audio")) {
                if (!window.hasOwnProperty("AudioContext")) {
                    window.AudioContext = window.AudioContext || window.webkitAudioContext || window.mozAudioContext;
                }
                try {
                    audioContext = audioContext || new AudioContext();
                    var buffer = new Uint8Array(msg.audio);
                    audioContext.decodeAudioData(buffer.buffer, function(audioBuffer) {
                        audioStack.push(audioBuffer);
                        while (audioStack.length) {
                            var chunkBuffer = audioStack.shift();
                            var source = audioContext.createBufferSource();
                            source.buffer = chunkBuffer;
                            source.connect(audioContext.destination);
                            if (nextTime == 0) {
                                nextTime = audioContext.currentTime + 0.01;
                            }
                            source.start(nextTime);
                            // Make the next buffer wait the length of the last buffer before being played
                            nextTime += source.buffer.duration;
                        }
                    }, function(e) {
                        console.log("Error decoding audio: " + e);
                    });
                }
                catch (e) { console.log("Error playing audio: " + e); }

                // try {
                //     audioContext = audioContext || new AudioContext();
                //     audioSource = audioContext.createBufferSource();
                //     audioSource.onended = function() {
                //         events.emit('ui-audio', 'complete');
                //     }
                //     var buffer = new Uint8Array(msg.audio);

                //     audioContext.decodeAudioData(
                //         buffer.buffer,
                //         function(buffer) {
                //             audioSource.buffer = buffer;
                //             if (msg.vol) {
                //                 var volume = audioContext.createGain();
                //                 volume.gain.value = msg.vol/100;
                //                 volume.connect(audioContext.destination);
                //                 audioSource.connect(volume);
                //             }
                //             else {
                //                 audioSource.connect(audioContext.destination);
                //             }
                //             audioSource.start(0);
                //             events.emit('ui-audio', 'playing');
                //         },
                //         function() { events.emit('ui-audio', 'error'); }
                //     )
                // }
                // catch(e) { events.emit('ui-audio', 'error'); }