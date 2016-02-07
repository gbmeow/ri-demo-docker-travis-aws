var express = require('express');
var serveStatic = require('serve-static');
var ObjectId = require('mongodb').ObjectID;

var app = express();

// Serve up content from public directory
app.use(serveStatic(__dirname + '/app'));

//DB stuff 

var MongoClient = require('mongodb').MongoClient;

var url = 'db' || 'localhost'
var port = process.env.DB_1_PORT_27017_TCP_PORT || '27017';

// Constants
var DEFAULT_PORT = 8080;
var PORT = process.env.PORT || DEFAULT_PORT;

app.get('/api/instructors', function (req, res) {
  MongoClient.connect('mongodb://' + url + ':' + port + '/school', function(err, db) {
  if (err) {
    throw err;
  }
  db.collection('instructors').find().toArray(function(err, result) {
    if (err) {
      throw err;
    }
    res.send(result, url, port);
  });
}); 
});

app.post('/api/instructors/:userid', function(req, res) {
   var userId = req.params.userid;
   MongoClient.connect('mongodb://' + url + ':' + port + '/school', function(err, db) {
        if (err) {
            throw err;
        }
    var collection = db.collection('instructors');
    
    collection.updateOne(
        {"_id": ObjectId(userId)},
        { $inc: { numberOfLikes: 1}}, function(err, result) {
            
      collection.find().toArray(function(err, result) {
            if (err) {
            throw err;
            }
            res.send(result);
            });
        });
    });
});

var server = app.listen(PORT, function() {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});