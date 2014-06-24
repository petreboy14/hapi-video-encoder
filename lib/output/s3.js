var AWS = require('s3-upload-stream/node_modules/aws-sdk');
var ffmpeg = require('../ffmpeg');
var fs = require('fs');
var Uploader = require('s3-upload-stream').Uploader;

var s3 = null;

function uploadToS3(options) {
  new Uploader({
    s3Client: s3
  }, {
    Bucket: options.s3.bucket,
    Key: options.s3.key,
    ACL: options.s3.acl,
    ContentType: 'video/mp4'
  }, function (err, uploadStream) {
    if (err) {
      options.emitter.emit('error', err);
    } else {
      uploadStream.on('chunk', function (data) {
        options.emitter.emit('s3-progress', data);
      });

      // Emitted when all parts have been flushed to S3 and the multipart
      // upload has been finalized.
      uploadStream.on('uploaded', function (data) {
        fs.unlink(options.path);
        options.emitter.emit('s3-end', data);
      });

      uploadStream.on('error', function (err) {
        options.emitter.emit('error', err);
        fs.unlink(options.path);
      });

      fs.createReadStream(options.path).pipe(uploadStream);
    }
  });
}

module.exports = function (options) {
  AWS.config.update({
    accessKeyId: options.s3.accessKey,
    secretAccessKey: options.s3.secretKey,
    region: options.s3.region
  });

  s3 = new AWS.S3({
    endpoint: options.s3.endpoint
  });

  return function (request, reply) {
    options.mediaType = request.payload[options.fileParam].hapi.headers['content-type'];
    options.source = request.payload[options.fileParam];
    options.s3.bucket = request.payload.bucket || options.s3.bucket;
    options.s3.key = request.payload.key || request.payload[options.fileParam].hapi.filename;

    ffmpeg.encode(options, function (err, path) {
      if (err) {
        reply(err);
      } else {
        options.path = path;
        reply(path);
        uploadToS3(options);
      }
    });
  };
};
