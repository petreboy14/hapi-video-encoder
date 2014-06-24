var fs = require('fs');

var ffmpeg = require('../ffmpeg');

module.exports = function (options) {
  return function (request, reply) {
    var output = fs.createWriteStream(options.file.outputPath);
    options.source = request.payload[options.fileParam];
    ffmpeg.encode(options, output, function (err) {
      if (err) {
        reply(err);
      } else {
        reply('done');
      }
    });
  };
};
