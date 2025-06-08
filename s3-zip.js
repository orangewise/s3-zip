const s3Files = require('s3-files')
const archiver = require('archiver')

const s3Zip = {}
module.exports = s3Zip

s3Zip.archive = function (opts, folder, filesS3, filesZip) {
  const self = this
  let connectionConfig

  this.folder = folder

  self.debug = opts.debug || false

  if ('s3' in opts) {
    // Validate that the provided S3 client is compatible with AWS SDK v3
    if (!opts.s3 || typeof opts.s3.send !== 'function') {
      throw new Error('The provided S3 client must be an AWS SDK v3 client with a .send() method. ' +
        'Please use @aws-sdk/client-s3 (v3) instead of aws-sdk (v2).')
    }
    connectionConfig = {
      s3: opts.s3
    }
  } else {
    connectionConfig = {
      region: opts.region
    }
  }

  connectionConfig.bucket = opts.bucket

  self.client = s3Files.connect(connectionConfig)

  const keyStream = self.client.createKeyStream(folder, filesS3)

  const preserveFolderStructure = opts.preserveFolderStructure === true || filesZip
  const fileStream = s3Files.createFileStream(keyStream, preserveFolderStructure)
  const archive = self.archiveStream(fileStream, filesS3, filesZip)

  return archive
}

s3Zip.archiveStream = function (stream, filesS3, filesZip) {
  const self = this
  const folder = this.folder || ''
  if (this.registerFormat) {
    archiver.registerFormat(this.registerFormat, this.formatModule)
  }
  const archive = archiver(this.format || 'zip', this.archiverOpts || {})
  archive.on('error', function (err) {
    self.debug && console.log('archive error', err)
  })
  stream
    .on('data', function (file) {
      if (file.path[file.path.length - 1] === '/') {
        self.debug && console.log('don\'t append to zip', file.path)
        return
      }
      let fname
      if (filesZip) {
        // Place files_s3[i] into the archive as files_zip[i]
        const i = filesS3.indexOf(file.path.startsWith(folder) ? file.path.substr(folder.length) : file.path)
        fname = (i >= 0 && i < filesZip.length) ? filesZip[i] : file.path
        filesS3[i] = ''
      } else {
        // Just use the S3 file name
        fname = file.path
      }
      const entryData = typeof fname === 'object' ? fname : { name: fname }
      self.debug && console.log('append to zip', fname)
      if (file.data.length === 0) {
        archive.append('', entryData)
      } else {
        archive.append(file.data, entryData)
      }
    })
    .on('end', function () {
      self.debug && console.log('end -> finalize')
      archive.finalize()
    })
    .on('error', function (err) {
      archive.emit('error', err)
    })

  return archive
}

s3Zip.setFormat = function (format) {
  this.format = format
  return this
}

s3Zip.setArchiverOptions = function (archiverOpts) {
  this.archiverOpts = archiverOpts
  return this
}

s3Zip.setRegisterFormatOptions = function (registerFormat, formatModule) {
  this.registerFormat = registerFormat
  this.formatModule = formatModule
  return this
}
