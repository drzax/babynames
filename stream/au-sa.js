#!/usr/bin/env node

const fs = require('fs');
const vfs = require('vinyl-fs');
const stringify = require('csv-stringify');

const {
  csvRows,
  saParseRow,
  sum,
  addLocation,
  jsonStringify
} = require('./transforms');

const outStream = addLocation('au-sa');

outStream.pipe(jsonStringify()).pipe(fs.createWriteStream('output/au-sa.json'));

var stream = vfs
  .src('./data-au/sa/*.csv', { buffer: false })
  .pipe(csvRows(1))
  .pipe(saParseRow())
  .pipe(sum(outStream))
  .pipe(stringify())
  .pipe(fs.createWriteStream('output/au-sa.csv'));
