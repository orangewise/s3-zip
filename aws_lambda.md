# Using s3-zip in combination with AWS Lambda

## Create a lambda function


```javascript
const { Upload } = require("@aws-sdk/lib-storage");
const { S3 } = require("@aws-sdk/client-s3");
const s3Zip = require('s3-zip')
const {Readable} = require('stream')

exports.handler = function (event, context) {
  console.log('event', event)
  

  const region = event.region
  const bucket = event.bucket
  const folder = event.folder
  const files = event.files
  const zipFileName = event.zipFileName

  // Create body stream
  try {

    const writable = s3Zip.archive({ region: region, bucket: bucket}, folder, files)
    const body = Readable.from(writable)
    const zipParams = { params: { Bucket: bucket, Key: folder + zipFileName } }
    const zipFile = new S3(zipParams)
    new Upload({
      client: zipFile,
      params: { Body: body }
    })
      .on('httpUploadProgress', function (evt) { console.log(evt) })
      .done().then(
        (r) => {
          console.log(r)
          context.succeed(r)
        },
        (e) => {
          console.log('zipFile.upload error', e)
          context.fail(e)
        }
      )

  } catch (e) {
    const err = 'catched error: ' + e
    console.log(err)    
    context.fail(err)
  }
}

```

## Invoke the function

```javascript
const { LambdaClient } = require("@aws-sdk/client-lambda");

const region = 'bucket-region'
const bucket = 'name-of-s3-bucket'
const folder = 'name-of-bucket-folder/'
const file1 = 'Image A.png'
const file2 = 'Image B.png'
const file3 = 'Image C.png'
const file4 = 'Image D.png'


const lambda = new LambdaClient({
  region
})

const files = [file1, file2, file3, file4]
const payload = JSON.stringify({ 
  'region'     : region,
  'bucket'     : bucket,
  'folder'     : folder,
  'files'      :  files,
  'zipFileName': 'bla.zip'
})

const params = {
  FunctionName : 'NAME_OF_YOUR_LAMBDA_FUNCTION', 
  Payload      : payload
}


lambda.invoke(params, function (err, data) {
  if (err) console.log(err, err.stack) // an error occurred
  else     console.log(data)           // successful response
})

```
