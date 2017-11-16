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

var fs = require('fs')
var join = require('path').join
var s3Zip = require('s3-zip')

var region = 'bucket-region'
var bucket = 'name-of-s3-bucket'
var folder = 'name-of-bucket-folder/'
var file1 = 'Image A.png'
var file2 = 'Image B.png'
var file3 = 'Image C.png'
var file4 = 'Image D.png'

var output = fs.createWriteStream(join(__dirname, 'use-s3-zip.zip'))

s3Zip
  .archive({ region: region, bucket: bucket}, folder, [file1, file2, file3, file4])
  .pipe(output)

```

You can also pass a custom S3 client. For example if you want to zip files from a S3 compatible storage:

```javascript
var aws = require('aws-sdk')

var s3Client = new aws.S3({
    signatureVersion: 'v4',
    s3ForcePathStyle: 'true',
    endpoint: 'http://localhost:9000',
})

s3Zip
  .archive({ s3: s3Client, bucket: 'boom' }, folder, [file1, file2])
  .pipe(output)
```

### Zip files with AWS Lambda

Example of s3-zip in combination with [AWS Lambda](aws_lambda.md).


### Zip a whole bucket folder

```javascript
var fs = require('fs')
var join = require('path').join
var AWS = require('aws-sdk')
var s3Zip = require('s3-zip')
var XmlStream = require('xml-stream')

var region = 'bucket-region'
var bucket = 'name-of-s3-bucket'
var folder = 'name-of-bucket-folder/'
var s3 = new AWS.S3({ region: region })
var params = {
  Bucket: bucket,
  Prefix: folder
}

var filesArray = []
var files = s3.listObjects(params).createReadStream()
var xml = new XmlStream(files)
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
  var output = fs.createWriteStream(join(__dirname, 'use-s3-zip.zip'))
  s3Zip
   .archive({ region: region, bucket: bucket, preserveFolderStructure: true }, folder, files)
   .pipe(output)
}
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
