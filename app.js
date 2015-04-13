var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var request = require('request');
var querystring = require('querystring');
var _ = require('underscore');
var Twitter = require('twitter');
var MongoClient = require('mongodb').MongoClient;
var socket;
var db;
var tweets;

app.use(express.static('public'));
app.engine('ejs', require('ejs').renderFile);
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

app.get('/tweets/map', function (req, res, next) {
  tweets.find().toArray(function(err, data){
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
    res.render('tweets', { title: '#universalorlando', tweets: data, tweetsDictionary: tweetsDictionary});
  });
});

app.get('/tweets/locations', function(req, res, next){
  tweets.find({'location' : {'$exists' : true}}, {'location' : 1, '_id' : 0}).toArray(function(err, data){
    if (err) throw err;

    console.dir("Found " + data.length + " locations");

    res.json(data);
  });
})

app.get('/tweets/all', function(req, res, next){
  tweets.find().toArray(function(err, data){
    if (err) throw err;

    console.dir("Found " + data.length + " tweets");

    res.json(data);
  });
})

var TwitterClient = new Twitter({
  consumer_key: '4uXm95hZd5JA9V0FjpabdAhmI',
  consumer_secret: 'x4boo76XYO6Bt43cuUAHnNoHVxS5xdu9y3o84dBM5h1XXejFBq',
  access_token_key: '',
  access_token_secret: ''
});
var params = {screen_name: 'nodejs'};

var HOST = "http://maps.googleapis.com";
var PATH = "/maps/api/geocode/json?";
var HEADERS = {
  'Content-Type': 'application/json',
};

var getCoords = function(city, callback){
  if (!city){
    callback(null, null);
  }

  console.dir("Getting city " + city);

  var url = HOST + PATH + querystring.stringify({address: city});
  request({
    url: url,
    json: true
  }, function (err, res, body) {
    if (err){
      console.dir("Err " + err);
    }

    if (res.statusCode !== 200){
      console.dir(res.statusCode);
      throw new Error(res.statusCode);
    }
    var location = null;
    if (body.results && body.results.length > 0){
      location = body.results[0].geometry.location; 
      location = {
        type:'Point',
        coordinates: [location.lng, location.lat]
      }
    } 
    console.dir(location);
    callback(null, location);
  });
}

function fetchTweets(){
  TwitterClient.get('search/tweets', {q: '#universalorlando'}, function(err, data, response){
    if (err) {
      console.dir("No internet connection");
      console.dir(err);
      return;
    }

    data.statuses.forEach(function(tweet){
      tweets.findOne({'id' : tweet.id}, function(err, doc){
        if (err) throw err;

        if (doc){
          console.dir("Old tweet " + tweet.id);
          return;
        }

        getCoords(tweet.user.location, function(err, location){
          if (err) throw err;

          if (location) tweet.location = location;

          console.dir("inserting " + tweet.id + " with location " + tweet.location);

          tweets.update({'id':tweet.id}, tweet, {'upsert':true}, function(err, inserted){
            if (err) {
              console.dir(err);
              throw err;
            }

            console.dir("Inserted tweet " + tweet.id);
            // socket.emit('news', { hello: 'world' });
          });
        });
      });
    });
  });
}

MongoClient.connect('mongodb://localhost:27017/twitter', function(err, db){
  if (err) throw err;

  db = db;
  tweets = db.collection('tweets');

  server.listen(9000);
  io.on('connection',function(socket){
    socket = socket;
  });
  setInterval(fetchTweets, 300000);
});