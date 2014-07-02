var events = require('events');

var fileOutput = require('./output/file');
var s3Output = require('./output/s3');

exports.register = function (plugin, options) {
  // Get output handler
  options.emitter = new events.EventEmitter();
  var handler = null;

  switch (options.output) {
  case 'file':
    handler = fileOutput(options);
    break;
  case 's3':
    handler = s3Output(options);
    break;
  }

  // Build route
  plugin.route({
    method: 'POST',
    path: options.route.path,
    handler: handler,
    config: {
      payload: {
        output: 'file',
        uploads: options.tempDir,
        maxBytes: options.route.maxBytes
      }
    }
  });

  plugin.expose('emitter', options.emitter);
};
