const s3Zip = require('../s3-zip.js')
const t = require('tap')
const archiverZipEncryptable = require('archiver-zip-encryptable')

t.test('test duplicate format registration does not error', function (child) {
  // First registration should work
  s3Zip.setRegisterFormatOptions('zip-encryptable', archiverZipEncryptable)

  // Try to register the format via archiveStream simulation
  const mockStream = {
    on: function (event, callback) {
      if (event === 'end') {
        setTimeout(callback, 10) // Simulate async behavior
      } else if (event === 'data') {
        // Don't emit any data
      } else if (event === 'error') {
        // Don't emit any errors
      }
      return this
    }
  }

  try {
    // First call to archiveStream (should register format)
    const archive1 = s3Zip.archiveStream(mockStream, [], [])
    child.ok(archive1, 'First archiveStream call succeeded')

    // Second call to archiveStream (should NOT fail due to duplicate registration)
    const archive2 = s3Zip.archiveStream(mockStream, [], [])
    child.ok(archive2, 'Second archiveStream call succeeded')

    child.end()
  } catch (err) {
    child.fail(`archiveStream calls failed: ${err.message}`)
    child.end()
  }
})
