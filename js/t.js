var express = require('express');
var app = express();
var fs = require('fs');
var url = require('url');
// home page 용
// var express = require('express');
// var router = express.Router();
// home page 용
var _http = require('http');
var http = _http.Server(app).listen(3000);
const bodyParser= require('body-parser');
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true, parameterLimit: 1000000}));

var FCM = require('fcm-node');//fcm module
var serverKey = 'AAAA6rfi34s:APA91bF66oVcBbk1vyDk8uooTmjB8EIkSGNRCHMa1trleQm7cB_uOfv45bl4DhudLYCm3VgchjF1sVe1CYjFY9dr-oqtLRKQpRd5VmGpsF5Newz87HedNBLib6IzZIlt_eEEjQIHJTRu'; //put your server key here
var fcm = new FCM(serverKey);
var targetMessage = require('../message_template/message.js');

var mysql_dbc = require('../database/db_con.js')();
var connection = mysql_dbc.init();
mysql_dbc.test_open(connection);



var CheckAdditionalExist = require('../function/CheckAdditionalExist.js');
// var EliminationTarget = require('../function/EliminateTargetUserFromNoticeArray.js');
const uuidv4 = require('uuid/v4');
var dateFormat = require('dateformat');

var OnLineArray = new Array();
setInterval(function(){
  console.log("online total : ", OnLineArray.length);
}, 5000);













var NoticeObject = new Object();
NoticeObject.type = "announcement";
NoticeObject.content = "욕설 및 성적 발언은 제제의 원이 될수 있습니다";
var NoticeArray = [NoticeObject];
//아래의 set interval function 은  notice announcement 를 처리하는 인터벌이다.
setInterval(function(){
  for(var i = 0 ; i < NoticeArray.length; i ++){
    var type = NoticeArray[i].type;
    if(type != "announcement"){
      var time = NoticeArray[i].time;
      var timeNow = Date.now();
        if(time+(3600*1000) < timeNow){
          NoticeArray.splice(i, 1);
        }
    }
  }
  // console.log("전광판 갯수" + NoticeArray.length);
}, 5000);

// ERASE DELETED MESSAGE FROM DATABASE
//    message_status 에서 정보를 가져와
//      10분 마다 100개씩 가져와
//      정보 비교 후
//      sender 와 receiver 가 모두 삭제한 상태라면
//      random_message 에서 해당 token 내용을 모두 삭제한다.
//      그후 message_status 의 정보를 삭제한다.
setInterval(async function(){
  //message_status 에서 10분 마다 최대 100개의 정보를 가져온다
  var firstArr = [];
  var _g_pstmt = "SELECT * FROM message_status ORDER BY id limit 100";
  var _g_result = await asyncQuery(_g_pstmt, []);
  if(_g_result.length == 0){
    console.log("------  'MESSAGE_STATUS' TABLE CLEAN :: TRUE -------");
  }else{
    for(var i = 0 ; i < _g_result.length-1; i++){
      for(var j = i+1 ; j < _g_result.length; j++){
        var basic = _g_result[i].token;
        var target = _g_result[j].token;
        if(basic == target){

          var __g_pstmt = "DELETE FROM random_message WHERE r_token = ? ";
          var __sqlArray = [basic];
          var __g_result = await asyncQuery(__g_pstmt, __sqlArray);
          if(__g_result){
              console.log("RESULT ::", "true");
              var ___g_pstmt = "DELETE FROM message_status WHERE token = ? ";
              var ___sqlArray = [basic];
              var ___g_result = await asyncQuery(___g_pstmt, ___sqlArray);
              if(___g_result){
                console.log("RESULT ::", "delete complete");
              }
          }else{
              console.log("RESULT ::", "false" );
          }

        }
      }
    }
  }

  //삭제된후 3일이 지난 메시지 삭제
  var timeNow = Date.now();
  var timeLimit = 3*24*60*60*1000;
  // var timeLimit = 60*1000;
  var _3days = timeNow - timeLimit;
  var _g_pstmt = "SELECT * FROM message_status ORDER BY id limit 100";
  var _g_result = await asyncQuery(_g_pstmt, []);
  for(var i = 0 ; i < _g_result.length; i++){
    var token = _g_result[i].token;
    var __g_pstmt = "SELECT r_date FROM random_message WHERE r_token = ? ORDER BY r_id LIMIT 1";
    var __g_sqlArray = [token];
    var __g_result = await asyncQuery(__g_pstmt, __g_sqlArray);
    var latest_time = __g_result[0].r_date;
    if(_3days > latest_time){
      console.log("삭제.....");
      var ___g_pstmt = "DELETE FROM random_message WHERE r_token = ? ";
      var ___g_sqlArray = [token];
      connection.query(___g_pstmt, ___g_sqlArray, async function(err, result){
        if(err){
          console.log("삭제 실패 1");
        }else{
          console.log("삭제 성공 1");
          var ____g_pstmt = "DELETE FROM message_status WHERE token = ? ";
          var ____g_sqlArray = [token];
          connection.query(____g_pstmt, ____g_sqlArray, async function(err, result){
            if(err){
              console.log("삭제 실패 2")
            }else{
              console.log("삭제 성공 2");
            }
          });
        }
      });
    }
  }
}, 600000);




