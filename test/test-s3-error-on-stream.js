var s3Zip = require('../lib/s3-zip.js');
var t = require('tap');
var fs = require('fs');
var Stream = require('stream');
var concat = require('concat-stream');
var join = require('path').join;
var proxyquire = require('proxyquire');
var sinon = require('sinon');

var fileStream = function(file) {
  var rs = new Stream();
  rs.readable = true;
  var fileStream = fs.createReadStream(join(__dirname, file));
  fileStream.pipe(
    concat(function buffersEmit() {
      rs.emit('error', new Error());
    })
  );
  fileStream.on('end', function() {
    console.log('end fileStream');
    rs.emit('end');
  });
  return rs;
};

t.test('test if error on filestream with archiveStream', function(child) {
  var stream = fileStream('./fixtures/file.txt');
  var files = ['foo.png'];
  s3Zip.archiveStream(stream, files);
  child.end();
});

t.test('test if error on filestream with archive', function(child) {
  var stream = fileStream('./fixtures/file.txt');
  s3Zip = proxyquire('../s3-zip.js', {
    's3-files': { createFileStream: sinon.stub().returns(stream) },
  });
  var files = ['foo.png'];
  s3Zip.archive({ region: 'region', bucket: 'bucket' }, 'folder', files);
  child.end();
});
