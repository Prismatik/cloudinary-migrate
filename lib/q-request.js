var Q = require('q');
var request = require('request');

//convert request to use promises
module.exports = function(opts) {
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
