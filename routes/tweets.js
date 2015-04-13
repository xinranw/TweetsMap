var express = require('express');
var router = express.Router();
var MongoClient = require('../mongo-client.js');

router
.get('/map', function (req, res, next) {
  MongoClient.db().collection('tweets').find().toArray(function(err, data){
    if (err) throw err

    console.dir("Found " + data.length + " tweets");
    var tweetsDictionary = {};
    data.forEach(function(tweet){
      if (tweet.location){
        if (!tweetsDictionary[tweet.location.coordinates]) {
          tweetsDictionary[tweet.location.coordinates] = [];
        }
        tweetsDictionary[tweet.location.coordinates].push(tweet);
      }
    });
    res.render('tweets', { title: '#universalorlando', tweets: data, tweetsDictionary: tweetsDictionary});
  });
})

.get('/locations', function(req, res, next){
  MongoClient.db().collection('tweets').find({'location' : {'$exists' : true}}, {'location' : 1, '_id' : 0}).toArray(function(err, data){
    if (err) throw err;

    console.dir("Found " + data.length + " locations");

    res.json(data);
  });
})

.get('/all', function(req, res, next){
  MongoClient.db().collection('tweets').find().toArray(function(err, data){
    if (err) throw err;

    console.dir("Found " + data.length + " tweets");

    res.json(data);
  });
});

module.exports = router;
