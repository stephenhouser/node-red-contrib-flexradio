const parser = require('../flex-parser');
const fs = require('fs');

const fn = process.argv[2];

const requests = {};

const data = fs.readFileSync(fn, 'UTF-8');
const lines = data.split(/\r?\n/);
lines.forEach((line) => {
	
	if (request_match = line.match(/^C(?<sequence>\d+)\|(?<request>.*)$/)) {
			const sequence = request_match.groups.sequence;
			const request = request_match.groups.request;
			requests[sequence] = { request: request, raw_request: line };
	}

	if (response_match = line.match(/^R(?<sequence>\d+)\|(?<status>\d+)\|(?<response>.*)$/)) {
		const sequence = response_match.groups.sequence;
		const status = response_match.groups.status;
		const response = response_match.groups.response;

		requests[sequence].status = status;
		requests[sequence].response = response;
		requests[sequence].raw_response = line;

		try {
			const obj = parser.parse(line);
			requests[sequence].parsed_response = obj;			
		} catch (error) {
			console.log(error);
		}
	}
});

// Print commands and responses.
for (let [key, value] of Object.entries(requests)) {
	console.log(value.raw_request);
	console.log(value.raw_response);
	const obj = parser.parse(value.raw_response);
	console.log(JSON.stringify(obj, null, 2));
	console.log();
}
