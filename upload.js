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

var uploadFile = function(filename) {
	console.log('uploading file', filename)
	var fullpath = [imagesDir, filename].join("/");

	var now = new Date
	var basename = filename.replace(/\.[^.]+$/, "")
	
	var query = {
		public_id: basename,
		timestamp: now.getTime()
	}

	//generate signature
	var queryString = qs.stringify(query)
	var shasum = crypto.createHash('sha1');
	shasum.update(queryString + config.upload.API_SECRET);
	query.signature = shasum.digest('hex')

	query.api_key = config.upload.API_KEY;

	//read file into request
	var formData = {file: fs.createReadStream(fullpath)}

	var url = "https://api.cloudinary.com/v1_1/" + config.upload.CLOUD_NAME + "/image/upload"
	var opts = {url: url, qs: query, formData: formData}

	return qRequest.request(opts)
		.then(function(result) {
			var filename = result.body.original_filename + "." + result.body.format;
			console.log('done uploading', filename);
			return filename;
		})
}

var uploadFiles = function() {
	console.log("imagesDir", imagesDir)

	fs.readdir(imagesDir, function(err, files) {
		console.log('files', files)

		var firstFile = files.splice(0,1)[0]

		var result = uploadFile(firstFile)
		files.forEach(function(filename) {
			//queue the next upload
			var nextUpload = uploadFile.bind(this, filename)
			result = result.then(nextUpload)
		})
		return result;
	})
}

var imagesDir = __dirname + "/images"
uploadFiles()
	//.catch(function(err) { console.error('error:', err)})
