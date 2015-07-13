var Q = require('q');
var fs = require('fs');
var config = require('root/config.json');
var qRequest = require('root/lib/q-request')

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
				//fetch the next lot of images
				return fetchImages(opts, allImages);
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

var getImagesURL = function(keys) {
	var imagesURL = "https://" + keys.API_KEY + ":";
	imagesURL += keys.API_SECRET + "@api.cloudinary.com/v1_1/";
	imagesURL += keys.CLOUD_NAME + "/resources/image";
	return imagesURL;
}

console.log('getImagesURL', getImagesURL(config.from))
var opts = {url: getImagesURL(config.from), qs: {max_results: 500}}
fetchImages(opts)
	.then(downloadImages)
	.catch(function(err) { console.error("error: ", err) })
