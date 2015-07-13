var Q = require('q');
var fs = require('fs');
var request = require('request');

//convert request to use promises
module.exports.request = function(opts) {
	var defer = Q.defer();
	
	request(opts, function(error, response, body) {
		if (error) return defer.reject(error);
		var parsedBody = JSON.parse(body)
		defer.resolve({
			response: response,
			body: parsedBody
		})
	})

	return defer.promise;
}

//use request and Q to download a given file
module.exports.downloadFile = function(url, filename, savePath) {
	var defer = Q.defer();
	var target = [savePath, filename].join('/')

	console.log('started downloading:', filename)
	request(url)
		.pipe(fs.createWriteStream(target))
		.on('close', function() {
			console.log('done downloading: ', filename)
			defer.resolve(filename)
		})
		.on('error', defer.reject)

	return defer.promise;
}
