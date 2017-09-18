#!/usr/bin/env node

const fs = require('fs');
const vfs = require('vinyl-fs');
const stringify = require('csv-stringify');

const {
  csvRows,
  saParseRow,
  aggregate,
  addLocation,
  jsonStringify
} = require('./transforms');

var stream = vfs
  .src('./data-au/sa/*.csv', { buffer: false })
  .pipe(csvRows(1))
  .pipe(saParseRow())
  .pipe(aggregate('output/au-sa.sqlite'))
  .pipe(stringify())
  .pipe(fs.createWriteStream('output/au-sa.csv'));
