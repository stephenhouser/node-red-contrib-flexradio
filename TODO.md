# TODO

* string node

* dashboard UI Level  (level node)

* No way to reconfigure radio dynamically. e.g. get a discovery packet and set the radio's ip address and then connect. maybe an 'autoconnect' option for the config node... how to inject IP address?

* Add "raw" to get raw data from messages and responses

* Should `flexradio-meter` be different than `flexradio-messages` or should there be just one node that injects any/all data regardless of source (TCP or UDP) and is able to filter by topic. 

* Test cases and testing for nodes and packet decoding. Need to read up on Nodered test infrastructure.

* Parse `profile` messages that contain a `list` of `^` delimited profiles.

```
S6190EABE|profile mic list=Default^Default FHM-1^Default FHM-1 DX^Default FHM-2^Default FHM-2 DX^Default FHM-2 ESSB^Default FHM-3^Default FHM-3 DX^Default FHM-3 ESSB^Default HM-Pro^Default PR781^Default PR781 ESSB 3_2k^Default ProSet HC6^Inrad M629^Inrad M650^RadioSport DX M207^RadioSport DX M208^RadioSport DX M350-ADJ^RadioSport DX M360/EM56^RadioSport WIDE M207^RadioSport WIDE M208^RadioSport WIDE M350-ADJ^RadioSport WIDE M360/EM56^RTTYDefault^
```

* Add docker container, docker-compose and my testing flows somwehere.

## flexradio-js

* Update meter list when new meters are added (or when external runs `meter list`?)

* Add ping/pong to keep connection alive. Currently it times out after a minute or two if idle.
