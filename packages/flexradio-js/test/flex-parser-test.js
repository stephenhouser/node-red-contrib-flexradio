const parser = require('../flex-parser');
const fs = require('fs');

const fn = process.argv[2];

const requests = {};

const data = fs.readFileSync(fn, 'UTF-8');
const lines = data.split(/\r?\n/);
lines.forEach((line) => {
	// Parse all the things coming from the server
	if (line && !line.match(/^C(?<sequence>\d+)\|(?<request>.*)$/)) {
		console.log(line);
		try {
			const obj = parser.parse(line);
			console.log(JSON.stringify(obj, null, 2));	
		} catch (error) {
			console.log(error);
		}
		console.log();
	}
});
