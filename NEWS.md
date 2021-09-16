# News about `node-red-contrib-flexradio`

Releases are posted in the [nodered-hamradio Groups.io](https://groups.io/nodered-hamradio) group.

## Subject: Release of node-red-contrib-flexradio nodes v0.8.0

v0.8.0 of node-red-contrib-flexradio nodes are now available via Manage Pallette and NPM.

* Reorder items in node configuration so that the `Name` field is last. This maintains consistency with the built-in NodeRed nodes. This is only a user interface change.

* Clean up the event handlers among the nodes to more gracefully work with re-deploys and not consume extra memory and resources.

* Change the default radio hostname from `localhost` to `flexradio` as the radio hostname will surely never, ever, be `localhost`. It was misleading.

* Update the `vita49-decode` node which enables access to the VITA-49 datagram parser without creating a UDP listner (e.g. the `flexradio-discover` or `flexradio-meter` nodes). This is an advanced feature which may be removed in a future version.

* Add `flexradio-decode` node to enable access to the parser without a connection to the radio. Could be used if you want to manage the TCP connection yourself. An advanced feature which may be removed in a future version.

## Subject: node-red-contrib-flexradio v0.7.0

v0.7.7 - Thursday, September 12, 2021

v0.7.7 of node-red-contrib-flexradio nodes are now available via Manage Pallette and NPM.

There's a number of significant underlying changes in this version. The changes will likely break small portions of existing flows, but not to the extent of previous changes.

* The parsing of data from the TCP control stream has been completely rewritten to be more efficient, cleaner, and to handle some of the cases the previous parser did not. This goes specifically to the caret (^) delimited lists, e.g. `profile list`. Also it adds full translation to JSON objects where the old one fell apart on some responses from the radio.

* With the new parsing of TCP data the topics are now consistent across status, messages, and responses as well as with topics emitted from the `flexradio-meter` node.

* The topic-matching system for `flexradio-messages` and `flexradio-meters` has been rewritten to be consistent across both of these nodes and to allow the choice of filtering topics based on an (1) exact string match, (2) an MQTT-like topic as in previous versions, or (3) a JavaScript regular expression. The regular expression was added to maintain consistency with other standard nodered nodes and to avoid confusion about matching MQTT-like topics.

* The icons have changed in a few places. The most notable is the `flexradio-meter` and `flexradio-discovery` nodes have new icons.

* The `flexradio-discovery` node was updated to fix how it generates it's payload.

* The top-level nodes not check the radio connection periodically for state change. Previously they had to catch the state change to update. When only portions of a flow were deployed this would sometimes fail.

* The top-level nodes now properly handle the `node.on('close')` which they did not previously.

* The low-level VITA-49 and UDP decoding have the beginnings of support for audio, IQ, panadapter, and waterfall data. It is far from complete but the structure is now in place to support it in future versions.

* Some new example flows have been added and can be imported from "Import" / "Examples".

## Subject: node-red-contrib-flexradio v0.6.0

v0.6.0 - Thursday, September 2, 2021

Apologies for starting a new topic so soon after the last v0.5.0 release topic. But I figured I'd create a new topic for each feature release.

I refactored a bit from v0.5.0 and added the ability to subscribe to meters by their topic name. That is you can now `sub meter RAD/+/MAINFAN` and have the node find and subscribe to the correct meter number. Note that this works with `sub meter TX-/#` to subscribe to all the `TX-` meters. At that point, it might just be easier to to a `sub meter all` though. I think that's what Dave does in his flows.

I fixed an inconsistency with the `flexradio-request` node. If you sent a command that did not generate any response from the radio other than the `success_code` it would copy your request into the outgoing `payload`. That seemed wrong when other requests generated javascript objects as their result. So, I changed the `flexradio-request` node to put the request you sent in into `msg.request` on its output. If the request did not generate any response from the radio, then the `msg.payload` will be empty. As it should be.

I cleaned up the topic in `flexradio-meter` and `flexradio-message` so the default (if you leave it empty) will be the same as putting in `#` to match everything. Somehow that logic got cross-wired and was different in both of those. It is now the same. Those two nodes share their topic-matching code now.

**IMPORTANT: The previous `flexradio-status` and `flexradio-messages` (plural) nodes have been removed from this release.** If you were an early adopter, do not upgrade to this release until you have migrated everything with v0.5.0 to the `flexradio-message` (singular) node.

## Subject: node-red-contrib-flexradio v0.5.0

v0.5.0 - Thursday, September 2, 2021

I've pulled the trigger on v0.5.0 and ready for wider-scale testing before calling it v1.0. This should be a relatively *stable* release that should install from the palette manager of NodeRed shortly (there is a slight delay from when I publish and nodered.org refreshes its copy/link).

Here are the details you should know when installing and using these:

- The nodes themselves have help information that can be viewed within NodeRed, but there is also a short walkthrough and description of the nodes on the GitHub project page -- https://github.com/stephenhouser/node-red-contrib-flexradio. Scroll down past the code to get to "Using these nodes in your flows" section. This text also appears on nodered.org in the description of the node(s).

- There are some 'deprecated' nodes that were used in earlier versions that you **should not use** in new flows. They will be removed in the final v1.0 release. These are `flexradio-status` and `flexradio-messages` (note the plural). These notes are a light blue color to highlight they are different. They are included in this release only to assist earlier adopters in migrating their flows to the new `flexradio-message` (node the singular) node.

- These nodes are *not compatible* with other nodes in the same system listening on the same UDP ports. This is particularly a problem with the `flexradio-discovery` node which listens on UDP port 4992.

- These nodes *may be compatible* with other nodes and flows on the same system that communicate with the radio, connecting over TCP port 4992. However this is at your own discretion and peril. There is nothing in the nodes to prevent this multi-connection but they are not designed with that in mind either!

- You will need to know the IP address or DNS name of your radio. When you first configure, just like MQTT and other server-based nodes, you will need to enter this in the `flexradio-radio` configuration node.

Current issues and some items loosely categorized as bugs can be found on the GitHub page for the project -- https://github.com/stephenhouser/node-red-contrib-flexradio/issues. If you do find a bug, please report it there or here (groups.io) and when verified, I'll post it there as well.