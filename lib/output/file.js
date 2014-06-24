var ffmpeg = require('../ffmpeg');

module.exports = function (options) {
  return function (request, reply) {
    options.mediaType = request.payload[options.route.fileParam].hapi.headers['content-type'];
    options.source = request.payload[options.route.fileParam];
    options.file.filePath = options.file.outputPath || request.payload.outputPath;
    ffmpeg.encode(options, function (err, path) {
      if (err) {
        reply(err);
      } else {
        reply(path);
      }
    });
  };
};
