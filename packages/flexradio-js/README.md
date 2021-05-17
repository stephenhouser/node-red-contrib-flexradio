16 May 21:36:37 - [info] [flexradio-radio:850ffdbc.dc261] radio connecting
node-red_1  | 16 May 21:36:37 - [red] Uncaught Exception:
node-red_1  | 16 May 21:36:37 - Error [ERR_SOCKET_DGRAM_NOT_RUNNING]: Not running
node-red_1  |     at healthCheck (dgram.js:605:11)
node-red_1  |     at Socket.bind (dgram.js:161:3)
node-red_1  |     at Radio._startRealtimeListener (/data/node_modules/flexradio/Radio.js:182:21)
node-red_1  |     at Socket.<anonymous> (/data/node_modules/flexradio/Radio.js:110:11)
node-red_1  |     at Object.onceWrapper (events.js:286:20)
node-red_1  |     at Socket.emit (events.js:203:15)
node-red_1  |     at TCPConnectWrap.afterConnect [as oncomplete] (net.js:1093:10)
node-red_1  | npm ERR! code ELIFECYCLE
node-red_1  | npm ERR! errno 1
node-red_1  | npm ERR! node-red-docker@1.3.4 start: `node $NODE_OPTIONS node_modules/node-red/red.js $FLOWS "--userDir" "/data"`
node-red_1  | npm ERR! Exit status 1
node-red_1  | npm ERR! 
node-red_1  | npm ERR! Failed at the node-red-docker@1.3.4 start script.
node-red_1  | npm ERR! This is probably not a problem with npm. There is likely additional logging output above.
node-red_1  | 
node-red_1  | npm ERR! A complete log of this run can be found in:
node-red_1  | npm ERR!     /data/.npm/_logs/2021-05-17T01_36_37_970Z-debug.log
