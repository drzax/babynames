#!/usr/bin/env node

const fs = require('fs');
const vfs = require('vinyl-fs');
const stringify = require('csv-stringify');

const {
  csvRows,
  usaParseRow,
  sum,
  addLocation,
  jsonStringify
} = require('./transforms');

const outStream = addLocation('us');

outStream.pipe(jsonStringify()).pipe(fs.createWriteStream('output/us.json'));

var stream = vfs
  .src('./data/*.txt', { buffer: false })
  .pipe(csvRows())
  .pipe(usaParseRow())
  .pipe(sum(outStream))
  .pipe(stringify())
  .pipe(fs.createWriteStream('output/us.csv'));
