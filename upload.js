var crypto = require('crypto');
var fs = require('fs');
var qs = require('querystring');

var qRequest = require("root/lib/q-request")
var config = require("root/config")

var uploadImage = function(imagesDir, filename) {
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

var uploadImages = function(imagesDir) {
	console.log("imagesDir", imagesDir)

	var files = fs.readdirSync(imagesDir)

	var firstFile = files.splice(0,1)[0]
	var result = uploadImage(imagesDir, firstFile)
	files.forEach(function(filename) {
		//queue the next upload (use .bind to prevent immediate execution)
		var nextUpload = uploadImage.bind(this, imagesDir, filename)
		result = result.then(nextUpload)
	})
	return result;
}

var directory = __dirname + "/images"
uploadImages(directory)
	.catch(function(err) { console.error(err) })
