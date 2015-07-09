var Q = require('q');
var request = require('request');
var fs = require('fs');
var config = require('root/config.json');

var imagesURL = "https://" + config.from.API_KEY + ":" + config.from.API_SECRET + "@api.cloudinary.com/v1_1/" + config.from.CLOUD_NAME + "/resources/image"
console.log('url:', imagesURL)


//convert request to use promises
var qRequest = function(opts) {
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

//fetch all images from cloudinary (request 500 images repeatedly until no more are found)
var fetchImages = function(opts, images) {
	if (!images) images = []
	//console.log('opts', opts)

	return qRequest(opts)
		.then(function(result) {
			var newImages = result.body.resources;
			var allImages = images.concat(newImages)
			console.log("new images found: ", newImages.length);
			console.log("total images found: ", allImages.length);

			if (result.body.next_cursor) {
				console.log("there are more images to fetch!")
				
				//update the next cursor in the opts
				opts.qs.next_cursor = result.body.next_cursor
				//return fetchImages(opts, allImages);
			}
			return allImages;
			
		})
}

//use request and Q to download a given file
var downloadFile = function(url, filename, destination) {
	var defer = Q.defer();

	var target = __dirname
	if (destination) target = [target, destination].join('/')
	target = [target, filename].join("/")

	console.log('started downloading:', filename)
	//console.log('file destination: ', target)
	//console.log('current path', __dirname)
	request(url)
		.pipe(fs.createWriteStream(target))
		.on('close', function() {
			console.log('done downloading: ', filename)
			defer.resolve(filename)
		})
		.on('error', defer.reject)

	return defer.promise;
}

var downloadImages = function(images) {
	console.log("images remaining in batch", images.length)

	var image = images.splice(0,1)[0]
	return downloadFile(image.url, getFilename(image), "images")
		.then(function() {
			if (images.length) downloadImages(images)
		})
}

var getFilename = function(image) {
	return image.public_id + "." + image.format
}

var opts = {url: imagesURL, qs: {max_results: 500}}
fetchImages(opts)
	.then(downloadImages)
	.catch(function(err) { console.error("error: ", err) })
