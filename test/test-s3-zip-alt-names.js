// Test s3-zip BUT using alternate file names in the resulting zip archive

var s3Zip = require('../lib/s3-zip.js');
var t = require('tap');
var fs = require('fs');
var Stream = require('stream');
var concat = require('concat-stream');
var yauzl = require('yauzl');
var join = require('path').join;
var tar = require('tar');

var fileStream = function(file, forceError) {
  var rs = new Stream();
  rs.readable = true;
  var fileStream = fs.createReadStream(join(__dirname, file));
  fileStream.pipe(
    concat(function buffersEmit(buffer) {
      if (forceError) {
        console.log('send end to finalize archive');
        rs.emit('end');
      } else {
        rs.emit('data', { data: buffer, path: file });
      }
    })
  );
  fileStream.on('end', function() {
    console.log('end fileStream');
    rs.emit('end');
  });
  return rs;
};

var file1 = '/fixtures/file.txt';
var file1Alt = 'FILE_ALT.TXT';
var file1DataEntry = { name: file1Alt, mode: parseInt('0600', 8) };
// Stub: var fileStream = s3Files.createFileStream(keyStream);
var sinon = require('sinon');
var proxyquire = require('proxyquire');
var s3Stub = fileStream(file1);
s3Zip = proxyquire('../s3-zip.js', {
  's3-files': { createFileStream: sinon.stub().returns(s3Stub) },
});

t.test(
  'test archiveStream and zip file with alternate file name in zip archive',
  function(child) {
    var output = fs.createWriteStream(join(__dirname, '/test-alt.zip'));
    var s = fileStream(file1);
    var archive = s3Zip.archiveStream(s, [file1], [file1Alt]).pipe(output);
    archive.on('close', function() {
      console.log('+++++++++++');
      yauzl.open(join(__dirname, '/test-alt.zip'), function(err, zip) {
        if (err) console.log('err', err);
        zip.on('entry', function(entry) {
          // console.log(entry);
          child.same(entry.fileName, file1Alt);
          child.same(entry.compressedSize, 11);
          child.same(entry.uncompressedSize, 20);
        });

        zip.on('close', function() {
          child.end();
        });
      });
    });
    child.type(archive, 'object');
  }
);

t.test('test archive with alternate zip archive names', function(child) {
  var archive = s3Zip.archive(
    { region: 'region', bucket: 'bucket' },
    'folder',
    [file1],
    [file1Alt]
  );
  child.type(archive, 'object');
  child.end();
});

t.test('test a tar archive with EntryData object', function(child) {
  var outputPath = join(__dirname, '/test-entrydata.tar');
  var output = fs.createWriteStream(outputPath);
  var archive = s3Zip
    .setFormat('tar')
    .archiveStream(fileStream(file1), [file1], [file1DataEntry])
    .pipe(output);

  archive.on('close', function() {
    fs.createReadStream(outputPath)
      .pipe(tar.list())
      .on('entry', function(entry) {
        child.same(entry.path, file1Alt);
        child.same(entry.mode, parseInt('0600', 8));
      })
      .on('end', function() {
        child.end();
      });
  });
});
