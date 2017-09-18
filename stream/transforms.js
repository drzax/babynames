const through2 = require('through2');
const csvParse = require('csv-parse');
const namecase = require('namecase');
const sqlite = require('sqlite');

// A function to summarise the data as it flows through the stream.
var aggregate = location => {
  const data = {
    count: { total: 0, female: 0, male: 0 },
    years: {},
    names: {}
  };

  const { count, years, names } = data;

  // Do all the counts on the way through
  return through2
    .obj((row, enc, cb) => {
      // Count all the babies
      count[row.gender] += row.count;

      // Check this year has an entry in the data
      years[row.year] = years[row.year] || {
        count: { female: 0, male: 0 }
      };

      // Count the babies in this year
      years[row.year].count[row.gender] += row.count;

      // Check this name has an entry in the data
      names[row.name] = names[row.name] || {
        count: { female: 0, male: 0 },
        years: {}
      };

      // Count all the babies with this name
      names[row.name].count[row.gender] += row.count;

      // Check the data has an entry for the year for this name
      names[row.name].years[row.year] = names[row.name].years[row.year] || {
        count: { female: 0, male: 0 }
      };

      // Count all the babies for this name in this year
      names[row.name].years[row.year].count[row.gender] += row.count;

      // Send it downstream.
      cb(null, row);
    })
    .on('end', () => {
      if (location) {
        store(data, location).then(() => console.log('done'));
      }
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

const store = async (data, location) => {
  const { count, years, names } = data;
  const conn = sqlite
    .open(location)
    .then(db => db.migrate())
    .then(db => db.driver);
  const db = await conn;

  // Calculate prevalence after all the counting is done

  Object.keys(names).forEach(name => {
    let nameData = names[name];

    // Total name prevalence
    nameData.prevalence = {
      total:
        (nameData.count.female + nameData.count.male) /
        (count.female + count.male),
      female: nameData.count.female / count.female,
      male: nameData.count.male / count.male
    };
    db.serialize(() => {
      db.run('BEGIN');

      let namesStatement = db.prepare(
        'INSERT OR REPLACE INTO names VALUES (?, ?, ?, ?, ?, ?)'
      );

      namesStatement.run([
        name,
        nameData.count.female,
        nameData.count.male,
        nameData.prevalence.female,
        nameData.prevalence.male,
        nameData.prevalence.total
      ]);

      namesStatement.finalize();

      db.run('COMMIT');

      db.run('BEGIN');

      let yearsStatement = db.prepare(
        'INSERT OR REPLACE INTO years VALUES (?, ?, ?, ?, ?, ?, ?)'
      );

      Object.keys(years).forEach(year => {
        let yearData = nameData.years[year] || {
          count: { female: 0, male: 0 }
        };

        yearData.prevalence = {
          total:
            (yearData.count.female + yearData.count.male) /
            (years[year].count.female + years[year].count.male),
          female: yearData.count.female / years[year].count.female,
          male: yearData.count.male / years[year].count.male
        };

        yearsStatement.run([
          year,
          name,
          yearData.count.female,
          yearData.count.male,
          yearData.prevalence.female,
          yearData.prevalence.male,
          yearData.prevalence.total
        ]);
      });
      yearsStatement.finalize();
      db.run('COMMIT');
    });
  });
  return;
};

module.exports = {
  csvRows,
  aggregate,
  saParseRow,
  usaParseRow,
  skip,
  jsonStringify
};
