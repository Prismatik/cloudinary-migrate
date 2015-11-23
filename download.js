var Q = require('q');
var config = require('root/config.json');
var request = require('request');
var qRequest = require('root/lib/q-request');

var batchSize = parseInt(process.env.DOWNLOAD_BATCH_SIZE) || 10;

//fetch all images from cloudinary (request 500 images repeatedly until no more are found)
var fetchImages = function(opts, images) {
  if (!images) images = [];

  return qRequest.request(opts)
  .then(function(result) {
    var newImages = result.body.resources;
    var allImages = images.concat(newImages);
    console.log("new images found: ", newImages.length);
    console.log("total images found: ", allImages.length);

    if (result.body.next_cursor) {
      console.log("there are more images to fetch!");

      //update the next cursor in the opts
      opts.qs.next_cursor = result.body.next_cursor;
      //fetch the next lot of images
      return fetchImages(opts, allImages);
    }
    return allImages;

  });
};

var downloadImages = function(savePath, images) {
  console.log("images remaining in batch", images.length);

  var promiseGenerators = images.map(function(image) {
    var filename = getFilename(image);
    var download = qRequest.downloadFile.bind(this, image.url, filename, savePath);
    return download;
  });

  function batchElements(elements) {
    var batch = elements.slice(0, batchSize);
    if (batch.length < batchSize) { return [batch]; }
    var tail = batchElements(elements.slice(batchSize));
    return [batch].concat(tail);
  }

  var result = batchElements(promiseGenerators).reduce(function(promiseChain, promiseGroup) {
    return promiseChain.then(function() {
      return Q.all(promiseGroup.map(function(promiseGenerator) {
        return promiseGenerator();
      }));
    });
  }, Q(null));

  return result;
};

var getFilename = function(image) {
  return image.public_id + "." + image.format;
};

var getImagesURL = function(keys) {
  var imagesURL = "https://" + keys.API_KEY + ":";
  imagesURL += keys.API_SECRET + "@api.cloudinary.com/v1_1/";
  imagesURL += keys.CLOUD_NAME + "/resources/image";
  return imagesURL;
};

console.log('getImagesURL', getImagesURL(config.download));
var opts = {url: getImagesURL(config.download), qs: {max_results: 500}};
var savePath = [__dirname, "images"].join("/");
console.log('savePath', savePath);

fetchImages(opts)
.then(downloadImages.bind(this, savePath))
.catch(function(err) { console.error("error: ", err); });
