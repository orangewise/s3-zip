# s3-zip

[![npm version][npm-badge]][npm-url]
[![Build Status][travis-badge]][travis-url]
[![Coverage Status][coveralls-badge]][coveralls-url]
[![JavaScript Style Guide](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)

Download selected files from an Amazon S3 bucket as a zip file.



## Install

```
npm install s3-zip
```


## AWS Configuration

Refer to the [AWS SDK][aws-sdk-url] for authenticating to AWS prior to using this plugin.



## Usage

### Zip specific files

```javascript

const fs = require('fs')
const join = require('path').join
const s3Zip = require('s3-zip')

const region = 'bucket-region'
const bucket = 'name-of-s3-bucket'
const folder = 'name-of-bucket-folder/'
const file1 = 'Image A.png'
const file2 = 'Image B.png'
const file3 = 'Image C.png'
const file4 = 'Image D.png'

const output = fs.createWriteStream(join(__dirname, 'use-s3-zip.zip'))

s3Zip
  .archive({ region: region, bucket: bucket}, folder, [file1, file2, file3, file4])
  .pipe(output)

```

You can also pass a custom S3 client. For example if you want to zip files from a S3 compatible storage:

```javascript
const aws = require('aws-sdk')

const s3Client = new aws.S3({
  signatureVersion: 'v4',
  s3ForcePathStyle: 'true',
  endpoint: 'http://localhost:9000',
})

s3Zip
  .archive({ s3: s3Client, bucket: bucket }, folder, [file1, file2])
  .pipe(output)
```

### Zip files with AWS Lambda

Example of s3-zip in combination with [AWS Lambda](aws_lambda.md).


### Zip a whole bucket folder

```javascript
const fs = require('fs')
const join = require('path').join
const AWS = require('aws-sdk')
const s3Zip = require('s3-zip')
const XmlStream = require('xml-stream')

const region = 'bucket-region'
const bucket = 'name-of-s3-bucket'
const folder = 'name-of-bucket-folder/'
const s3 = new AWS.S3({ region: region })
const params = {
  Bucket: bucket,
  Prefix: folder
}

const filesArray = []
const files = s3.listObjects(params).createReadStream()
const xml = new XmlStream(files)
xml.collect('Key')
xml.on('endElement: Key', function(item) {
  filesArray.push(item['$text'].substr(folder.length))
})

xml
  .on('end', function () {
    zip(filesArray)
  })

function zip(files) {
  console.log(files)
  const output = fs.createWriteStream(join(__dirname, 'use-s3-zip.zip'))
  s3Zip
   .archive({ region: region, bucket: bucket, preserveFolderStructure: true }, folder, files)
   .pipe(output)
}
```

### Tar format support

```javascript
s3Zip
  .setFormat('tar')
  .archive({ region: region, bucket: bucket }, folder, [file1, file2])
  .pipe(output)
```

### Zip a file with protected password

```javascript
s3Zip
  .setRegisterFormatOptions('zip-encrypted', require("archiver-zip-encrypted"))
  .setFormat('zip-encryptable')
  .setArchiverOptions({zlib: {level: 8}, encryptionMethod: 'aes256', password: '123'})
  .archive({ region: region, bucket: bucket }, folder, [file1, file2])
  .pipe(output)
```

### Archiver options

We use [archiver][archiver-url] to create archives. To pass your options to it, use `setArchiverOptions` method:

```javascript
s3Zip
  .setFormat('tar')
  .setArchiverOptions({ gzip: true })
  .archive({ region: region, bucket: bucket }, folder, [file1, file2])
```

### Organize your archive with custom paths and permissions

You can pass an array of objects with type [EntryData][entrydata-url] to organize your archive.

```javascript
const files = ['flower.jpg', 'road.jpg']
const archiveFiles = [
  { name: 'newFolder/flower.jpg' },

  /* _rw_______ */
  { name: 'road.jpg', mode: parseInt('0600', 8)  }
];
s3Zip.archive({ region: region, bucket: bucket }, folder, files, archiveFiles)
```

### Using with ExpressJS

`s3-zip` works with any framework which leverages on NodeJS Streams including ExpressJS.

```javascript
const s3Zip = require('s3-zip')

app.get('/download', (req, res) => {
  s3Zip
    .archive({ region: region, bucket: bucket }, '', 'abc.jpg')
    .pipe(res)
})
```
Above should stream out the file in the response of the request.

## Getting Content-Length

If you want to set the Content-Length Header to show the Progress you can use the `getContentLength()` Method, it will return the content length in byte.

```javascript
s3Zip.getContentLength(s3Client: AWS.S3, bucket: String, files: String[], folder: ?String): Promise
```
? means optional -> folder parameter is optional

```javascript
const s3Zip = require('s3-zip')

app.get('/download', async (req, res) => {

  // ...

  const contentLength = await s3Zip.getContentLength(s3Client, bucket, files, folder)
  
  // now you can set the Content-Length Header
  res.set('Content-Length', contentLength)

  // ...

  s3Zip
    .archive({ region: region, bucket: bucket }, '', 'abc.jpg')
    .pipe(res)
})
```

### Debug mode

Enable debug mode to see the logs:

```javascript
s3Zip.archive({ region: region, bucket: bucket, debug: true }, folder, files)
```

## Testing

Tests are written in Node Tap, run them like this:

```
npm t
```

If you would like a more fancy coverage report:

```
npm run coverage
```




[aws-sdk-url]: http://docs.aws.amazon.com/AWSJavaScriptSDK/guide/node-configuring.html
[npm-badge]: https://badge.fury.io/js/s3-zip.svg
[npm-url]: https://badge.fury.io/js/s3-zip
[travis-badge]: https://travis-ci.org/orangewise/s3-zip.svg?branch=master
[travis-url]: https://travis-ci.org/orangewise/s3-zip
[coveralls-badge]: https://coveralls.io/repos/github/orangewise/s3-zip/badge.svg?branch=master
[coveralls-url]: https://coveralls.io/github/orangewise/s3-zip?branch=master
[archiver-url]: https://www.npmjs.com/package/archiver
[entrydata-url]: https://archiverjs.com/docs/global.html#EntryData
