var FFMpeg = require('fluent-ffmpeg');

exports.encode = function (options, output) {
  var cmd = new FFMpeg({ source: options.source, nolog: options.ffmpeg.nolog })
    .withVideoCodec(options.ffmpeg.videoCodec)
    .withAudioCodec(options.ffmpeg.audioCodec)
    .addOptions(options.ffmpeg.options)
    .on('start', function (commandLine) {
      console.log('Spawned FFmpeg with command: ' + commandLine);
    })
    .on('progress', function (info) {
      console.log(info);
    })
    .on('error', function (err) {
      console.log('Error happened: ' + err.message);
    })
    .on('end', function () {
      console.log('Conversion finished');
    });

  cmd.writeToStream(output);
};
