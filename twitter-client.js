var Twitter = require('twitter');
var twitterAuth = require('./twitter-auth.json');
var client;

var createTwitterClient = function(){
  client = new Twitter({
    consumer_key: twitterAuth.consumer_key,
    consumer_secret: twitterAuth.consumer_secret,
    access_token_key: '',
    access_token_secret: ''
  });
};


module.exports = {
  TwitterClient : function(){
    if (!client){
      createTwitterClient();
    }
    return client;
  }
};
