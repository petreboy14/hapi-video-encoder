var FFMpeg = require('fluent-ffmpeg');
var fs = require('fs');
var temp = require('temp');

function saveToTemp(stream, cb) {
  var tempStream = temp.createWriteStream();

  stream.pipe(tempStream, { end: true });
  stream.on('end', function () {
    tempStream.end();
    cb(null, tempStream.path);
  });
}

function doEncode(options, cb) {
  var tempFile = options.file.outputPath || temp.path({ suffix: '.mp4' });
  new FFMpeg({ source: options.source, nolog: options.ffmpeg.nolog })
    .withVideoCodec(options.ffmpeg.videoCodec)
    .withAudioCodec(options.ffmpeg.audioCodec)
    .addOptions(options.ffmpeg.options)
    .on('start', function (commandLine) {
      options.emitter.emit('start', commandLine);
    })
    .on('progress', function (info) {
      options.emitter.emit('progress', info);
    })
    .on('error', function (err) {
      options.emitter.emit('transcode-error', err);
      cb(err);
    })
    .on('end', function () {
      options.emitter.emit('transcode-end');
      if (typeof(options.source) === 'string') {
        fs.unlink(options.source, function (err) {
          cb(err, tempFile);
        });
      } else {
        cb(null, tempFile);
      }
    })
    .saveToFile(tempFile);

}

exports.encode = function (options, cb) {
  if (options.mediaType.indexOf('quicktime') !== -1) {
    saveToTemp(options.source, function (err, path) {
      options.source = path;
      doEncode(options, cb);
    });
  } else {
    doEncode(options, cb);
  }
};
