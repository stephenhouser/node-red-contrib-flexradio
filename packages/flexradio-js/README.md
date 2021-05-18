Sub to meter does not capture resposne correctly... topic is only '18' and should be 'meter'

node-red_1  | 17 May 23:21:11 - [info] [flexradio-radio:850ffdbc.dc261] send request: sub meter 18
node-red_1  | _sendRequest(sub meter 18)
node-red_1  | _receiveResponse(S9249AD6|meter 18.src=RAD#18.num=3#18.nam=MAINFAN#18.low=0.0#18.hi=8192.0#18.desc=Main radio fan RPM#18.unit=RPM#18.fps=0#)
node-red_1  | 17 May 23:21:11 - [info] [flexradio-radio:850ffdbc.dc261] received status: {"18":{"src":"RAD","num":"3","nam":"MAINFAN","low":"0.0","hi":"8192.0","desc":"Main radio fan RPM","unit":"RPM","fps":"0"},"type":"status","client":"9249AD6"}
node-red_1  | 17 May 23:21:11 - [info] [flexradio-messages:f21c8af7.3f663] {"topic":"18","client":"9249AD6","payload":{"src":"RAD","num":"3","nam":"MAINFAN","low":"0.0","hi":"8192.0","desc":"Main radio fan RPM","unit":"RPM","fps":"0"}}
