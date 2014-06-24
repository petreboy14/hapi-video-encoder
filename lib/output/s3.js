var AWS = require('s3-upload-stream/node_modules/aws-sdk');
var ffmpeg = require('../ffmpeg');
var fs = require('fs');
var temp = require('temp');
var Uploader = require('s3-upload-stream').Uploader;
var uuid = require('node-uuid');

var s3 = null;

function uploadToS3(options) {
  options.emitter.emit('s3-start');
  new Uploader({
    s3Client: s3
  }, {
    Bucket: options.s3.bucket,
    Key: options.s3.key,
    ACL: options.s3.acl,
    ContentType: 'video/mp4'
  }, function (err, uploadStream) {
    if (err) {
      options.emitter.emit('s3-error', err);
    } else {
      uploadStream.on('chunk', function (data) {
        options.emitter.emit('s3-progress', data);
      });

      // Emitted when all parts have been flushed to S3 and the multipart
      // upload has been finalized.
      uploadStream.on('uploaded', function (data) {
        fs.unlink(options.file.filePath);
        options.emitter.emit('s3-end', data);
      });

      uploadStream.on('error', function (err) {
        options.emitter.emit('s3-error', err);
        fs.unlink(options.file.filePath);
      });

      fs.createReadStream(options.file.filePath).pipe(uploadStream);
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
    options.jobId = uuid.v4();
    options.mediaType = request.payload[options.route.fileParam].hapi.headers['content-type'];
    options.source = request.payload[options.route.fileParam];
    options.s3.bucket = request.payload.bucket || options.s3.bucket;
    options.s3.key = request.payload.key || request.payload[options.route.fileParam].hapi.filename;
    options.file.filePath = temp.path({ suffix: '.mp4' });

    options.emitter.once('trancode-end-' + options.jobId, function () {
      uploadToS3(options);
    });

    ffmpeg.encode(options);
    reply({ jobId: options.jobId });
  };
};
