var ffmpeg = require('../ffmpeg');
var fs = require('fs');
var knox = require('knox');
var MultiPartUploader = require('knox-mpu');
var uuid = require('node-uuid');

var client = null;

function uploadToS3(options) {
  options.emitter.emit('s3-start', { jobId: options.jobId });
  var uploader = new MultiPartUploader({
    client: client,
    objectName: options.s3.key,
    stream: fs.createReadStream(options.destination),
    headers: {
      'Content-Type': 'video/mp4',
      'x-amz-acl': options.s3.acl
    }
  }, function (err, data) {
    fs.unlink(options.destination);
    if (err) {
      options.emitter.emit('s3-error', { jobId: options.jobId, err: err.message });
    } else {
      options.emitter.emit('s3-end', { jobId: options.jobId, data: data });
    }
  });

  uploader.on('uploaded', function (data) {
    options.emitter.emit('s3-progress', { jobId: options.jobId, data: data });
  });
}

module.exports = function (options) {
  client = knox.createClient({
    key: options.s3.accessKey,
    secret: options.s3.secretKey,
    region: options.s3.region,
    bucket: options.s3.bucket
  });

  return function (request, reply) {
    var filename = request.payload.file.filename;
    filename = filename.substring(0, filename.lastIndexOf('.')) + '.mp4';
    options.jobId = uuid.v4();
    options.mediaType = request.payload.file.headers['content-type'];
    options.source = request.payload.file.path;
    options.s3.bucket = request.payload.bucket || options.s3.bucket;
    options.s3.key = request.payload.key || filename;
    options.destination = options.tempDir + '/' + filename;

    options.emitter.once('transcode-end-' + options.jobId, function () {
      uploadToS3(options);
    });

    ffmpeg.encode(options);
    reply({ jobId: options.jobId });
  };
};
