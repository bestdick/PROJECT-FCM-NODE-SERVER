var express = require('express');
var app = express();
var fs = require('fs');
var url = require('url');

var _http = require('http');
var http = _http.Server(app).listen(3333);
const bodyParser= require('body-parser');
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true, parameterLimit: 1000000}));

var mysql_dbc = require('../database/db_con.js')();
var connection = mysql_dbc.init();
mysql_dbc.test_open(connection);

var test_module = require('../function/test_module.js')();

app.get("/", async (req, res)=>{
  // var pstmt = "SELECT * FROM member_additional_info";
  // var result = await asyncQuery(pstmt, []);
  // res.send('hello');

  test_module.qwe2();


});

function asyncQuery(sql, array){
	return new Promise(function(resolve, reject){
		connection.query(sql, array, function (err, result){
		if (err){
			return reject(err);
		}
		resolve(result);
		});
	});
}

console.log(" --------------- SERVER OPEN ------ " , Date.now());
// console.log(connection);
