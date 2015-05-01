var express = require('express');
var router = express.Router();
var MongoClient = require('../mongo-client.js');
var TwitterClient = require('../twitter-client.js').TwitterClient();

router
.get('/map', function (req, res, next) {
  MongoClient.db().collection('tweets').find().toArray(function(err, data){
    if (err) throw err;

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
    res.render('tweetsMap', { title: '#universalorlando', tweets: data, tweetsDictionary: tweetsDictionary});
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
})

.get('/user/:handle', function(req, res, next){
  var params = {
    screen_name : req.params.handle,
    count: 10,
    contributor_details : true
  };
  TwitterClient.get('statuses/user_timeline', params, function(err, tweets){
    if (err){
      console.dir(err);
      return;
    }
    res.format({
      'text/html': function(){
        res.render('userTweets', {tweets : tweets});
      },

      'application/json': function(){
        res.json(tweets);
      }
    });
  });
})

.get('/telemundo', function(req, res, next){
  res.format({
    'text/html':function(){
      res.render('userTweets');
    }
  });
});

module.exports = router;
