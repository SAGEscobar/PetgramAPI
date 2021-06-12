const dbConnection = require('../adapter')

async function list () {
  const db = await dbConnection()
  return await db.collection('categories').find().toArray()
}

module.exports = { list }