var ffmpeg = require('../ffmpeg');
var uuid = require('node-uuid');

module.exports = function (options) {
  return function (request, reply) {
    options.jobId = uuid.v4();
    options.mediaType = request.payload[options.route.fileParam].hapi.headers['content-type'];
    options.source = request.payload[options.route.fileParam];
    options.file.filePath = request.payload.outputPath || options.file.outputPath || options.tempDir + '/' + options.jobId + '.mp4';
    ffmpeg.encode(options);
    reply({ jobId: options.jobId });
  };
};
