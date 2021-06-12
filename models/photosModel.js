const { ObjectID } = require('mongodb')
const dbConnection = require('../adapter')

async function find ({id, favs = []}) {
  const db = await dbConnection()

  const photo = await db.collection('photos').findOne({_id: ObjectID(id)})
  return {
    ...photo,
    liked: favs.includes(id.toString())
  }
}

async function addLike ({ id }) {
  const db = await dbConnection()

  const photo = await db.collection('photos').findOne({_id: ObjectID(id)})
  if(!photo) throw new Error('Photo not found');
  return await db.collection('photos').updateOne({_id: id}, {likes: photo.likes+1})
}

async function removeLike ({ id }) {
  const db = await dbConnection()

  const photo = await db.collection('photos').findOne({_id: ObjectID(id)})
  if(!photo) throw new Error('Photo not found');
  return await db.collection('photos').updateOne({_id: ObjectID(id)}, {likes: photo.likes-1})
}

async function list ({categoryId, ids, favs = []}) {
  const db = await dbConnection()

  let photos
  if (categoryId && categoryId !== 'all') {
    photos = await db.collection('photos').find({categoryId}).toArray()
  } else if (ids) {
    ids = ids.map(id => ObjectID(id))
    photos = await db.collection('photos').find({_id: {$in: ids}}).toArray()
  } else {
    photos = await db.collection('photos').find().toArray()
  }

  return photos.map(photo => ({
    ...photo,
    liked: favs.includes(photo.id.toString())
  }))
}

module.exports = { find, addLike, removeLike, list }