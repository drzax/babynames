#!/usr/bin/env node
const start = Date.now();
const sqlite = require('sqlite');

const conn = sqlite.open('./output/us.sqlite').then(db => db.migrate());

const getName = async name => {
  const db = await conn;
  data = await db.all('SELECT * FROM years WHERE name=?', name);
  console.log('data', data);
};

const getRank = async () => {
  const db = await conn;
  data = await db.all('SELECT * FROM names ORDER BY total_prevalence DESC');
  console.log('data', data.map((d, i) => Object.assign(d, { rank: i + 1 })));
};

const getByMinimumPrevalence = async min => {
  const db = await conn;
  data = await db.all(
    'SELECT * FROM names WHERE  total_prevalence >= ? ORDER BY total_prevalence DESC',
    min
  );
  console.log('data', data.map((d, i) => Object.assign(d, { rank: i + 1 })));
};

const getUniqueNamesPerYear = async (uniqueness = 1) => {
  const db = await conn;
  data = await db.all(
    'SELECT year, COUNT(name) FROM years WHERE years.male + years.female <= ? GROUP BY year ORDER BY year DESC',
    uniqueness
  );
  console.log('data', data);
};

getUniqueNamesPerYear();

// getByMinimumPrevalence(0.001).then(() => console.log(Date.now() - start));
// getRank().then(() => console.log(Date.now() - start));
// getName('Simon').then(() => console.log(Date.now() - start));

//
// console.log(
//   entries(data.names.Simon.years)
//     .sort((a, b) => +b.key - +a.key)
//     .map(y => [y.key, y.value.prevalence.male])
// );

// Name rank
// console.log(
//   entries(data.names)
//     .sort((a, b) => b.value.prevalence.total - a.value.prevalence.total)
//     .map((v, i) => [i, v.key, v.value.count.total, v.value.prevalence.total])
// );
