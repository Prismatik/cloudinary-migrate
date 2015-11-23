var Q = require('q');
var crypto = require('crypto');
var fs = require('fs');
var qs = require('querystring');

var qRequest = require("root/lib/q-request");
var config = require("root/config");

var batchSize = parseInt(process.env.UPLOAD_BATCH_SIZE) || 10;

var uploadImage = function(imagesDir, filename) {
  console.log('uploading file', filename);
  var fullpath = [imagesDir, filename].join("/");

  var now = new Date();
  var basename = filename.replace(/\.[^.]+$/, "");

  var query = {
    public_id: basename,
    timestamp: now.getTime()
  };

  //generate signature
  var queryString = qs.stringify(query);
  var shasum = crypto.createHash('sha1');
  shasum.update(queryString + config.upload.API_SECRET);
  query.signature = shasum.digest('hex');

  query.api_key = config.upload.API_KEY;

  //read file into request
  var formData = {file: fs.createReadStream(fullpath)};

  var url = "https://api.cloudinary.com/v1_1/";
  url += config.upload.CLOUD_NAME + "/image/upload";

  var opts = {url: url, qs: query, formData: formData};

  return qRequest.request(opts)
  .then(function(result) {
    var filename = result.body.original_filename + "." + result.body.format;
    console.log('done uploading', filename);
    return filename;
  });
};

var uploadImages = function(imagesDir) {
  var files = fs.readdirSync(imagesDir);

  var promiseGenerators = files.map(function(filename) {
    var upload = uploadImage.bind(this, imagesDir, filename);
    return upload;
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

var directory = __dirname + "/images";
uploadImages(directory)
.catch(function(err) { console.error("error:", err); });
