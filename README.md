# s3-zip

[![CircleCI](https://circleci.com/gh/CandisIO/s3-zip/tree/master.svg?style=svg)](https://circleci.com/gh/CandisIO/s3-zip/tree/master)

Download selected files from an Amazon S3 bucket as a zip file.

## Install

```
npm install @candis/s3-zip
```

## AWS Configuration

Refer to the AWS SDK for authenticating to AWS prior to using this plugin.

## Usage

### Zip specific files

```js
import fs from "fs";
import { join } from "path";
import s3Zip from "@candis/s3-zip";

const region = "bucket-region";
const bucket = "name-of-s3-bucket";
const folder = "name-of-bucket-folder/";
const file1 = "Image A.png";
const file2 = "Image B.png";
const file3 = "Image C.png";
const file4 = "Image D.png";

const output = fs.createWriteStream(join(__dirname, "use-s3-zip.zip"));

s3Zip
  .archive({ region: region, bucket: bucket }, folder, [
    file1,
    file2,
    file3,
    file4
  ])
  .pipe(output);
```

You can also pass a custom S3 client. For example if you want to zip files from a S3 compatible storage:

```js
import AWS from "aws-sdk";

var s3Client = new AWS.S3({
  signatureVersion: "v4",
  s3ForcePathStyle: "true",
  endpoint: "http://localhost:9000"
});

s3Zip
  .archive({ s3: s3Client, bucket: bucket }, folder, [file1, file2])
  .pipe(output);
```

### Zip files with AWS Lambda

Example of s3-zip in combination with [AWS Lambda](aws_lambda.md).

### Zip a whole bucket folder

```js
import fs from "fs";
import { join } from "path";
import AWS from "aws-sdk";
import s3Zip from "@candis/s3-zip";
import XmlStream from "xml-stream";

const region = "bucket-region";
const bucket = "name-of-s3-bucket";
const folder = "name-of-bucket-folder/";
const s3 = new AWS.S3({ region: region });
const params = {
  Bucket: bucket,
  Prefix: folder
};

const filesArray = [];
const files = s3.listObjects(params).createReadStream();
const xml = new XmlStream(files);
xml.collect("Key");
xml.on("endElement: Key", function(item) {
  filesArray.push(item["$text"].substr(folder.length));
});

xml.on("end", function() {
  zip(filesArray);
});

function zip(files) {
  const output = fs.createWriteStream(join(__dirname, "use-s3-zip.zip"));
  s3Zip
    .archive(
      { region: region, bucket: bucket, preserveFolderStructure: true },
      folder,
      files
    )
    .pipe(output);
}
```

### Tar format support

```js
s3Zip
  .setFormat("tar")
  .archive({ region: region, bucket: bucket }, folder, [file1, file2])
  .pipe(output);
```

### Archiver options

We use [archiver][archiver-url] to create archives. To pass your options to it, use `setArchiverOptions` method:

```js
s3Zip
  .setFormat("tar")
  .setArchiverOptions({ gzip: true })
  .archive({ region: region, bucket: bucket }, folder, [file1, file2]);
```

### Organize your archive with custom paths and permissions

You can pass an array of objects with type [EntryData][entrydata-url] to organize your archive.

```js
const files = ["flower.jpg", "road.jpg"];
const archiveFiles = [
  { name: "newFolder/flower.jpg" },

  /* _rw_______ */
  { name: "road.jpg", mode: parseInt("0600", 8) }
];
s3Zip.archive({ region: region, bucket: bucket }, folder, files, archiveFiles);
```

### Debug mode

Enable debug mode to see the logs:

```js
s3Zip.archive({ region: region, bucket: bucket, debug: true }, folder, files);
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
