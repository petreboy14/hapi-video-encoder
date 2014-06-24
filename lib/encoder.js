var fileOutput = require('./output/file');
var s3Output = require('./output/s3');
var streamOutput = require('./output/stream');

exports.register = function (plugin, options) {
  // Get output handler
  var handler = null;

  switch (options.output) {
  case 'stream':
    handler = streamOutput(options);
    break;
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
        output: 'stream',
        maxBytes: options.route.maxBytes
      }
    }
  });
};
