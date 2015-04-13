var MongoClient = require('mongodb').MongoClient;

MongoClient.connect('mongodb://localhost:27017/twitter', function(err, db){
  if (err) throw err;

  db.collection('tweets').find().each(function(err, tweet){
    if (err) throw err;

    if (tweet.location){
      var geoJsonLocation = {
        type: 'Point',
        coordinates: [tweet.location.lng, tweet.location.lat]
      }

      db.collection('tweets').update({'id': tweet.id}, {'$set':{'location': geoJsonLocation}}, function(err, updated){
        if (err) throw err;

        console.dir(updated);
      });
    }
  })
});