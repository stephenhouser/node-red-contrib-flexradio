const flex = require('.');
var lineReader = require('readline').createInterface({
	input: require('fs').createReadStream('test-messages.txt')
  });
  
  lineReader.on('line', function (line) {
	const decoded = flex.decode(line);
	console.log(line);
	console.log(decoded);
	console.log('');
  });
