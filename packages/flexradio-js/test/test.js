

var msg;

// info message
msg = decode_message_values('model="FLEX-6600",chassis_serial="0621-1104-6601-1641",name="Flex-6600M",callsign="N1SH",gps="Not Present",atu_present=1,num_scu=2,num_slice=4,num_tx=1,software_ver=3.2.34.3128,mac=00:1C:2D:05:1A:68,ip=192.168.10.27,netmask=255.255.255.0,gateway=192.168.10.1,location="",region="USA",screensaver=model,options="None"');
console.log(JSON.stringify(msg));

// interlock message
msg = decode_message_values('interlock tx_client_handle=0x00000000 state=RECEIVE reason= source= tx_allowed=0 amplifier=');
console.log(JSON.stringify(msg));

msg = decode_message_values('interlock acc_txreq_enable=0 rca_txreq_enable=0 acc_tx_enabled=1 tx1_enabled=1 tx2_enabled=1 tx3_enabled=1 tx_delay=0 acc_tx_delay=0 tx1_delay=0 tx2_delay=0 tx3_delay=0 acc_txreq_polarity=0 rca_txreq_polarity=0 timeout=0');
console.log(JSON.stringify(msg));

msg = decode_message_values('radio filter_sharpness DIGITAL level=2 auto_level=1');
console.log(JSON.stringify(msg));

msg = decode_message_values('radio slices=4 panadapters=4 lineout_gain=60 lineout_mute=0 headphone_gain=50 headphone_mute=0 remote_on_enabled=0 pll_done=0 freq_error_ppb=0 cal_freq=15.000000 tnf_enabled=1 snap_tune_enabled=1 nickname=Flex-6600M callsign=N1SH binaural_rx=0 full_duplex_enabled=0 band_persistence_enabled=1 rtty_mark_default=2125 enforce_private_ip_connections=1 backlight=50 mute_local_audio_when_remote=1 daxiq_capacity=16 daxiq_available=16');
console.log(JSON.stringify(msg));

msg = decode_message_values('slice 0 in_use=1 sample_rate=24000 RF_frequency=7.169100 client_handle=0x4101FB31 index_letter=A rit_on=0 rit_freq=0 xit_on=0 xit_freq=0 rxant=ANT1 mode=LSB wide=0 filter_lo=-2800 filter_hi=-100 step=100 step_list=1,10,50,100,500,1000,2000,3000 agc_mode=med agc_threshold=55 agc_off_level=10 pan=0x40000000 txant=ANT1 loopa=0 loopb=0 qsk=0 dax=1 dax_clients=0 lock=0 tx=1 active=1 audio_level=36 audio_pan=50 audio_mute=0 record=0 play=disabled record_time=0.0 anf=0 anf_level=50 nr=1 nr_level=50 nb=0 nb_level=50 wnb=0 wnb_level=0 apf=0 apf_level=0 squelch=1 squelch_level=20 diversity=0 diversity_parent=0 diversity_child=0 diversity_index=1342177293 ant_list=ANT1,ANT2,RX_A,RX_B,XVTA,XVTB mode_list=LSB,USB,AM,CW,DIGL,DIGU,SAM,FM,NFM,DFM,RTTY fm_tone_mode=OFF fm_tone_value=67.0 fm_repeater_offset_freq=0.000000 tx_offset_freq=0.000000 repeater_offset_dir=SIMPLEX fm_tone_burst=0 fm_deviation=5000 dfm_pre_de_emphasis=0 post_demod_low=300 post_demod_high=3300 rtty_mark=2125 rtty_shift=170 digl_offset=2210 digu_offset=1500 post_demod_bypass=0 rfgain=0 tx_ant_list=ANT1,ANT2,XVTA,XVTB');
console.log(JSON.stringify(msg));
