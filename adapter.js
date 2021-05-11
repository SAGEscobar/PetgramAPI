const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");
const Memory = require('lowdb/adapters/Memory')
const path = require('path');

//Obligando a sincronisar con el documento fisico
const json = require('./db.json')
const isLocal = true
//process.env.NOW_REGION
const type = new FileSync('./db.json')

const db = low(type)
db.defaults(json).write()

module.exports = db
