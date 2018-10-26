var s3Files = require('s3-files');
var archiver = require('archiver');

var s3Zip = {};
module.exports = s3Zip;

s3Zip.archive = function(opts, folder, filesS3, filesZip) {
  var self = this;
  var connectionConfig;

  this.folder = folder;

  self.debug = opts.debug || false;

  if ('s3' in opts) {
    connectionConfig = {
      s3: opts.s3,
    };
  } else {
    connectionConfig = {
      region: opts.region,
    };
  }

  connectionConfig.bucket = opts.bucket;

  self.client = s3Files.connect(connectionConfig);

  var keyStream = self.client.createKeyStream(folder, filesS3);

  var preserveFolderStructure =
    opts.preserveFolderStructure === true || filesZip;
  var fileStream = s3Files.createFileStream(keyStream, preserveFolderStructure);
  var archive = self.archiveStream(fileStream, filesS3, filesZip);

  return archive;
};

s3Zip.archiveStream = function(stream, filesS3, filesZip) {
  var self = this;
  var folder = this.folder || '';
  var archive = archiver(this.format || 'zip', this.archiverOpts || {});
  archive.on('error', function(err) {
    self.debug && console.log('archive error', err);
  });
  stream
    .on('data', function(file) {
      if (file.path[file.path.length - 1] === '/') {
        self.debug && console.log("don't append to zip", file.path);
        return;
      }
      var fname;
      if (filesZip) {
        // Place files_s3[i] into the archive as files_zip[i]
        var i = filesS3.indexOf(
          file.path.startsWith(folder)
            ? file.path.substr(folder.length)
            : file.path
        );
        fname = i >= 0 && i < filesZip.length ? filesZip[i] : file.path;
      } else {
        // Just use the S3 file name
        fname = file.path;
      }
      var entryData = typeof fname === 'object' ? fname : { name: fname };
      self.debug && console.log('append to zip', fname);
      if (file.data.length === 0) {
        archive.append('', entryData);
      } else {
        archive.append(file.data, entryData);
      }
    })
    .on('end', function() {
      self.debug && console.log('end -> finalize');
      archive.finalize();
    })
    .on('error', function(err) {
      archive.emit('error', err);
    });

  return archive;
};

s3Zip.setFormat = function(format) {
  this.format = format;
  return this;
};

s3Zip.setArchiverOptions = function(archiverOpts) {
  this.archiverOpts = archiverOpts;
  return this;
};
