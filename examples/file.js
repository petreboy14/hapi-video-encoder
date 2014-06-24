var Hapi = require('hapi');

var server = new Hapi.Server(8000, 'localhost');
server.pack.register({
  plugin: require('../index'),
  options: {
    output: 'file',
    file: {
      outputPath: '../../boom.mp4'
    }
  }
}, function (err) {
  if (err) {
    console.log(err);
  }
});

server.start(function () {
  console.log('Example stream server listening');
});
