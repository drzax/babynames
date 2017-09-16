#!/usr/bin/env node

const request = require('request');
const unzip = require('unzip');
const fs = require('fs');
const path = require('path');

request(
  'https://data.sa.gov.au/data/dataset/9849aa7f-e316-426e-8ab5-74658a62c7e6/resource/534d13f2-237c-4448-a6a3-93c07b1bb614/download/baby-names-1944-2013.zip'
)
  .pipe(unzip.Parse())
  .on('entry', entry => {
    let match = entry.path.match(/((fe)?male)_cy([1,2][9,0][0-9]{2})_top\.csv/);
    if (match) {
      entry.pipe(
        fs.createWriteStream(
          path.join(
            __dirname,
            '..',
            'data-au',
            'sa',
            `${match[1]}_${match[3]}.csv`
          )
        )
      );
    } else {
      entry.autodrain();
    }
  });
// .pipe(unzip.Extract({ path: '../data-au/sa' }));
