var Q = require('q');
var config = require('root/config.json');
var request = require('request');
var qRequest = require('root/lib/q-request');

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

  var firstImage = images.splice(0,1)[0];
  var result = qRequest.downloadFile(firstImage.url, getFilename(firstImage), savePath);
  images.forEach(function(image) {
    var filename = getFilename(image);
    var nextDownload = qRequest.downloadFile.bind(this, image.url, filename, savePath);
    result = result.then(nextDownload);
  })

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
