#!/usr/bin/env node

const fs = require('fs');
const vfs = require('vinyl-fs');
const stringify = require('csv-stringify');

const {
  csvRows,
  usaParseRow,
  aggregate,
  jsonStringify
} = require('./transforms');

var stream = vfs
  .src('./data/*.txt', { buffer: false })
  .pipe(csvRows())
  .pipe(usaParseRow())
  .pipe(aggregate('output/us.sqlite'))
  .pipe(stringify())
  .pipe(fs.createWriteStream('output/us.csv'));
