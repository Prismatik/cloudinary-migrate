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

//use request and Q to download a given file
var downloadFile = function(url, filename, destination) {
	var defer = Q.defer();

	var target = __dirname
	if (destination) target = [target, destination].join('/')
	target = [target, filename].join("/")

	//console.log('starting download of:', filename)
	//console.log('file destination: ', target)
	//console.log('current path', __dirname)
	request(url)
		.pipe(fs.createWriteStream(target))
		.on('close', function() {
			//console.log('done downloading: ', filename)
			defer.resolve(filename)
		})
		.on('error', defer.reject)

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

var downloadImages = function(images) {
	console.log("images count", images.length)
	//var imageURLs = images.map(function(image) { 
		//return image.url 
	//})
	//console.log("imageURLs", imageURLs)
	//
	var sampleImg = images[0]
	console.log("sample image", sampleImg)
	var filename = sampleImg.public_id + "." + sampleImg.format
	downloadFile(sampleImg.url, filename, "images")
		.then(function(filename) {
			console.log('done downloading:', filename)
		})
}

var opts = {url: imagesURL, qs: {max_results: 500}}
fetchImages(opts)
	.then(downloadImages)
	.catch(function(err) { console.error("error: ", err) })
