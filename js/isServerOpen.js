var express = require('express');
var app = express();
var fs = require('fs');
var url = require('url');
// home page 용
// var express = require('express');
// var router = express.Router();
// home page 용
var _http = require('http');
var http = _http.Server(app).listen(3030);
const bodyParser= require('body-parser');
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true, parameterLimit: 1000000}));

app.post("/Project/Bored_Friend", async (req, res){
  // --- below test ip -----
  var serverIP ="http://122.46.245.107:50001";
  var serverIP_Internal = "http://192.168.219.104:3000";

  // --- below real ip
  //var serverIP ="http://122.46.245.107:50003";
  //var serverIP_Internal = "http://192.168.219.123:3000";

  var object = new Object();
  object.response_type = "normal";
  object.response_server_ip = serverIP;
  object.response_server_ip_internal = serverIP_Internal;
  object.response_version = "beta 01.01.01";
  res.send(object);
});

console.log(" --------------- " + Date.now() + "----------------");
console.log("Searcher Server");
