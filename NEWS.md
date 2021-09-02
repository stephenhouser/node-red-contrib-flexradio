Subject: node-red-contrib-flexradio v0.5.0

v0.5.0 - Thursday, September 2, 2021

I've pulled the trigger on v0.5.0 and ready for wider-scale testing before calling it v1.0. This should be a relatively *stable* release that should install from the palette manager of NodeRed shortly (there is a slight delay from when I publish and nodered.org refreshes its copy/link).

Here are the details you should know when installing and using these:

- The nodes themselves have help information that can be viewed within NodeRed, but there is also a short walkthrough and description of the nodes on the GitHub project page -- https://github.com/stephenhouser/node-red-contrib-flexradio. Scroll down past the code to get to "Using these nodes in your flows" section. This text also appears on nodered.org in the description of the node(s).

- There are some 'deprecated' nodes that were used in earlier versions that you **should not use** in new flows. They will be removed in the final v1.0 release. These are `flexradio-status` and `flexradio-messages` (note the plural). These notes are a light blue color to highlight they are different. They are included in this release only to assist earlier adopters in migrating their flows to the new `flexradio-message` (node the singular) node.

- These nodes are *not compatible* with other nodes in the same system listening on the same UDP ports. This is particularly a problem with the `flexradio-discovery` node which listens on UDP port 4992.

- These nodes *may be compatible* with other nodes and flows on the same system that communicate with the radio, connecting over TCP port 4992. However this is at your own discretion and peril. There is nothing in the nodes to prevent this multi-connection but they are not designed with that in mind either!

- You will need to know the IP address or DNS name of your radio. When you first configure, just like MQTT and other server-based nodes, you will need to enter this in the `flexradio-radio` configuration node.

Current issues and some items loosely categorized as bugs can be found on the GitHub page for the project -- https://github.com/stephenhouser/node-red-contrib-flexradio/issues. If you do find a bug, please report it there or here (groups.io) and when verified, I'll post it there as well.