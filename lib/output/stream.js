var through = require('through2');
var ffmpeg = require('../ffmpeg');

module.exports = function (options) {
  return function (request, reply) {
    var outputStream = through();
    options.source = request.payload[options.fileParam];
    reply(outputStream);
    ffmpeg.encode(options, outputStream);
  };
};
