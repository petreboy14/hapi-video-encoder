var Hoek = require('hoek');
var encoder = require('./lib/encoder');

var defaultOptions = {
  output: 'file',
  file: {},
  tempDir: '/tmp',
  s3: {
    acl: 'bucket-owner-full-control',
    endpoint: 'https://s3.amazonaws.com'
  },
  route: {
    path: '/media',
    fileParam: 'file',
    maxBytes: 5368709120 // 5 GB
  },
  ffmpeg: {
    videoCodec: 'libx264',
    audioCodec: 'libfaac',
    nolog: true,
    options: [
      '-pix_fmt yuv420p',
      '-profile:v baseline',
      '-preset fast',
      '-crf 23',
      '-movflags',
      '+faststart',
      '-vf scale=trunc(in_w/2)*2:trunc(in_h/2)*2',
      '-f mp4'
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