//basic server connection direction
app.post('/init', async (req, res)=>{
  res.send("success");
});
//gps 업데이트
app.post('/gps', async (req, res)=>{
  var object = new Object();
  var request_type = req.body.request_type;
  object.response_type = request_type;
  switch (request_type) {
    case "update":
    var request_data = req.body.request_data;
    var json = JSON.parse(request_data);
    var device_id = json.deviceID;
    var device_token = json.deviceToken;
    var lat = json.lat;
    var lng = json.lng;

    var pstmt = "UPDATE member_additional_info SET m_gps_la = ? , m_gps_lo = ? WHERE m_f_id = ? ";
    var sqlArray = [lat, lng, device_id];
    connection.query(pstmt, sqlArray, function(err, result){
      if(err){
        console.log("err", err);
        res.send("fail")
      }else{
        console.log("location", lat +" // "+ lng);
        res.send("success");
      }
    });

      break;
    case "get":
    var request_data = req.body.request_data;
    var json = JSON.parse(request_data);
    var device_id = json.deviceID;
    var device_token = json.deviceToken;

    var pstmt = "SELECT f.F_Token, f.F_date, m.m_location, m.m_age, m.m_gender, m.m_gps_la, m.m_gps_lo, m.m_point FROM firebasedevicetokenid f , member_additional_info m "+
    "WHERE m.m_f_id = ? AND f.F_id = ? GROUP BY f.F_id";
    var sqlArray = [device_id, device_id];
    var result = await asyncQuery(pstmt, sqlArray);

    console.log("result 1 :: ", result);
    var thisLong = result[0].m_gps_lo;
    var thisLat = result[0].m_gps_la;
    console.log("lng / lat :: ", thisLong + "/ " +thisLat);

    var _pstmt = "SELECT DISTINCT "+
    "m.m_f_id, f.F_Token, m.m_location, m.m_age, m.m_gender, f.F_date, ("+
      "6371 * acos ("+ // 6371 kilo ///   3959 mile
        "cos ( radians(?) )"+
        "* cos( radians( m.m_gps_la ) )"+
        "* cos( radians( m.m_gps_lo ) - radians(?) )"+
        "+ sin ( radians(?) )"+
        "* sin( radians( m.m_gps_la ) )"+
        ")"+
      ") AS distance "+
    "FROM member_additional_info m, firebasedevicetokenid f "+
    "WHERE m.m_f_id = f.F_id AND m.m_f_id <> ? AND f.F_status = ? "+
    "HAVING distance < 300 "+
    "ORDER BY distance "+
    "LIMIT 0 , 20";

    var _sqlArray = [thisLat, thisLong, thisLat, device_id, 1];
    var _result = await asyncQuery(_pstmt, _sqlArray);
    // console.log(_result);
    res.send(_result);

      break;
    default:

  }
});
app.get('/test', async (req,res)=>{
  var device_id = "eSOv9NANXq8";

  var pstmt = "SELECT f.F_Token, f.F_date, m.m_location, m.m_age, m.m_gender, m.m_gps_la, m.m_gps_lo, m.m_point FROM firebasedevicetokenid f , member_additional_info m "+
  "WHERE m.m_f_id = ? AND f.F_id = ? GROUP BY f.F_id";
  var sqlArray = [device_id, device_id];
  var result = await asyncQuery(pstmt, sqlArray);

  console.log("result 1 :: ", result);
  var thisLong = result[0].m_gps_lo;
  var thisLat = result[0].m_gps_la;
  console.log("lng / lat :: ", thisLong + "/ " +thisLat);
  // var _pstmt = "SELECT "+
  // "m_f_id, ("+
  //   "6371 * acos ("+ // 6371 kilo ///   3959 mile
  //     "cos ( radians(?) )"+
  //     "* cos( radians( m_gps_la ) )"+
  //     "* cos( radians( m_gps_lo ) - radians(?) )"+
  //     "+ sin ( radians(?) )"+
  //     "* sin( radians( m_gps_la ) )"+
  //     ")"+
  //   ") AS distance "+
  // "FROM member_additional_info "+
  // "HAVING distance < 300 "+
  // "WHERE m_f_id <> ? AND "
  // "ORDER BY distance "+
  // "LIMIT 0 , 20";
  var _pstmt = "SELECT DISTINCT "+
  "m.m_f_id, ("+
    "6371 * acos ("+ // 6371 kilo ///   3959 mile
      "cos ( radians(?) )"+
      "* cos( radians( m.m_gps_la ) )"+
      "* cos( radians( m.m_gps_lo ) - radians(?) )"+
      "+ sin ( radians(?) )"+
      "* sin( radians( m.m_gps_la ) )"+
      ")"+
    ") AS distance "+
  "FROM member_additional_info m, firebasedevicetokenid f "+
  "WHERE m.m_f_id = f.F_id AND m.m_f_id <> ? AND f.F_status = ? "+
  "HAVING distance < 300 "+
  "ORDER BY distance "+
  "LIMIT 0 , 20";

  var _sqlArray = [thisLat, thisLong, thisLat, device_id, 1];
  var _result = await asyncQuery(_pstmt, _sqlArray);
  console.log(_result);
  res.send(_result);

});
// 아래는 가입시 추가적인 정보 업로드하는 것
app.post('/register/upload', async (req, res)=>{

  var request_type =req.body.request_type;
  switch (request_type){
    case "additionals_register_upload":
      console.log("---- some one registered -----");
        var request_data = req.body.request_data;
        var json = JSON.parse(request_data);
        var device_id = json.deviceID;
        var age = json.age;
        var location = json.location;
        var gender = json.gender;
        var stmt = "INSERT INTO member_additional_info (m_f_id, m_location, m_age, m_gender, m_point, m_register_date) VALUES (?, ?, ?, ?, 12, ?)";
          connection.query(stmt, [device_id, location,  parseInt(age), gender, Date.now()], function(err, result){
            if(err){
              console.log(err);
              var response = new Object();
              response.request_type = request_type;
              response.result = err;
              var json = JSON.stringify(response);
              res.send(json);
            }else{
              var response = new Object();
              response.request_type = request_type;
              response.result = "success";
              var json = JSON.stringify(response);
              res.send(json);
            }
          });
      break;
    case "additionals_register_update":
    var request_data = req.body.request_data;
    var json = JSON.parse(request_data);
    var device_id = json.deviceID;
    var age = json.age;
    var location = json.location;
    var gender = json.gender;
    var stmt = "UPDATE member_additional_info SET m_location = ? , m_age = ? , m_gender = ? WHERE m_f_id = ?";
    var sqlArray= [location,  parseInt(age), gender, device_id];
      connection.query(stmt, sqlArray, function(err, result){
        if(err){
          console.log(err);
          var response = new Object();
          response.request_type = request_type;
          response.result = err;
          var json = JSON.stringify(response);
          res.send(json);
        }else{
          var response = new Object();
          response.request_type = request_type;
          response.result = "success";
          var json = JSON.stringify(response);
          res.send(json);
        }
      });
      break;
    default:
      res.send("fail");
  }


});
//아래는 fcm token 을 업로드 하는 것이다.
app.post('/fcm/upload', async (req, res)=>{
  console.log("---- some one connected -----");
  var request_type =req.body.request_type;
  var response = new Object();
  response.request_type = request_type;
  switch (request_type) {
    case "fcm_token_upload":
    console.log("---- some one connected :: fcm_token_upload -----");
      var data = req.body.request_data;
      var json = JSON.parse(data);
      var device_id = json.deviceID;
      var device_token = json.deviceToken;
      var stmt = "INSERT INTO firebasedevicetokenid (F_id, F_Token, F_date, F_status) VALUES (?,?, ?, ?)";
      connection.query(stmt, [device_id, device_token, Date.now(), 1], function(err, result){
        if(err){
          console.log("err :", err);
          response.result = "fail";
          var json = JSON.stringify(response);
          console.log("json stringify:: ", json);
          res.send(json);
        }else{
          console.log("success : ", result);
          response.result = "success";
          var json = JSON.stringify(response);
          console.log("json stringify :: ", json);
          res.send(json);
        }
      });
      break;
    case "fcm_token_update":
    var data = req.body.request_data;
    var json = JSON.parse(data);
    var device_id = json.deviceID;
    var device_token = json.deviceToken;
    var stmt = "UPDATE firebasedevicetokenid SET F_Token = ? AND F_date = ? AND F_status = ? WHERE F_id =?";
    connection.query(stmt, [device_token, Date.now(), 1, device_id], async function(err, result){
      if(err){
        console.log("err :", err);
        response.result = "fail";
        var json = JSON.stringify(response);
        console.log("json stringify:: ", json);
        res.send(json);
      }else{
        var sql = "SELECT * FROM member_additional_info WHERE m_f_id =?";
        var array = [device_id];
        var result =  await asyncQuery(sql, array);
        console.log("result :: ", result);
        if(result.length == 0 ){
          console.log("not_registered");
          response.result = "not_registered";
          var json = JSON.stringify(response);
          res.send(json);
        }else{
          console.log("success");
          response.result = "success";
          var json = JSON.stringify(response);
          res.send(json);
        }
      }
    });
      break;
    case "fcm_update_date":
    var data = req.body.request_data;
    var json = JSON.parse(data);
    var device_id = json.deviceID;
    var device_token = json.deviceToken;
    var stmt = "UPDATE firebasedevicetokenid SET F_date = ? WHERE F_id =?";
    connection.query(stmt, [Date.now(), device_id], async function(err, result){
      if(err){
        console.log("err :", err);
        response.result = "fail";
        var json = JSON.stringify(response);
        console.log("json stringify:: ", json);
        res.send(json);
      }else{
            var sql = "SELECT * FROM member_additional_info WHERE m_f_id =?";
            var array = [device_id];
          	var result =  await asyncQuery(sql, array);
            console.log("result :: ", result);
            if(result.length == 0 ){
              console.log("not_registered");
              response.result = "not_registered";
              var json = JSON.stringify(response);
              res.send(json);
            }else{
              console.log("success");
              response.result = "success";
              var json = JSON.stringify(response);
              res.send(json);
            }
      }
      });
      break;
      default:
  }


});
//아래는 random 한 메시지를 랜덤한 사람에게 보내는 방식
app.post('/message/send', async (req, res)=>{
  var request_type = req.body.request_type;

  switch (request_type) {
    case "send_random":
      var resultObject = new Object();
      resultObject.response_type = request_type;
      var request_data = req.body.request_data;
      var json = JSON.parse(request_data);
      var device_id = json.deviceID;
      var age_type = json.age_type;
      var location_type = json.location_type;
      var gender_type = json.gender_type;
      var message_content = json.message;
      var _point = 0;
      if(location_type == 1){
        _point--;
        if(age_type == 1){
          _point--;
        }
      }

      var sql = "SELECT f.F_Token, f.F_date, m.m_location, m.m_age, m.m_gender, m.m_point FROM firebasedevicetokenid f , member_additional_info m WHERE m.m_f_id = ? AND f.F_id = ? GROUP BY f.F_id";
      var array = [device_id, device_id];
      var result = await asyncQuery(sql, array);
      var u_token =  result[0].F_Token;
      var u_last_conn_date =  result[0].F_date;
      var u_location =  result[0].m_location;
      var u_age =  result[0].m_age;
      var u_gender =  (result[0].m_gender == "m") ? "f" : "m";
      var u_point = result[0].m_point;
      var searchResult = search(age_type, location_type, gender_type, u_age, u_location, u_gender, device_id);
      var result = await asyncQuery(searchResult[0], searchResult[1]);
      console.log(" ---------- SEARCH RESULT :: -----------");
      console.log("Count Result : ", result.length);

      if(result.length == 0 ){
        //찾는 상대방이 없을때 .....
        var _searchSQL = "SELECT f.F_id, f.F_Token FROM member_additional_info m, firebasedevicetokenid f "+
        " WHERE f.F_id = m.m_f_id AND  m.m_gender = ? AND CAST(f.F_date as UNSIGNED) >= ? AND f.F_id <> ? "+
        "AND f.F_status =1 AND m.m_f_id <> ?";
        var _searchSQLArray = [u_gender,  (Date.now()-604800000), device_id, device_id];
        var _result = await asyncQuery(_searchSQL, _searchSQLArray);

        var randomNumber = getRandomIntInclusive(0, (_result.length-1));
        var selected =  _result[randomNumber];
        var selected_id =  selected.F_id;
        var selected_token =  selected.F_Token;

        var messageToken = device_id+"-"+selected_id+"-"+uuidv4();
        message = new targetMessage(selected_token, "두근 두근 랜덤채팅", message_content, "initial", messageToken);

        fcm.send(message.targetMessage(), async function(err, response){
            if (err) {
                console.log("보낼 대상자의 아이디 " , selected_id);
                console.log("Something has gone wrong! ::", err);

                // 해당 토큰의 사용자의 status 상태를 -1 로 바꾸어 다시는 찾지 않게 한다?
                var pstmt = "UPDATE firebasedevicetokenid SET F_status = -1 WHERE F_Token = ? ";
                var sqlArray = [selected_token];
                var result = await asyncQuery(pstmt, sqlArray);
                console.log(result);
                resultObject.response_data = "fail";
                res.send(resultObject);

            } else {
                console.log("Successfully sent with response: ", response);

                var stmt = "INSERT INTO random_message (r_token, r_sender_id, r_receiver_id, r_message, r_instant_sender, r_receiver_read, r_date) VALUES (?, ?, ?, ?, ?, ?, ? )";
                connection.query(stmt, [messageToken, device_id, selected_id, message_content, device_id, -1, Date.now()],  async function(err, result){
                  if(err){
                    console.log("upload_fail::", err);
                    resultObject.response_data = "fail";
                    res.send(resultObject);
                  }else{
                    console.log("random message insert upload_success");

                    var _pstmt = "UPDATE member_additional_info SET m_point = m_point+? WHERE m_f_id= ?";
                    var _sqlArray = [_point, device_id];
                    connection.query(_pstmt, _sqlArray, async function(err, result){
                      if(err){
                        resultObject.response_data = "fail";
                        res.send(resultObject);
                      }else{
                        resultObject.response_data = "success_random";
                        res.send(resultObject);
                      }
                    });
                  }
                });
            }
        });
        // resultObject.response_data = "fail";
        // res.send(resultObject);
      }else{
        //찾는 상대방이 1이상일때
        var randomNumber = getRandomIntInclusive(0, (result.length-1));
        console.log("Selected Random Number : ", randomNumber);

        var selected =  result[randomNumber];
        var selected_id =  selected.F_id;
        var selected_token =  selected.F_Token;

        console.log(" RAW DATA ---- ::: ----- BELOW ----- ");
        console.log(result);
        console.log("----- REMAINING :: ", (u_point+_point));
        if((u_point+_point) < 0){
          resultObject.response_data = "not_enough_point";
          res.send(resultObject);
        }else{
          var messageToken = device_id+"-"+selected_id+"-"+uuidv4();
          message = new targetMessage(selected_token, "두근 두근 랜덤채팅", message_content, "initial", messageToken);
          fcm.send(message.targetMessage(), async function(err, response){
              if (err) {
                  console.log("보낼 대상자의 아이디 " , selected_id);
                  console.log("Something has gone wrong! ::", err);

                  // 해당 토큰의 사용자의 status 상태를 -1 로 바꾸어 다시는 찾지 않게 한다?
                  var pstmt = "UPDATE firebasedevicetokenid SET F_status = -1 WHERE F_Token = ? ";
                  var sqlArray = [selected_token];
                  var result = await asyncQuery(pstmt, sqlArray);
                  console.log(result);
                  resultObject.response_data = "fail";
                  res.send(resultObject);

              } else {
                  console.log("Successfully sent with response: ", response);

                  var stmt = "INSERT INTO random_message (r_token, r_sender_id, r_receiver_id, r_message, r_instant_sender, r_receiver_read, r_date) VALUES (?, ?, ?, ?, ?, ?, ? )";
                  connection.query(stmt, [messageToken, device_id, selected_id, message_content, device_id, -1, Date.now()],  async function(err, result){
                    if(err){
                      console.log("upload_fail::", err);
                      resultObject.response_data = "fail";
                      res.send(resultObject);
                    }else{
                      console.log("random message insert upload_success");

                      var _pstmt = "UPDATE member_additional_info SET m_point = m_point+? WHERE m_f_id= ?";
                      var _sqlArray = [_point, device_id];
                      connection.query(_pstmt, _sqlArray, async function(err, result){
                        if(err){
                          resultObject.response_data = "fail";
                          res.send(resultObject);
                        }else{
                          resultObject.response_data = "success";
                          res.send(resultObject);
                        }
                      });
                    }
                  });
              }
          });
        }
      }
      break;
    case "send_particular":
      var resultObject = new Object();
      resultObject.result_type = request_type;
      var request_data = req.body.request_data;
      var json = JSON.parse(request_data);

      var device_id = json.deviceID; // sender
      var messageToken = json.messageToken;//global token
      var r_sender_id = messageToken.split("-")[0];
      var r_receiver_id = messageToken.split("-")[1];
      var toSenderID = json.toSenderID; // receiver
      var toSenderToken = json.toSenderToken; // receiver
      var message = json.message;
      var time = Date.now();

      var pstmt = "INSERT INTO random_message (r_token, r_sender_id, r_receiver_id, r_message, r_instant_sender, r_receiver_read,  r_date) VALUES (?, ?, ?, ?, ?, ?, ? )";
      var sqlArray = [messageToken, r_sender_id, r_receiver_id, message, device_id, -1, time];
      // var result = await asyncQuery(pstmt, sqlArray);

      message = new targetMessage(toSenderToken, "두근두근 랜덤채팅", message, "continuous", messageToken);
      fcm.send(message.targetMessage(), function(err, response){
          if (err) {
              console.log("Something has gone wrong! ::", err);
          } else {
              console.log("Successfully sent with response: ", response);
              connection.query(pstmt, sqlArray, function (err, result){
                if (err){
                  console.log("Add fail");
                  resultObject.result_data = "message_send_fail";
                  res.send(resultObject);
                }else{
                  console.log("Database Add Success");
                  resultObject.result_data = "message_send_success";
                  res.send(resultObject);
                }
              });
          }
      });
      break;
      case  "send_shouted_target":
        var resultObject = new Object();
        resultObject.response_type = request_type;
        var request_data = req.body.request_data;
        var json = JSON.parse(request_data);
        var device_id = json.deviceID;
        var device_token = json.deviceToken;
        var sender_id = json.senderID;
        var sender_token = json.sender_token;
        var content = json.content;
        var time = json.time;

        var pstmt = "SELECT m_point FROM member_additional_info WHERE m_f_id = ? ";
        var sqlArray = [device_id];
        var result = await asyncQuery(pstmt, sqlArray);
        var remain_point = (result[0].m_point - 3);
        if(remain_point < 0 ){
          // 포인트가 부족
          resultObject.response_data = "not_enough_point";
          console.log("---NOT ENOUGH POINT ", "not_enough_point");
          res.send(resultObject);
        }else{
          // 포인트가 충분
          var pstmt = "UPDATE member_additional_info SET m_point = m_point+? WHERE m_f_id = ? ";
          var sqlArray = [-3, device_id];
          connection.query(pstmt, sqlArray, async function(err, result){
            if(err){
              resultObject.response_data = err;
              console.log("---ERR 2 ", err);
              res.send(resultObject);
            } else{
              var messageToken = sender_id+"-"+device_id+"-"+uuidv4();
              var pstmt = "INSERT INTO random_message (r_token, r_sender_id, r_receiver_id, r_message, r_instant_sender, r_receiver_read, r_date) "+
              "VALUES (?, ?, ? , ? , ? , ?, ?)";
              var sqlArray = [messageToken, sender_id, device_id, content, sender_id, 1, time];
              connection.query(pstmt, sqlArray, async function(err, result){
                if(err){
                  resultObject.response_data = err;
                  console.log("---ERR ", err);
                  res.send(resultObject);
                }else{
                  resultObject.response_data = "success";
                  resultObject.response_token = messageToken;
                  console.log("---INSERT  SUCCESS" );
                  res.send(resultObject);
                }
              });
            }
          });

        }
      break;
    default:

  }
});
// 아래는 random 한 매시지 리스트를 받는다
app.post('/message/list', async (req, res)=>{
  var request_type = req.body.request_type;
  var request_data =req.body.request_data;
  var json =  JSON.parse(request_data);
  var device_id = json.deviceID;
  var stmt = "SELECT * FROM random_message WHERE r_sender_id = ? OR r_receiver_id = ?";
  var array = [device_id, device_id];
  var result = await asyncQuery(stmt, array);

  var sortedArray = new Array();
  for(var i= 0 ; i<result.length; i++){

      var token = result[i].r_token;

      var _stmt = "SELECT * FROM message_status WHERE token = ? AND user_id = ?";
      var _sqlArray = [token, device_id];
      var _result = await asyncQuery(_stmt, _sqlArray);
      if(_result.length != 0){
        //해당 사용자의 상태가 0 이 아니다 즉 1개이면 그 사람이 삭제를 했기 때문에 더이상 보여줄 필요가 없으므로
        //해당 내용을 return 할 필요가 없다.
      }else{

      var sender = result[i].r_sender_id;
      var receiver = result[i].r_receiver_id;

      //누가 sender 이고 누가 receiver 인지 모르므로 대조를 해봐야한다.
      var notMe = (device_id == sender) ? receiver : sender;
      var _stmt = "SELECT * FROM message_status WHERE token = ? AND user_id = ?";
      var _sqlArray = [token, notMe];
      var _result = await asyncQuery(_stmt, _sqlArray);
      var messageStatus = "live";
      if(_result.length != 0 ){
        messageStatus = "dead";
      }
        var message = result[i].r_message;
        var instant_sender = result[i].r_instant_sender;
        var isRead = result[i].r_receiver_read;
        var r_time =  dateFormat(new Date(parseInt(result[i].r_date)), "yyyy년 mm월 dd일 h시 MM분");
        var m_time =  result[i].r_date;

        var info_stmt = "SELECT * FROM member_additional_info WHERE m_f_id = ? OR m_f_id = ?";
        var info_array = [sender, receiver];
        var info_result = await asyncQuery(info_stmt, info_array);

        var senderInfo = (info_result[0].m_f_id == sender) ? info_result[0] : info_result[1];
        var receiverInfo = (info_result[0].m_f_id == receiver) ? info_result[0] : info_result[1];
        var innerObject = new Object();

        innerObject.sender = sender;
        innerObject.sender_info = senderInfo;
        innerObject.receiver = receiver;
        innerObject.receiver_info = receiverInfo;
        innerObject.instant_sender = instant_sender;
        innerObject.isRead = isRead;
        innerObject.message = message;
        innerObject.time = r_time;
        innerObject.m_time = m_time;


        var search_index = s_index(sortedArray, token);
        if(search_index == -1){
          var object = new Object();
          object.token = token;
          object.messageStatus = messageStatus;
          object.initial_s_info = senderInfo;
          object.initial_r_info =  receiverInfo;
          object.last_message_info = {"message": message, "time": r_time, "m_time": m_time};
          object.items = [innerObject];
          sortedArray.push(object);
        }else{
          sortedArray[search_index].items.push(innerObject);
          sortedArray[search_index].last_message_info = {"message": message, "time": r_time, "m_time": m_time};
        }
    }
  }
  res.send(sortedArray);
});
// 아래는 특정한 리스트를 받아 채팅하는 공간
app.post('/message/read', async (req, res)=>{
  var request_type = req.body.request_type;
  switch (request_type) {
    case "read":
    var request_data = req.body.request_data;
    var json = JSON.parse(request_data);
    var device_id = json.deviceID;
    var token = json.messageToken;

    var _stmt = "SELECT * FROM message_status WHERE token = ?";
    var _sqlArray = [token];
    var _result = await asyncQuery(_stmt, _sqlArray);

    var pstmt = "SELECT * FROM random_message WHERE r_token = ? ORDER BY r_id ASC";
    var sqlArray = [token];
    var result = await asyncQuery(pstmt, sqlArray);

    var object = new Object();
    object.status = "live";
    if(_result.length != 0){
      object.status = "dead";
    }

    for(var i = 0 ; i < result.length; i++){
      var id = "";
      var token = "";
      if( i == 0 ){
        var _pstmt = "SELECT *  FROM  firebasedevicetokenid f JOIN member_additional_info m  ON f.F_id = m.m_f_id WHERE f.F_id = ? OR f.F_id = ?";
        var _sqlArray = [result[i].r_sender_id, result[i].r_receiver_id];
        var _result = await asyncQuery(_pstmt, _sqlArray);
        object.token_info = _result;
      }
      if( i == result.length-1){
        var _u_pstmt = "UPDATE random_message SET r_receiver_read = 1 WHERE r_id  =? ";
        var _u_sqlArray = [result[result.length-1].r_id];
        connection.query(_u_pstmt, _u_sqlArray, async function(err, result){
          if(err){
            console.log("update err");
          }else{
            console.log("update success");
          }
        });
      }
    }
    object.items = result;
    // console.log(object);

    res.send(object);
      break;

    case "additional":
    console.log( " -------------- additional ------------");
      var request_data = req.body.request_data;
      var json = JSON.parse(request_data);
      var device_id = json.deviceID;
      var token = json.messageToken;

      var pstmt = "SELECT * FROM random_message WHERE r_token = ? ORDER BY r_id DESC limit 1";
      var sqlArray = [token];
      var result = await asyncQuery(pstmt, sqlArray);
      var object = new Object();
      for(var i = 0 ; i < result.length; i++){
        var id = "";
        var token = "";
        if( i == 0 ){
          var _pstmt = "SELECT *  FROM  firebasedevicetokenid f JOIN member_additional_info m  ON f.F_id = m.m_f_id WHERE f.F_id = ? OR f.F_id = ?";
          var _sqlArray = [result[i].r_sender_id, result[i].r_receiver_id];
          var _result = await asyncQuery(_pstmt, _sqlArray);
          object.token_info = _result;
        }
        if( i == result.length-1){
          var _u_pstmt = "UPDATE random_message SET r_receiver_read = 1 WHERE r_id  =? ";
          var _u_sqlArray = [result[result.length-1].r_id];
          connection.query(_u_pstmt, _u_sqlArray, async function(err, result){
            if(err){
              console.log("update err");
            }else{
              console.log("update success");
            }
          });
        }
      }
      object.items = result;
      res.send(object);
      break;
    default:

  }

});
// 아래는 메시지를 지우는 방식
app.post('/message/delete', async (req, res)=>{
  var request_type = req.body.request_type;
  var json = JSON.parse(req.body.request_data);
  var device_id = json.deviceID;
  var messageToken = json.messageToken;
  var stmt = "INSERT INTO message_status (token, user_id) VALUES (?,?)";
  var sqlArray = [messageToken, device_id];
  connection.query(stmt, sqlArray, async function(err, result){
    if(err){
      res.send("fail");
    }else{
      var object = new Object();
      object.response_type = request_type;
      object.response_data = "deleted";
      res.send(object);
    }
  });
});
// post global messaging
app.post('/message/global', async ( req, res)=>{
  var responseObject = new Object();
  var request_type = req.body.request_type;
  responseObject.response_type = request_type;
  switch (request_type) {
    case "upload":
      var request_data = req.body.request_data;
      var json = JSON.parse(request_data);

      var type = json.type;
      var message = json.message;
      var device_id = json.deviceID;
      var device_token = json.deviceToken;
      var time = Date.now();

      var pstmt = "SELECT * FROM member_additional_info WHERE m_f_id = ?";
      var sqlArray = [device_id];
      var result = await asyncQuery(pstmt, sqlArray);
      var m_point = result[0].m_point;
      if(m_point < 7){
        responseObject.response_data = "not_enough_point";
        res.send(responseObject);
      }else{
        var m_location = result[0].m_location;
        var m_age = result[0].m_age;
        var m_gender = result[0].m_gender;

        var pstmt = "UPDATE member_additional_info SET m_point = m_point+? WHERE m_f_id = ?";
        var sqlArray = [-7, device_id];
        connection.query(pstmt, sqlArray, async function(err, result){
          if(err){
            responseObject.response_data = "fail";
            res.send(responseObject);
          }else{
            var object = new Object();
            object.type = type;
            object.content = message;
            object.senderID = device_id;
            object.senderToken = device_token;
            object.senderLocation = m_location;
            object.senderAge = m_age;
            object.senderGender = m_gender;
            object.time = time;

            NoticeArray.push(object);

            responseObject.response_data = "success";
            res.send(responseObject);
          }
        });
      }

      break;
    default:

  }
});
// 접속했을때 새 메시지가 있는지 없는지 보여주는것
app.post('/lounge', async (req, res)=>{
  var responseObject = new Object();
  var request_type = req.body.request_type;
  responseObject.response_type = request_type;
  switch (request_type) {
    case "all":
      var request_data = req.body.request_data;
      var json = JSON.parse(request_data);
      var device_id = json.deviceID;
      var device_token = json.deviceToken;


      var pstmt = "SELECT count(*) as count FROM random_message r LEFT JOIN message_status s ON r.r_token = s.token WHERE s.token is null AND (r.r_sender_id =? OR r.r_receiver_id = ?) AND r.r_instant_sender <> ? AND r.r_receiver_read = -1"
      var sqlArray = [device_id, device_id, device_id, device_id];
      var result = await asyncQuery(pstmt, sqlArray);
      responseObject.response_data_count = result[0].count;

      var _pstmt = "SELECT m_point FROM member_additional_info WHERE m_f_id=?"
      var _sqlArray = [device_id];
      var _result = await asyncQuery(_pstmt, _sqlArray);
      responseObject.response_data_point = _result[0].m_point;
      // responseObject.response_data_notice = NoticeArray;
      responseObject.response_data_notice = eliminateTargetInArray(device_id, NoticeArray);
      responseObject.response_data_notice_my_list =searchMyList(NoticeArray, device_id);

      res.send(responseObject);
      break;
    default:

  }
});
//신고
app.post('/report', async (req, res)=>{
  var responseObject = new Object();// return 해야하는 object
  var request_type = req.body.request_type;
  responseObject.response_type = request_type;
  switch (request_type) {
    case "whole_message":
      var request_data = req.body.request_data;
      var json = JSON.parse(request_data);
      var device_id = json.deviceID;
      var target_device_id = json.accusingDeviceID;
      var messageToken = json.messageToken;
      var report_message = json.accsingMessage;
      var pstmt = "INSERT INTO message_report (m_r_messageToken, m_r_reporter, m_r_reported, m_r_message, m_r_reportDate, m_r_status) "+
      "VALUES (?, ?, ?, ?, ?, ?)";
      // m_r_status 가 -1 이면 아직 관리자가 해결하지 않았다는 뜻이며
      // m_r_status 가  1 이면 관리자가 해결 했다는 뜻이다.
      var sqlArray = [messageToken, device_id, target_device_id, report_message, Date.now(), -1];
      connection.query(pstmt, sqlArray, async function(err, result){
        if(err){
          console.log("fail");
          responseObject.response_data = "fail";
          res.send(responseObject);
        }else{
          //Success
          console.log("success");
          responseObject.response_data = "success";
          res.send(responseObject);
        }
      });

      break;
    case "single_message":

      break;
    default:

  }
  var json = JSON.parse(req.body.request_data);
  var device_id = json.deviceID;
  var messageToken = json.messageToken;
});
// setting get my info
app.post('/setting', async (req, res)=>{

  var responseObject = new Object();// return 해야하는 object
  var request_type = req.body.request_type;
  responseObject.response_type = request_type;
  switch (request_type) {
    case "profile":
      var request_data = req.body.request_data;
      var json = JSON.parse(request_data);
      var device_id = json.deviceID;
      var pstmt = "SELECT * FROM  firebasedevicetokenid f JOIN member_additional_info m  ON f.F_id = m.m_f_id WHERE f.F_id = ?";
      var sqlArray = [device_id];
      var result = await asyncQuery(pstmt, sqlArray);
      if(result.length > 0){
        responseObject.response_data = result;
        res.send(responseObject);
      }else{

        responseObject.response_data = "err";
        res.send(responseObject);
      }
      break;
    case "about_us":
      var aboutUs = "안녕하세요 '심심한 친구' 입니다.\n\n";
      aboutUs+= "저희 서비스를 이용해주셔서 감사의 말씀 드립니다.\n\n";
      aboutUs+= "무료하고, 심심하고, 외롭고\n\n";
      aboutUs+= "지친 일상속에서 소소한 친구 찾기 프로젝트를 시작해보세요\n\n\n";
      aboutUs+= "저희가 개발한 독자적인 알고리즘을 통해 대화상대를 탐색하여 연결해드리고, \n\n";
      aboutUs+= "청결한 서비스를 위해 운영진이 24시간 대기하여 불량 또는 불법 사용자를 제제하고 있습니다. \n\n";
      aboutUs+= "더 좋은, 더 쾌적한, 더 의미있는 서비스를 제공하기위해 노력하겠습니다.\n\n";
      aboutUs+= "감사합니다 ( 꾸벅 ) \n\n\n";
      aboutUs+= "문의 : ssijcfe@gmail.com\n";
      responseObject.response_data = aboutUs;
      res.send(responseObject);
    break;
    default:

  }
});
// point setting
app.post('/point/Reward', async (req, res)=>{
  var responseObject = new Object();
  var request_type = req.body.request_type;
  responseObject.response_type = request_type;
  var request_data = req.body.request_data;
  var json = JSON.parse(request_data);
  var device_id = json.deviceID;
  var device_token = json.deviceToken;

  switch (request_type) {
    case "get":
      var pstmt = "SELECT m_point FROM member_additional_info WHERE m_f_id = ?";
      var sqlArray = [device_id];
      var result = await asyncQuery(pstmt, sqlArray);
      responseObject.response_data = result;
      res.send(responseObject);
      break;
    case "get_update":
        res.send(responseObject);
      break;
    case "update":
      var reward_point = json.rewardPoint;
      var pstmt = "UPDATE member_additional_info SET m_point = m_point+? WHERE m_f_id=?";
      var sqlArray = [reward_point, device_id];

      connection.query(pstmt, sqlArray, function(err, result){
        if(err){
          console.log("fail::: ", err);
          responseObject.response_data = "fail";
          res.send(responseObject);
        }else{
          console.log("update_success :::", result);
          responseObject.response_data = "success";
          res.send(responseObject);
        }
      });
      break;
    case "update_get":
      var reward_point = json.rewardPoint;
      var pstmt = "UPDATE member_additional_info SET m_point = m_point+? WHERE m_f_id=?";
      var sqlArray = [reward_point, device_id];
      connection.query(pstmt, sqlArray, async function(err, result){
        if(err){
          console.log("fail::: ", err);
          responseObject.response_data = "fail";
          res.send(responseObject);
        }else{
          console.log("update_success :::", result);
          var _pstmt = "SELECT m_point FROM member_additional_info WHERE m_f_id = ?";
          var _sqlArray = [device_id];
          var _result = await asyncQuery(_pstmt, _sqlArray);
          responseObject.response_data = _result;
          res.send(responseObject);
        }
      });
      break;
    default:
      res.send(responseObject);
  }
});

