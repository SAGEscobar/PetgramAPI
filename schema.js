const userModel = require('./models/userModel')
const categoriesModel = require('./models/categoriesModel')
const photosModel = require('./models/photosModel')
const { gql } = require('apollo-server-express')
const jsonwebtoken = require('jsonwebtoken')
const bcrypt = require('bcrypt')

const typeDefs = gql`
  type User {
    _id: ID
    id: Int
    avatar: String
    name: String
    email: String
    isPremium: Boolean
  }

  type Photo {
    _id: ID
    id: Int
    categoryId: Int
    src: String
    likes: Int
    liked: Boolean
    userId: ID
  }

  type Category {
    _id: ID
    id: Int
    cover: String
    name: String
    emoji: String
    path: String
  }

  type Query {
    favs: [Photo]
    categories: [Category]
    photos(categoryId: Int): [Photo],
    photo(id: ID!): Photo
  }

  input LikePhoto {
    id: ID!
  }

  input UserCredentials {
    email: String!
    password: String!
  }

  type Mutation {
    likeAnonymousPhoto (input: LikePhoto!): Photo
    likePhoto (input: LikePhoto!): Photo
    signup (input: UserCredentials!): String
    login (input: UserCredentials!): String
  }
`

async function checkIsUserLogged (context) {
  const {email, id} = context
  // check if the user is logged
  if (!id) throw new Error('you must be logged in to perform this action')
  // find the user and check if it exists
  const user = await userModel.find({email})
  // if user doesnt exist, throw an error
  if (!user) throw new Error('user does not exist')


  return user
}

async function tryGetFavsFromUserLogged (context) {
  try {
    const {email} = await checkIsUserLogged(context)
    const user = await userModel.find({email})
    return user.favs
  } catch(e) {
    return []
  }
}

const resolvers = {
  Mutation: {
    likeAnonymousPhoto: (_, {input}) => {
      // find the photo by id and throw an error if it doesn't exist
      const {id: photoId} = input
      const photo = photosModel.find({ id: photoId })
      if (!photo) {
        throw new Error(`Couldn't find photo with id ${photoId}`)
      }
      // put a like to the photo
      photosModel.addLike({ id: photoId })
      // get the updated photos model
      const actualPhoto = photosModel.find({ id: photoId })
      return actualPhoto
    },
    likePhoto: async (_, { input }, context) => {
      const { _id: userId } = await checkIsUserLogged(context)
      
      // find the photo by id and throw an error if it doesn't exist
      const {id: photoId} = input
      const photo = photosModel.find({ id: photoId })
      if (!photo) {
        throw new Error(`Couldn't find photo with id ${photoId}`)
      }

      const hasFav = await userModel.hasFav({ id: userId, photoId })
      if (hasFav) {
        await photosModel.removeLike({ id: photoId })
        await userModel.removeFav({ id: userId, photoId, })
      } else {
        // put a like to the photo and add the like to the user database
        await photosModel.addLike({ id: photoId })
        await userModel.addFav({ id: userId, photoId, })
      }

      // get favs from user before exiting
      const favs = await tryGetFavsFromUserLogged(context)
      // get the updated photos model
      const actualPhoto = await photosModel.find({ id: photoId, favs })

      return actualPhoto
    },
    // Handle user signup
    async signup (_, { input }) {
      // add 1 second of delay in order to see loading stuff
      await new Promise(resolve => setTimeout(resolve, 1000))

      const {email, password} = input

      const user = await userModel.find({ email })

      if (user) {
        throw new Error('User already exists')
      }

      const newUser = await userModel.create({
        email,
        password
      })


      // return json web token
      return jsonwebtoken.sign(
        { id: newUser.insertedId, email: email },
        process.env.JWT_SECRET,
        { expiresIn: '1y' }
      )
    },

    // Handles user login
    async login (_, { input }) {
      // add 1 second of delay in order to see loading stuff
      await new Promise(resolve => setTimeout(resolve, 1000))

      const { email, password } = input
      const user = await userModel.find({ email })

      if (!user) {
        throw new Error('No user with that email')
      }

      const valid = await bcrypt.compare(password, user.password)

      if (!valid) {
        throw new Error('Incorrect password')
      }

      // return json web token
      return jsonwebtoken.sign(
        { id: user._id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
      )
    }
  },
  Query: {
    async favs(_, __, context) {
      const {email} = await checkIsUserLogged(context)
      const {favs} = await userModel.find({email})
      return photosModel.list({ ids: favs, favs })
    },
    categories() {
      return categoriesModel.list()
    },
    async photo(_, {id}, context) {
      const favs = await tryGetFavsFromUserLogged(context)
      return photosModel.find({id, favs})
    },
    async photos(_, {categoryId}, context) {
      const favs = await tryGetFavsFromUserLogged(context)
      return photosModel.list({categoryId, favs})
    }
  }
}

module.exports = { typeDefs, resolvers }