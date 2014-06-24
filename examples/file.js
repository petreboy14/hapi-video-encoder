var Hapi = require('hapi');

var server = new Hapi.Server(8000, 'localhost', { cors: true });
server.pack.register({
  plugin: require('../index'),
  options: {
    output: 'file',
    file: {
      outputPath: __dirname + '/../boom.mp4'
    }
  }
}, function (err) {
  if (err) {
    console.log(err);
  }
});

var encoderEvents = server.plugins['hapi-video-encoder'].events;

encoderEvents.on('transcode-start', function (data) {
  console.log('started', data);
});

encoderEvents.on('transcode-progress', function (data) {
  console.log('progress', data);
});

encoderEvents.on('transcode-stop', function (data) {
  console.log('stop', data);
});

encoderEvents.on('transcode-error', function (error) {
  console.error('error', error);
});

server.start(function () {
  console.log('Example file server listening');
});
