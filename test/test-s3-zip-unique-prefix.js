var s3Zip = require('../lib/s3-zip.js');
var t = require('tap');
var fs = require('fs');
var Stream = require('stream');
var concat = require('concat-stream');
var yauzl = require('yauzl');
var join = require('path').join;
var streamify = require('stream-array');

var fileStreamForFiles = function(files, preserveFolderPath) {
  var rs = new Stream();
  rs.readable = true;

  var fileCounter = 0;
  streamify(files).on('data', function(file) {
    fileCounter += 1;

    var fileStream = fs.createReadStream(join(__dirname, file));
    fileStream.pipe(
      concat(function buffersEmit(buffer) {
        // console.log('buffers concatenated, emit data for ', file);
        var path = preserveFolderPath ? file : file.replace(/^.*[\\/]/, '');
        rs.emit('data', { data: buffer, path: path });
      })
    );
    fileStream.on('end', function() {
      fileCounter -= 1;
      if (fileCounter < 1) {
        // console.log('all files processed, emit end');
        rs.emit('end');
      }
    });
  });
  return rs;
};

var file1 = 'a/file.txt';
var file1Alt = 'file.txt';
var file2 = 'b/file.txt';
var file2Alt = 'file-1.txt';
var sinon = require('sinon');
var proxyquire = require('proxyquire');
var s3Stub = fileStreamForFiles(
  ['/fixtures/folder/a/file.txt', '/fixtures/folder/b/file.txt'],
  true
);
s3Zip = proxyquire('../s3-zip.js', {
  's3-files': { createFileStream: sinon.stub().returns(s3Stub) },
});

t.test(
  'test archive with matching alternate zip archive names but unique keys',
  function(child) {
    var outputPath = join(__dirname, '/test-unique.zip');
    var output = fs.createWriteStream(outputPath);

    var archive = s3Zip
      .archive(
        { region: 'region', bucket: 'bucket' },
        '/fixtures/folder/',
        [file1, file2],
        [{ name: file1Alt }, { name: file2Alt }]
      )
      .pipe(output);

    var altFiles = [file1Alt, file2Alt];

    archive.on('close', function() {
      yauzl.open(outputPath, function(err, zip) {
        if (err) console.log('err', err);
        zip.on('entry', function(entry) {
          var i = altFiles.indexOf(entry.fileName);
          if (i > -1) {
            child.same(entry.fileName, altFiles[i]);
            altFiles.splice(i, 1);
          } else {
            child.ok(false, 'File not found in alternate file names list.');
          }
        });

        zip.on('close', function() {
          child.end();
        });
      });
    });

    child.type(archive, 'object');
  }
);
