// Test to cover missing lines for full coverage

const t = require('tap')
const Stream = require('stream')
const sinon = require('sinon')
const proxyquire = require('proxyquire')

// Mock s3Files to avoid real S3 calls
const mockS3Files = {
  connect: sinon.stub().returns({
    createKeyStream: sinon.stub().returns(new Stream())
  }),
  createFileStream: sinon.stub().returns(new Stream())
}

const s3Zip = proxyquire('../s3-zip.js', {
  's3-files': mockS3Files
})

t.test('test archive with valid AWS SDK v3 client', function (child) {
  // Mock valid AWS SDK v3 client (has .send method)
  const awsV3Client = {
    send: function (command) {
      return Promise.resolve({ Body: Buffer.from('test data') })
    }
  }

  try {
    // This should work and cover line 21: connectionConfig = { s3: opts.s3 }
    const archive = s3Zip.archive(
      { s3: awsV3Client, bucket: 'test-bucket' },
      'folder/',
      ['test-file.txt']
    )

    child.type(archive, 'object', 'Should return archive object')
    child.end()
  } catch (error) {
    child.fail(`Should not throw error with valid SDK v3 client: ${error.message}`)
    child.end()
  }
})

t.test('test archiveStream with debug mode and directory paths', function (child) {
  const rs = new Stream()
  rs.readable = true

  // Enable debug mode to cover lines 59-60
  s3Zip.debug = true

  const archive = s3Zip.archiveStream(rs, [])

  // Emit a directory path to trigger the debug log
  rs.emit('data', { data: Buffer.alloc(0), path: 'test-folder/' })
  rs.emit('end')

  child.type(archive, 'object', 'Should return archive object')
  child.end()
})

t.test('test archiveStream with file not in filesS3 array', function (child) {
  const rs = new Stream()
  rs.readable = true

  // Test the ternary on line 66 - when file is not found in filesS3 array
  const archive = s3Zip.archiveStream(rs, ['different-file.txt'], ['renamed.txt'])

  // Emit a file that's not in the filesS3 array
  rs.emit('data', {
    data: Buffer.from('test content'),
    path: 'not-in-list.txt'
  })
  rs.emit('end')

  child.type(archive, 'object', 'Should return archive object')
  child.end()
})

t.test('test archiveStream with debug and archive error', function (child) {
  const rs = new Stream()
  rs.readable = true

  // Enable debug mode to cover line 54
  s3Zip.debug = true

  const archive = s3Zip.archiveStream(rs, [])

  // Force an archive error to trigger the debug log on line 54
  setImmediate(() => {
    archive.emit('error', new Error('test error'))
  })

  rs.emit('end')

  child.type(archive, 'object', 'Should return archive object')
  child.end()
})
