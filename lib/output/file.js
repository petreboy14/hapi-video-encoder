var ffmpeg = require('../ffmpeg');

module.exports = function (options) {
  return function (request, reply) {
    options.mediaType = request.payload[options.fileParam].hapi.headers['content-type'];
    options.source = request.payload[options.fileParam];
    ffmpeg.encode(options, function (err, path) {
      if (err) {
        reply(err);
      } else {
        reply(path);
      }
    });
  };
};
