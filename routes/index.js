var express = require('express');
var router = express.Router();

/* GET home page. */

// localhost:3000   /
router.get('/', function(req, res, next) {
  const obj = {id:'aaa', name:'홍길동'};
  res.send(obj);
  res.end();
});

// localhost:3000   /test1
router.get('/test1', function(req, res, next) {
  const obj = {id:'bbb', name:'홍길동', age:33};
  res.send(obj);
  res.end();
});

// localhost:3000   /test2
router.get('/test2', function(req, res, next) {
  const obj = {id:'ccc', name:'김길동', age:23};
  res.send(obj);
  res.end();
});

// localhost:3000   /test3
router.get('/test3', function(req, res, next) {
  const obj = {id:'ddd', name:'이길동', age:35};
  res.send(obj);
  res.end();
});

module.exports = router;
