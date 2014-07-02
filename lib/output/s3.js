var fs = require('fs');
var StreamingS3 = require('streaming-s3');
var uuid = require('node-uuid');

var ffmpeg = require('../ffmpeg');

function uploadToS3(options) {
  options.emitter.emit('s3-start', { jobId: options.jobId });

  var uploader = new StreamingS3(fs.createReadStream(options.destination), options.s3.accessKey, options.s3.secretKey, {
    Bucket: options.s3.bucket,
    Key: options.s3.key,
    ContentType: 'video/mp4',
    ACL: options.s3.acl
  });

  uploader.on('part', function (number) {
    options.emitter.emit('s3-progress', { jobId: options.jobId, data: { update: number } });
  });

  uploader.on('finished', function (resp, stats) {
    fs.unlink(options.destination);
    options.emitter.emit('s3-end', { jobId: options.jobId, data: { resp: resp, stats: stats }});
  });

  uploader.on('error', function (err) {
    fs.unlink(options.destination);
    options.emitter.emit('s3-error', { jobId: options.jobId, err: err.message });
  });

  uploader.begin();
}

module.exports = function (options) {
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
