(function(){
  var client = require('mongodb').MongoClient;
  var _db;

  module.exports = {
    connect: function(callback) {
      client.connect("mongodb://localhost:27017/twitter", function(err, db){
        _db = db;
        return callback(err);
      });
    },

    db: function() {
      return _db;
    },

    close: function() {
      _db.close();
    }
  };
})();