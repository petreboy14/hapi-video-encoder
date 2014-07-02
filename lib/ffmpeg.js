var FFMpeg = require('fluent-ffmpeg');
var fs = require('fs');

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
      console.log(options.source);
      fs.unlink(options.source);
    })
    .saveToFile(options.destination);
}

exports.encode = function (options, cb) {
  doEncode(options, cb);
};
