var MongoClient = require('mongodb').MongoClient;
var _ = require('underscore');

MongoClient.connect('mongodb://localhost:27017/twitter', function(err, db){
  if (err) throw err;

  db = db;
  tweets = db.collection('tweets');
  var dic = {};
  tweets.find().toArray(function(err, data){
    if (err) throw err;

    for (tweet of data){
      if (!tweet.location) continue;
      if (!dic[tweet.location.coordinates]) {
        dic[tweet.location.coordinates] = [];
      }
      dic[tweet.location.coordinates].push(tweet);
    }
    console.dir(dic);
  });
});