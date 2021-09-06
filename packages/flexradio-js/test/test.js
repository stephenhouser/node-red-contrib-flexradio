const parser = require('./flex-parser');
const fs = require('fs');
const readline = require('readline');

console.log(process.argv);

const fn = process.argv[2];
console.log("Reading " + fn + "...");

const rl = readline.createInterface({
  input: fs.createReadStream(fn),
  crlfDelay: Infinity
});

rl.on('line', (line) => {
	console.log(line);
	if (!line.match(/^C/)) {
		try {
  			const p = parser.parse(line);
  			console.log(p);
		} catch (error) {
			console.error(error);
		}
	}

});