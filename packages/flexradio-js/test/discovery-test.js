discovery = require('../DiscoveryListener');

d_listener = new discovery.DiscoveryListener();

d_listener.on('state', (state) => {
	console.log(`Changed state to [${state}]`);
});

d_listener.on('discovery', (radio) => {
	console.log('Discovered radio:');
	console.log(JSON.stringify(radio, null, 2));
});

d_listener.start();
