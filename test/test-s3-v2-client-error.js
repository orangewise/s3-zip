// Test s3-zip with AWS SDK v2 client which should produce clear error

const s3Zip = require('../s3-zip.js')
const t = require('tap')

t.test('test s3-zip with AWS SDK v2 client should fail with clear error', function (child) {
  // Mock AWS SDK v2 client (no .send method)
  const awsV2Client = {
    getObject: function (params) {
      return {
        promise: function () {
          return Promise.resolve({ Body: Buffer.from('test data') })
        }
      }
    }
  }

  try {
    // This should fail with a clear error message about AWS SDK compatibility
    s3Zip.archive(
      { s3: awsV2Client, bucket: 'test-bucket' },
      'folder/',
      ['test-file.txt']
    )

    // If we get here without an error, the test failed
    child.fail('Expected an error about AWS SDK compatibility but none was thrown')
    child.end()
  } catch (error) {
    // We should get a clear error about AWS SDK version compatibility
    child.ok(error.message.includes('AWS SDK v3'), 'Should get clear error about AWS SDK v3 requirement')
    child.ok(error.message.includes('@aws-sdk/client-s3'), 'Should mention the correct package')
    child.end()
  }
})

t.test('test s3-zip with null s3 client should fail with clear error', function (child) {
  try {
    // This should fail with a clear error message about AWS SDK compatibility
    s3Zip.archive(
      { s3: null, bucket: 'test-bucket' },
      'folder/',
      ['test-file.txt']
    )

    // If we get here without an error, the test failed
    child.fail('Expected an error about AWS SDK compatibility but none was thrown')
    child.end()
  } catch (error) {
    // We should get a clear error about AWS SDK version compatibility
    child.ok(error.message.includes('AWS SDK v3'), 'Should get clear error about AWS SDK v3 requirement')
    child.ok(error.message.includes('.send() method'), 'Should mention the .send() method requirement')
    child.end()
  }
})
