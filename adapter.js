const { MongoClient } = require('mongodb')

const {
  DB_USER,
  DB_PASSWD,
  DB_HOST,
  DB_DDBB
} = process.env

const connectionUri = `mongodb+srv://${DB_USER}:${DB_PASSWD}@${DB_HOST}?retryWrites=true&writeConcern=majority`
const client = new MongoClient(connectionUri, {
  useNewUrlParse: true,
  useUnifiedTopology: true
})
let db = null

const dbConnection = async () => {

  if (db !== null){
    return db
  }
  try{
    await client.connect()
    db = await client.db(DB_DDBB)
  }catch( err ){
    throw new Error('Ha ocurrido un problema durante la conneccion')
  }
  return db
}

module.exports = dbConnection
