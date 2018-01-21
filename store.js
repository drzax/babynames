#!/usr/bin/env node

const sqlite = require('sqlite');
const db = sqlite
  .open('./data.sqlite')
  .then(db => db.migrate({ force: 'last' }));

test = async () => {
  const db1 = await db;
  console.log('db', db1);
};

test();
