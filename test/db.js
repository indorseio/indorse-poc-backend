var MongoClient = require('mongodb').MongoClient
  , async = require('async')
  , config = require('config')

var state = {
  db: null
}

exports.connect = (done) => {
  if (state.db) return done()

  var uri = config.get('poc_mongo')

  MongoClient.connect(uri, (err, db) => {
    if (err) return done(err)
    state.db = db
    done()
  })
}

exports.getDB = () => {
  return state.db
}

exports.drop = (done) => {
  if (!state.db) return done()
  // This is faster then dropping the database
  state.db.collections((err, collections) => {
    async.each(collections, (collection, cb) => {
      if (collection.collectionName.indexOf('system') === 0) {
        return cb()
      }
      collection.remove(cb)
    }, done)
  })
}