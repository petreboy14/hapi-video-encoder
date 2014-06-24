var Hoek = require('hoek');
var encoder = require('./lib/encoder');

var defaultOptions = {
  output: 'stream',
  fileParam: 'file',
  route: {
    path: '/media',
    maxBytes: 5368709120 // 5 GB
  },
  ffmpeg: {
    videoCodec: 'libx264',
    audioCodec: 'libfaac',
    speed: 'slow',
    nolog: true,
    options: [
      '-pix_fmt yuv420p',
      '-profile:v high',
      '-crf 18',
      '-movflags',
      '+faststart',
      '-vf "scale=trunc(in_w/2)*2:trunc(in_h/2)*2"'
    ]
  }
};

exports.register = function (plugin, options, next) {
  options = Hoek.applyToDefaults(defaultOptions, options);
  encoder.register(plugin, options);
  next();
};

exports.register.attributes = {
  pkg: require('./package.json')
};