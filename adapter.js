const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");
const Memory = require('lowdb/adapters/Memory')

//Obligando a sincronisar con el documento fisico
const json = require('./db.json')
const isLocal = true
//process.env.NOW_REGION
const type = new Memory

const db = low(type)
db.defaults(json).write()

module.exports = db
