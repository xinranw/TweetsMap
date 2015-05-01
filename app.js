var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var request = require('request');
var querystring = require('querystring');
var _ = require('underscore');
var tweetsRoutes = require('./routes/tweets.js');
var Twitter = require('twitter');
var TwitterClient = require('./twitter-client.js').TwitterClient();
var MongoClient = require('./mongo-client');
var socket, db, tweets;

app.use(express.static('public'));
app.engine('ejs', require('ejs').renderFile);
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use('/tweets', tweetsRoutes);

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
      };
    } 
    console.dir(location);
    callback(null, location);
  });
};

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
            // socket.emit('new', { tweet: tweet });
          });
        });
      });
    });
  });
}

MongoClient.connect(function(err){
  if (err) throw err;

  db = MongoClient.db();
  tweets = db.collection('tweets');

  server.listen(9000);
  io.on('connection',function(socketio){
    console.dir('connection made');
    socket = socketio;
  });
  // fetchTweets();
  setInterval(fetchTweets, 300000);
});
