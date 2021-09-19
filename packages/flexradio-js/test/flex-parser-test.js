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
		let obj = {};

		try {
			obj = parser.parse(line);
		} catch (error) {
			obj = { type: 'error',
					payload: { ...error, response: line }
			};
		}
		console.log(JSON.stringify(obj, null, 2));	
		console.log();
	}
});
