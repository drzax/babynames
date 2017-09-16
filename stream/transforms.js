const through2 = require('through2');
const csvParse = require('csv-parse');
const namecase = require('namecase');

// A function to summarise the data as it flows through the stream.
var sum = writable => {
  const data = {
    count: { total: 0, female: 0, male: 0 },
    extent: [Infinity, 0],
    years: {},
    names: {}
  };

  const { count, extent, years, names } = data;

  // Do all the counts on the way through
  return through2
    .obj((row, enc, cb) => {
      // Count all the babies
      count.total += row.count;
      count[row.gender] += row.count;

      // Set the extent of years
      extent[0] = Math.min(data.extent[0], row.year);
      extent[1] = Math.max(data.extent[1], row.year);

      // Check this year has an entry in the data
      years[row.year] = years[row.year] || {
        count: { total: 0, female: 0, male: 0 }
      };

      // Count the babies in this year
      years[row.year].count.total += row.count;
      years[row.year].count[row.gender] += row.count;

      // Check this name has an entry in the data
      names[row.name] = names[row.name] || {
        count: { total: 0, female: 0, male: 0 },
        years: {}
      };

      // Count all the babies with this name
      names[row.name].count.total += row.count;
      names[row.name].count[row.gender] += row.count;

      // Check the data has an entry for the year for this name
      names[row.name].years[row.year] = names[row.name].years[row.year] || {
        count: { total: 0, female: 0, male: 0 }
      };

      // Count all the babies for this name in this year
      names[row.name].years[row.year].count.total += row.count;
      names[row.name].years[row.year].count[row.gender] += row.count;

      // Send it downstream.
      cb(null, row);
    })
    .on('end', () => {
      // Calculate prevalence after all the counting is done
      for (let name in names) {
        let nameData = names[name];

        // Total name prevalence
        nameData.prevalence = {
          total: nameData.count.total / count.total,
          female: nameData.count.female / count.female,
          male: nameData.count.male / count.male
        };

        // Per year name prevalence
        for (let year in nameData.years) {
          let yearData = nameData.years[year];

          yearData.prevalence = {
            total: yearData.count.total / years[year].count.total,
            female: yearData.count.female / years[year].count.female,
            male: yearData.count.male / years[year].count.male
          };
        }
      }

      if (writable) {
        writable.write(data);
      }
    });
};

const addLocation = location => {
  return through2.obj((obj, enc, cb) => {
    obj.location = location;
    cb(null, obj);
  });
};

const jsonStringify = () => {
  return through2.obj((obj, enc, cb) => {
    cb(null, JSON.stringify(obj, null, 2));
  });
};

const skip = count => {
  return through2.obj((obj, enc, cb) => {
    // Skip first <count> objects
    if (count-- > 0) {
      return cb();
    }
    // Send subsequent rows downstream.
    cb(null, obj);
  });
};

const saParseRow = () => {
  return through2.obj((row, enc, cb) => {
    let matches = row.file.path.match(/((fe)?male)_([0-9]{4})/);
    cb(null, {
      year: +matches[3],
      gender: matches[1].toLowerCase(),
      name: namecase(row.data[0]),
      count: +row.data[1]
    });
  });
};

const usaParseRow = () => {
  return through2.obj((row, enc, cb) => {
    let matches = row.file.path.match(/([0-9]{4})/);
    cb(null, {
      year: +matches[1],
      gender: row.data[1].toUpperCase() === 'F' ? 'female' : 'male',
      name: namecase(row.data[0]),
      count: +row.data[2]
    });
  });
};

const csvRows = rows => {
  return through2.obj(function(file, enc, cb) {
    file.contents
      .pipe(csvParse())
      .pipe(skip(rows))
      .on('data', data => {
        // Push each row back into the outer stream.
        // Also include reference to the file for additional data from there.
        this.push({ data, file });
      })
      .on('end', cb);
  });
};

module.exports = {
  csvRows,
  sum,
  saParseRow,
  usaParseRow,
  skip,
  addLocation,
  jsonStringify
};
