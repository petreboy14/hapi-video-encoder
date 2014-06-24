var Hapi = require('hapi');

var server = new Hapi.Server(8000, 'localhost', { cors: true });
server.pack.register({
  plugin: require('../index'),
  options: {
    output: 's3',
    s3: {
      accessKey: 'AWS_KEY',
      secretKey: 'AWS_SECRET',
      region: 'us-west-2',
      bucket: 'revolt_user_uploads',
      key: '/encoded.mp4'
    }
  }
}, function (err) {
  if (err) {
    console.log(err);
  }
});

server.start(function () {
  console.log('Example file server listening');
});
