hapi-video-encoder
==================

Hapi plugin which generates an endpoint for accepting video which is streamed to ffmpeg for video manipulation/transcoding purposes. The resulting video can either be stored permenantly to disk or streamed to an s3 container. 

## Requirements

* hapi - [Hapi](https://github.com/spumko/hapi) will be used as the server which will accept incoming POST requests with the media to be transcoded. 
* ffmpeg - This module uses the [https://github.com/fluent-ffmpeg/node-fluent-ffmpeg](https://github.com/fluent-ffmpeg/node-fluent-ffmpeg) module for interfacing with ffmpeg. The ffmpeg binaries must be installed on the same system as the hapi server. 

## Installation
* ffmpeg - Installation of ffmpeg can be a beast if it's not included how you want it configured in your package manager. Some helpful guides for manual compilation:
  * [Ubuntu/Debian/Mint](https://trac.ffmpeg.org/wiki/CompilationGuide/Ubuntu)
  * [MacOSX](https://trac.ffmpeg.org/wiki/CompilationGuide/MacOSX)
  * [CentOS/RedHat/Fedora](https://trac.ffmpeg.org/wiki/CompilationGuide/Centos)
* hapi-video-encoder - Installed via npm:
```
$ npm install hapi-video-encoder
```

## Basic Usage

After creating a Hapi server object register the hapi-video-encoder plugin:

```
var server = new Hapi.server(...);
server.pack.regiser({
  plugin: require('hapi-video-encoder'),
  options: { // options described below }
});
```

This will add a POST route (by default) /media which will handle incoming media requests. It also sets up a basic ffmpeg command to encode videos to mp4 for use in HTML5 video tags. For a quick test cd into the examples folder:

```
$ cd examples
$ node file.js
```

This has started a minimal server running on port 8000 which will accept a media file at the /media route and transcode it an mp4 file named boom.mp4 in the project directory. To test POST a file to that endpoint:

```
$ curl -X POST -F file=@video1.avi http://localhost:8000/media
```

The result will be a job id which could be used to lookup information about the job if the user implements a tracking system.

## Options

Option that can be sent to plugin are as shown. The values filled in are defaults. Note that s3 and file options are only required when using those outputs respectively. 

```
server.pack.register({
  plugin: require('hapi-video-encoder'),
  options: {
    output: 'file', // Can be 'file' or 's3' and describe where the finalized transcoded media is sent.
    route: {
      path: '/media', // The endpoint for which the hapi server will listen for incoming POSTed media
      fileParam: 'file', // Which payload parameter contains the media stream ie request.payload.file
      maxBytes: 5368709120 // The maximum file size of the media stream (default 5 GB)
    },
    ffmpeg: {
      videoCodec: 'libx264', // Which video codec to use for video compression and transcoding
      audioCodec: 'libfaac', // Which audio coded use for audio compression and transcoding
      nolog: true, // Quiets the output from node-fluent-ffmpeg
      options: [ // Extra arguments that are sent to the ffmpeg process (described below) ]
    },
    file: {
      outputPath: '' // Where the transcoded file should be placed. If not set will be stored in a temporary location
    },
    s3: {
      acl: 'bucket-owner-full-control', // ACL rule to use for uploaded media
      accessKey: '', // AWS Access Key
      secretKey: '', // AWS Secret Key
      region: '', // S3 region
      endpoint: 'https://s3.amazonaws.com', // S3 Endpoint
      bucket: '' // S3 bucket to place transcoded media. 
    }
  }
});
```

## Output Modes
 * File - The default output mode for transcoded media is to store it on the server. The location depends on the `file.outputPath` parameter. If it is missing the file will be stored in a temporary generic file. If `file.outputPath` is set in the plugin options media will be saved there. Lastly, the file location can be overwritten if the upload specifies a path: ie:

    ```
    $ curl -X POST -F file=@video1.avi http://localhost:8000/media;outputPath=/some/cool/path/file.m3v
    ```
 * S3 - If desired, transcoded media can be streamed to s3. Requirements for this are to specify `bucket` and `key`. If `bucket` is set in plugin options as described above then that bucket will be used for all uploads. The bucket can be overwritten for a single upload if it is specified in the payload such as:
 
    ```
    $ curl -X POST -F file=@video1.avi http://localhost:8000/media;bucket=uploads
    ``` 

  The S3 key by default will be the filename that comes along with the form post metadata. This can be overwritten by specifying `key` in the payload:

    ```
    $ curl -X POST -F file=@video1.avi http://localhost:8000/media;key=/super/cool/key.mov
    ```

## Events
An event-emitter is exposed through the plugin interface which will report transcoding information. It can be accessed through the server object:

```
var emitter = server.plugins['hapi-video-encoder'].emitter;
emitter.on('transcode-start', function (info) {
 console.log(info);
});
```

### Event Names
* transcode-start - When transcoding has begun. Will return an object with job id and details about the file
* transcode-progress - FFmpeg progress details for job.
* transcode-error - Emitted when receiving an error event from ffmpeg
* transcode-end - The stream has been completely transcoded
* s3-start - Starting to upload stream to S3
* s3-progress - Progress event for S3 uploading
* s3-end - Object successfully uploaded to S3
* s3-error - Return an s3 error
  
## Default FFmpeg Settings
The current default settings of ffmpeg are geared towards generating html5 compatible mp4 files. Those settings and explanations are:

* videoCodec: 'libx264' - Pretty standard codec for handling the h.264 video compression format
* audioCodec: 'libfaac' - Again a standard codec for handling most audio formats
* options: [
  * -pix_fmt yuv420p - Pixel format that is widely compatible with different players and devices. 
  * -profile:v baseline - Allows compatability with a wide range of devices and platforms
  * -preset fast - Tradeoff for faster transcoding but less compression
  * -crf 23 - Specifies overall quality rating. This is a middle of the road setting,
  * -movflags +faststart - Lets the video play almost immediately for the user providing a better experience
  * vf scale=trunc(in_w/2)*2:trunc(in_h/2)*2 - Make sure the video doesn't have an odd width or height
  * -f mp4 - Specifies the result container to be mp4
]

## TODO
* Allow a stream interface to pipe streaming transcodings to. This is useful for streaming media formats
* Handle screenshot generation. FFmpeg allows for multiple screenshots while transcoding video. Want to expose this functionality.
* Generate mulitple formats from same input stream. Right now you can only create 1 format from 1 input. 

## Considerations
* Storage space - While most transcodings can be streamed into the transcoder there are some formats that have to be written to disk after transcoding (such as mp4). And some media formats (such as quicktime) must be read completely from disk before transcoding even begins. For this reason you should ensure that you have enough disk space to handle the expected amount of transcoding jobs. 
* CPU - Transcoding is CPU intensive and the more quality and compression that is desired, the more stress on the CPU so ensure that your hardware is 
* ffmpeg settings - With the multitude of formats/options/codecs there are simply too many options to specify one "setting" as being correct for every situation. Playing with quality and compression levels until you strike a satisfactory balance between size, transcode time, and quality will most likely be required. 


## References
* [ffmpeg main site](https://www.ffmpeg.org/) - The official ffmpeg website containing documentation and information on every single thing in the ffmpeg world. 
* [h.264 encoding guide](https://trac.ffmpeg.org/wiki/Encode/H.264) - Some useful information about settings relevant to encoding with the libx264 library and useful for applications using web containers (mp4, ogg, etc). 
* [ffmpeg streaming guide](https://trac.ffmpeg.org/wiki/StreamingGuide) - Relevant information for streaming transcoded media from ffmpeg.
* [html5 video encoding guide](https://blog.mediacru.sh/2013/12/23/The-right-way-to-encode-HTML5-video.html) - Very helpful article for setting ffmpeg options when transcoding html5 compatible media.