//Online checker
app.post('/online', async (req, res)=>{
  var responseObject = new Object();
  var request_type = req.body.request_type;
  var request_data = req.body.request_data;
  var json = JSON.parse(request_data);
  var device_id = json.deviceID;
  var device_token = json.deviceToken;

  responseObject.response_type = request_type;
  switch (request_type) {
    case "online":
      if(OnLineArray.indexOf(device_id) == -1){
        OnLineArray.push(device_id);
      }
      break;
    case "offline":
      var searchIndex = OnLineArray.indexOf(device_id);
      if(searchIndex != -1){
        OnLineArray.splice(searchIndex, 1);
      }
      break;
    default:

  }
});







app.get('/get1', async (req, res)=>{
  console.log("some one connected");
  message = new targetMessage('dClR1nlCPfk:APA91bElgP2K-oGUCA-0RR7fVpyVnjQ86u41imfT2YzyG0SvmH-AYFXFNih5gMGOmgAiJR3K7c_DmJZE58aKUjiPqReneEo2oO6tSMcuZmNkppFAxCzolGpjyBp7NNUN--o1vETczE1F', "hello", "hello", "qweqweasd" );
  console.log(message.targetMessage());

  res.send(message.targetMessage());

  fcm.send(message.targetMessage(), function(err, response){
      if (err) {
          console.log("Something has gone wrong! ::", err);
      } else {
          console.log("Successfully sent with response: ", response);
      }
  });
});
app.get('/get2', async (req, res)=>{
  console.log("some one connected");
  message = new targetMessage('cAUhUoCV9eU:APA91bG0Y4uDagPz2PuIKDCOTNbeOhE6V3eL9Wgxr-NqpJ_AzhUQcQZhw3RohW72tZP7Ao3kU818d8IAx9ufvXBpKhbGVjMIZfRIS4HUjpcDP9ExBFURkAeOOgG1KS88emPqOeLftWlk', "hello", "hello", "qweqweasd" );
  console.log(message.targetMessage());

  res.send(message.targetMessage());

  fcm.send(message.targetMessage(), function(err, response){
      if (err) {
          console.log("Something has gone wrong! ::", err);
      } else {
          console.log("Successfully sent with response: ", response);
      }
  });
});

