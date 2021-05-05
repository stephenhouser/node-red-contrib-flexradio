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

A Telnet connection:
```
V1.4.0.0
H19456290
M10000001|Client connected from IP 192.168.10.20
S19456290|radio slices=4 panadapters=4 lineout_gain=48 lineout_mute=0 headphone_gain=0 headphone_mute=0 remote_on_enabled=0 pll_done=0 freq_error_ppb=0 cal_freq=15.000000 tnf_enabled=0 snap_tune_enabled=1 nickname=FlexRadio callsign=N1SH binaural_rx=0 full_duplex_enabled=1 band_persistence_enabled=1 rtty_mark_default=2125 enforce_private_ip_connections=1 backlight=50 mute_local_audio_when_remote=1 daxiq_capacity=16 daxiq_available=16
S19456290|radio filter_sharpness VOICE level=2 auto_level=1
S19456290|radio filter_sharpness CW level=2 auto_level=1
S19456290|radio filter_sharpness DIGITAL level=2 auto_level=1
S19456290|radio static_net_params ip= gateway= netmask=
S19456290|radio front_speaker_mute=0
S19456290|radio oscillator state=tcxo setting=auto locked=1 ext_present=0 gpsdo_present=0 tcxo_present=1
S19456290|interlock acc_txreq_enable=0 rca_txreq_enable=0 acc_tx_enabled=1 tx1_enabled=1 tx2_enabled=1 tx3_enabled=1 tx_delay=0 acc_tx_delay=0 tx1_delay=0 tx2_delay=0 tx3_delay=0 acc_txreq_polarity=0 rca_txreq_polarity=0 timeout=0
S19456290|eq rx mode=1 63Hz=10 125Hz=10 250Hz=10 500Hz=10 1000Hz=10 2000Hz=10 4000Hz=10 8000Hz=10
S19456290|eq rxsc mode=1 63Hz=0 125Hz=0 250Hz=0 500Hz=0 1000Hz=0 2000Hz=0 4000Hz=0 8000Hz=0
S0|interlock tx_client_handle=0x00000000 state=RECEIVE reason= source= tx_allowed=0 amplifier=
```

The front panel connected during an update:
```
M10000001|Client connected from IP 192.168.10.28
S6190EABE|radio slices=4 panadapters=4 lineout_gain=48 lineout_mute=0 headphone_gain=0 headphone_mute=0 remote_on_enabled=0 pll_done=0 freq_error_ppb=0 cal_freq=15.000000 tnf_enabled=0 snap_tune_enabled=1 nickname=FlexRadio callsign=N1SH binaural_rx=0 full_duplex_enabled=1 band_persistence_enabled=1 rtty_mark_default=2125 enforce_private_ip_connections=1 backlight=50 mute_local_audio_when_remote=1 daxiq_capacity=16 daxiq_available=16
S6190EABE|radio filter_sharpness VOICE level=2 auto_level=1
S6190EABE|radio filter_sharpness CW level=2 auto_level=1
S6190EABE|radio filter_sharpness DIGITAL level=2 auto_level=1
S6190EABE|radio static_net_params ip= gateway= netmask=
S6190EABE|radio front_speaker_mute=0
S6190EABE|radio oscillator state=tcxo setting=auto locked=1 ext_present=0 gpsdo_present=0 tcxo_present=1
S6190EABE|interlock acc_txreq_enable=0 rca_txreq_enable=0 acc_tx_enabled=1 tx1_enabled=1 tx2_enabled=1 tx3_enabled=1 tx_delay=0 acc_tx_delay=0 tx1_delay=0 tx2_delay=0 tx3_delay=0 acc_txreq_polarity=0 rca_txreq_polarity=0 timeout=0
S6190EABE|eq rx mode=1 63Hz=10 125Hz=10 250Hz=10 500Hz=10 1000Hz=10 2000Hz=10 4000Hz=10 8000Hz=10
S6190EABE|eq rxsc mode=1 63Hz=0 125Hz=0 250Hz=0 500Hz=0 1000Hz=0 2000Hz=0 4000Hz=0 8000Hz=0
S0|interlock tx_client_handle=0x00000000 state=RECEIVE reason= source= tx_allowed=0 amplifier=
S6190EABE|profile global list=Default^SO2RDefault^
S6190EABE|profile global current=
S6190EABE|profile tx list=Default^SO2R_TX1^SO2R_TX2^
S6190EABE|profile mic list=Default^Default FHM-1^Default FHM-1 DX^Default FHM-2^Default FHM-2 DX^Default FHM-2 ESSB^Default FHM-3^Default FHM-3 DX^Default FHM-3 ESSB^Default HM-Pro^Default PR781^Default PR781 ESSB 3_2k^Default ProSet HC6^Inrad M629^Inrad M650^RadioSport DX M207^RadioSport DX M208^RadioSport DX M350-ADJ^RadioSport DX M360/EM56^RadioSport WIDE M207^RadioSport WIDE M208^RadioSport WIDE M350-ADJ^RadioSport WIDE M360/EM56^RTTYDefault^
S6190EABE|interlock acc_txreq_enable=0 rca_txreq_enable=0 acc_tx_enabled=1 tx1_enabled=1 tx2_enabled=1 tx3_enabled=1 tx_delay=0 acc_tx_delay=0 tx1_delay=0 tx2_delay=0 tx3_delay=0 acc_txreq_polarity=0 rca_txreq_polarity=0 timeout=0
S0|wan server_connected=1 radio_authenticated=1

```