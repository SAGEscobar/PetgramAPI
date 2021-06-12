const { ObjectID } = require('mongodb')
const dbConnection = require('../adapter')

async function find({ id, favs = [] }) {
  const db = await dbConnection()

  favs = favs.map(fav => fav.toString())
  
  const photo = await db.collection('photos').findOne({ _id: ObjectID(id) })

  return {
    ...photo,
    liked: favs.includes(id.toString())
  }
}

async function addLike({ id }) {
  const db = await dbConnection()

  const photo = await db.collection('photos').findOne({ _id: ObjectID(id) })
  const newLike = photo.likes + 1
  
  await db.collection('photos').updateOne({ _id: ObjectID(id) }, { $set: { likes: newLike } })
  return null
}

async function removeLike({ id }) {
  const db = await dbConnection()

  const photo = await db.collection('photos').findOne({ _id: ObjectID(id) })
  const newLike = photo.likes - 1
  
  await db.collection('photos').updateOne({ _id: ObjectID(id) }, { $set: { likes: newLike } })
  return null
}

async function list({ categoryId, ids, favs = [] }) {
  const db = await dbConnection()

  favs = favs.map(fav => fav.toString())

  let photos
  if (categoryId && categoryId !== 'all') {
    photos = await db.collection('photos').find({ categoryId }).toArray()
  } else if (ids) {
    ids = ids.map(id => ObjectID(id))
    photos = await db.collection('photos').find({ _id: { $in: ids } }).toArray()
  } else {
    photos = await db.collection('photos').find().toArray()
  }

  return photos.map(photo => ({
    ...photo,
    liked: favs.includes(photo._id.toString())
  }))
}

module.exports = { find, addLike, removeLike, list }