function sendNotification(toToken, title, message, messageToken){
  message = new targetMessage(toToken, title, message, messageToken);
  // res.send(message.targetMessage());
  fcm.send(message.targetMessage(), function(err, response){
      if (err) {
          console.log("Something has gone wrong! ::", err);
      } else {
          console.log("Successfully sent with response: ", response);
      }
  });
}
function searchMyList(array, device_id){
  var return_array =  [];
  for(var i = 0 ; i < array.length; i ++ ){
    if(array[i].senderID == device_id){
      return_array.push(array[i]);
    }
  }
  return return_array;
}
function eliminateTargetInArray(target, array){
  var temp = []
  for(var i = 0 ; i < array.length; i ++){
    var type = array[i].type;
    if(type != "announcement"){
      var senderID = array[i].senderID;
      if(senderID != target){
        temp.push(array[i]);
      }
    }else{
        temp.push(array[i]);
    }
  }
  return createRandomArray(temp);
}
function createRandomArray(array){
  var numbers = [];
  var return_array = [];
  var i = 0 ;
  if(array.length > 9){
    while(i <= 9){
        var number = random(0, array.length-1);
        if(numbers.indexOf(number) == -1){
          numbers.push(number);
          return_array.push(array[number]);
          i++;
        }
    }
    return return_array;
  }else{
    return array;
  }

}
function random(low, high) {
  return Math.floor(Math.random(Date.now()) * (high - low) + low);
}
function s_index (array, key){
  for(var i = 0 ; i < array.length; i++){
    // console.log(array[i].token , "  :: ", key );
    if(array[i].token == key){

      return i;
    }
  }
  return -1;
}
function getRandomIntInclusive(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min; //최댓값도 포함, 최솟값도 포함
}
function search(age_type, location_type, gender_type, u_age, u_location, u_gender, device_id){
  console.log("print :: ", age_type+"//"+location_type+"//"+gender_type+"//"+u_age+"//"+u_location+"//"+u_gender);
  var searchSQL = "";
  var searchSQLArray = [];
  if(age_type == 1){
    // 또래에게 보내는 메시지
    if(location_type == 1){
      //같은 지역에게 보내는 메시지
      if(gender_type ==1){
        // 이성에게 보내는 메시지를
        console.log("여기");
        searchSQL = "SELECT f.F_id, f.F_Token FROM member_additional_info m, firebasedevicetokenid f  WHERE f.F_id = m.m_f_id AND m.m_age <= ?+3 AND m.m_age >= ?-3 AND m.m_location = ? AND m.m_gender = ? AND f.F_status =1 AND CAST(f.F_date as UNSIGNED) >= ? AND f.F_id <> ? AND m.m_f_id <> ?";
        searchSQLArray = [u_age, u_age, u_location, u_gender, (Date.now()-604800000), device_id, device_id];

      }else{
        //성별 랜덤
        searchSQL = "SELECT   f.F_id, f.F_Token FROM member_additional_info m, firebasedevicetokenid f  WHERE f.F_id = m.m_f_id AND m.m_age <= ?+3 AND m.m_age >= ?-3 AND m.m_location = ? AND CAST(f.F_date as UNSIGNED) >= ? AND f.F_status =1 AND f.F_id <> ? AND m.m_f_id <> ?";
        searchSQLArray = [u_age, u_age, u_location,  (Date.now()-604800000), device_id, device_id];
      }
    }else{
      //지역 랜덤
      if(gender_type ==1){
        // 이성에게 보내는 메시지
          searchSQL = "SELECT   f.F_id, f.F_Token FROM member_additional_info m, firebasedevicetokenid f  WHERE f.F_id = m.m_f_id AND m.m_age <= ?+3 AND m.m_age >= ?-3 AND m.m_gender = ? AND CAST(f.F_date as UNSIGNED) >= ? AND f.F_id <> ? AND f.F_status =1 AND m.m_f_id <> ?";
          searchSQLArray = [u_age, u_age, u_gender,  (Date.now()-604800000), device_id, device_id];
      }else{
        //성별 랜덤
          searchSQL = "SELECT   f.F_id, f.F_Token FROM member_additional_info m, firebasedevicetokenid f  WHERE f.F_id = m.m_f_id AND m.m_age <= ?+3 AND m.m_age >= ?-3 AND CAST(f.F_date as UNSIGNED) >= ? AND f.F_id <> ? AND f.F_status =1 AND m.m_f_id <> ?";
          searchSQLArray = [u_age, u_age,  (Date.now()-604800000), device_id, device_id];
      }
    }
  }else{
    // 나이 랜덤
    if(location_type == 1){
        //같은 지역에게 보내는 메시지
      if(gender_type ==1){
            // 이성에게 보내는 메시지
            searchSQL = "SELECT   f.F_id, f.F_Token FROM member_additional_info m, firebasedevicetokenid f  WHERE f.F_id = m.m_f_id AND m.m_location = ? AND m.m_gender = ? AND CAST(f.F_date as UNSIGNED) >= ? AND f.F_status =1 AND f.F_id <> ? AND m.m_f_id <> ?";
            searchSQLArray = [u_location, u_gender,  (Date.now()-604800000), device_id, device_id];
      }else{
              //성별 랜덤
            searchSQL = "SELECT   f.F_id, f.F_Token FROM member_additional_info m, firebasedevicetokenid f  WHERE f.F_id = m.m_f_id AND m.m_location = ? AND CAST(f.F_date as UNSIGNED) >= ? AND f.F_status =1 AND f.F_id <> ? AND m.m_f_id <> ?";
            searchSQLArray = [ u_location,  (Date.now()-604800000), device_id, device_id];
      }
    }else{
          //지역 랜덤
      if(gender_type ==1){
            // 이성에게 보내는 메시지
            searchSQL = "SELECT   f.F_id, f.F_Token FROM member_additional_info m, firebasedevicetokenid f  WHERE f.F_id = m.m_f_id AND  m.m_gender = ? AND CAST(f.F_date as UNSIGNED) >= ? AND f.F_id <> ? AND f.F_status =1 AND m.m_f_id <> ?";
            searchSQLArray = [u_gender,  (Date.now()-604800000), device_id, device_id];
      }else{
              //성별 랜덤
          searchSQL = "SELECT   f.F_id, f.F_Token FROM member_additional_info m, firebasedevicetokenid f  WHERE f.F_id = m.m_f_id AND CAST(f.F_date as UNSIGNED) >= ? AND f.F_status =1 AND f.F_id <> ? AND m.m_f_id <> ?";
          searchSQLArray = [ (Date.now()-604800000), device_id, device_id];
      }
    }
  }
  return [searchSQL, searchSQLArray];
}
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


