//var url = "https://api.cloudinary.com/v1_1/demo/image/upload"


//Required parameters:

//file - Either the actual data of the image or an HTTP URL of a public image on the Internet.
//api_key - Your unique Cloudinary API Key.
//timestamp - Unix time in seconds of the current time.
//signature - A signature of all request parameters except for 'file', based on your Cloudinary API Secret. See Request Authentication for more details.
//Optional parameters:

//public_id - The identifier that is used for accessing the uploaded resource. A randomly generated ID is assigned if not specified. The public ID may contain a full path including folders separated by '/'.

var crypto = require('crypto');
var fs = require('fs');
var qs = require('querystring');
var qRequest = require("root/lib/q-request")
var config = require("root/config")

var imagesDir = __dirname + "/images"
console.log("imagesDir", imagesDir)

fs.readdir(imagesDir, function(err, files) {
	console.log('files', files)
	
	//files.forEach(function(filename) {
	var filename = files[0]
	var fullpath = [imagesDir, filename].join("/");

	var now = new Date
	var basename = filename.replace(/\.[^.]+$/, "")
	
	var query = {
		public_id: basename,
		timestamp: now.getTime()
	}
	//console.log('query', query)

	var queryString = qs.stringify(query)
	console.log(queryString)

	var shasum = crypto.createHash('sha1');
	shasum.update(queryString + config.upload.API_SECRET);
	//var sha1Hex = shasum.digest('hex')
	//console.log("sha1Hex", sha1Hex);
	//
	query.signature = shasum.digest('hex')
	console.log(query)

	query.api_key = config.upload.API_KEY;

	var formData = {file: fs.createReadStream(fullpath)}

	var url = "https://api.cloudinary.com/v1_1/" + config.upload.CLOUD_NAME + "/image/upload"
	var opts = {url: url, qs: query, formData: formData}

	console.log('opts', opts)
	return qRequest.request(opts)
		.then(function(result) { console.log('body:', result.body) })
		.catch(function(err) { console.error('error:', err)})

 

	//})
})
