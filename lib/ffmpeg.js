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

function doEncode(options) {
  new FFMpeg({ source: options.source, nolog: options.ffmpeg.nolog })
    .withVideoCodec(options.ffmpeg.videoCodec)
    .withAudioCodec(options.ffmpeg.audioCodec)
    .addOptions(options.ffmpeg.options)
    .on('start', function (commandLine) {
      options.emitter.emit('transcode-start', { jobId: options.jobId, commandLink: commandLine });
      options.emitter.emit('transcode-start-' + options.jobId, commandLine);
    })
    .on('progress', function (info) {
      options.emitter.emit('transcode-progress', { jobId: options.jobId, info: info });
      options.emitter.emit('transcode-progress-' + options.jobId, info);
    })
    .on('error', function (err, stdout, stderr) {
      options.emitter.emit('transcode-error', { jobId: options.jobId, err: err, stdout: stdout, stderr: stderr });
      options.emitter.emit('transcode-error-' + options.jobId);
    })
    .on('end', function () {
      options.emitter.emit('transcode-end', { jobId: options.jobId });
      options.emitter.emit('transcode-end-' + options.jobId);
      fs.unlink(options.source);
    })
    .saveToFile(options.destination);
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
