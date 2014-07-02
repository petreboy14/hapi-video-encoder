var ffmpeg = require('../ffmpeg');
var uuid = require('node-uuid');

module.exports = function (options) {
  return function (request, reply) {
    var filename = request.payload.file.filename;
    filename = filename.substring(0, filename.lastIndexOf('.')) + '.mp4';
    options.jobId = uuid.v4();
    options.mediaType = request.payload.file.headers['content-type'];
    options.source = request.payload.file.path;
    options.destination = request.payload.outputPath || options.tempDir + '/' + filename;
    ffmpeg.encode(options);
    reply({ jobId: options.jobId });
  };
};
