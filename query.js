#!/usr/bin/env node
const start = Date.now();
const data = require('./output/au-sa.json');
const { entries } = require('./lib/helper');

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

console.log(Date.now() - start);