console.log(" --------------- " + Date.now() + "----------------");
console.log("Server running @ http://localhost:" + "3000");

app.get('/admin_page/admin_only/', async (req, res)=>{

});
app.post('/admin_page/admin_only/ajax', async (req, res)=>{

});







var _app = _http.createServer(function(req, res){
  var _url = req.url;
  var queryData = url.parse(_url, true).query;
  var pathname = url.parse(_url, true).pathname;
  var title = queryData.id;
  if(pathname === '/'){
     if(queryData.id === undefined){
       fs.readFile(`data/${queryData.id}`, 'utf8', function(err, description){
         var title = 'Welcome';
         var description = 'Hello, Node.js';
         var template = `
         <!doctype html>
         <html>
         <head>
           <title>WEB1 - ${title}</title>
           <meta charset="utf-8">
         </head>
         <body>
           <h1><a href="/">WEB</a></h1>
           <ul>
             <li><a href="/?id=HTML">HTML</a></li>
             <li><a href="/?id=CSS">CSS</a></li>
             <li><a href="/?id=JavaScript">JavaScript</a></li>
           </ul>
           <h2>${title}</h2>
           <p>${description}</p>
         </body>
         </html>
         `;
         res.writeHead(200);
         res.end(template);
       });
     } else {
       fs.readFile(`data/${queryData.id}`, 'utf8', function(err, description){
         var title = queryData.id;
         var description = queryData.id;
         var template = `
         <!doctype html>
         <html>
         <head>
           <title>WEB1 - ${title}</title>
           <meta charset="utf-8">
         </head>
         <body>
           <h1><a href="/">WEB</a></h1>
           <ul>
             <li><a href="/?id=HTML">HTML</a></li>
             <li><a href="/?id=CSS">CSS</a></li>
             <li><a href="/?id=JavaScript">JavaScript</a></li>
           </ul>
           <h2>${title}</h2>
           <p>${description}</p>
         </body>
         </html>
         `;
         res.writeHead(200);
         res.end(template);
       });
     }
   } else {
     res.writeHead(404);
     res.end('Not found');
   }
});
_app.listen(3001);
