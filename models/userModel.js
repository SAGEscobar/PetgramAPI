const dbConnection = require('../adapter')
const crypto = require('crypto')
const uuidv1 = require('uuid/v1')
const bcrypt = require('bcrypt')
const { ObjectID } = require('mongodb')

async function addFav({ id, photoId }) {
  const db = await dbConnection()
  let user = await db.collection('users').findOne({ _id: ObjectID(id) })
  let photo = await db.collection('photos').findOne({ _id: ObjectID(id) })

  if (!user || !photo) {
    throw new Error('The user or photo does not exist')
  }
  await db.updateOne({ _id: ObjectID(id) }, { $addToSet: { favs: ObjectID(photoId) } })
}

async function removeFav({ id, photoId }) {
  const db = await dbConnection()
  const user = await db.collection('users').findOne({ _id: ObjectID(id) })
  const photo = await db.collection('photos').findOne({ _id: ObjectID(photoId) })

  if (!user || !photo) {
    throw new Error('The user or photo does not exist')
  }

  await db.updateOne({ _id: ObjectID(id) }, { $pull: { favs: ObjectID(photoId) } })
}

async function hasFav({ id, photoId }) {
  const db = await dbConnection()
  const user = await db.collection('users').find({ _id: ObjectID(id) })
  const hasFav = user.favs.includes(photoId)
  return hasFav
}

async function create({ email, password }) {
  const db = await dbConnection()

  const avatarHash = crypto.createHash('md5').update(email).digest("hex")
  const avatar = `https://gravatar.com/avatar/${avatarHash}`

  let user
  // Create a user
  const newUser = {
    password: await bcrypt.hash(password, 10), // with the encrypted password
    favs: [],
    avatar,
    email
  }

  // Write in db.json
  user = await db.collection('users')
    .insertOne(newUser)

  if(!user) throw new Error("User can't be created")

  return user;
}

async function find({ email }) {
  const db = await dbConnection()
  return await db.collection('users')
    .findOne({ email: email })
}

module.exports = { create, addFav, hasFav, removeFav, find }