var app = require('express')();
var http = require('http').Server(app).listen(3000);
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
const uuidv4 = require('uuid/v4');
var dateFormat = require('dateformat');



 // var message = { //this may vary according to the message type (single recipient, multicast, topic, et cetera)
 //      to: 'ev2WqKc2rlo:APA91bEXJRmHhqdU834IFTKXKMDVc1M6Tba19EAeDqKhl0NXuS-yXpC2xg5REd9_zKLQ0MplNRnMbNze3cOhgP7Tp94bRxQ07ogkrngmM7X2JAbG4grk8A-_CK9Y8noV51NTWIETF-tc',
 //     // collapse_key: 'your_collapse_key',
 //     notification: {
 //         title: 'Title of your push notification',
 //         body: 'Body of your push notification'
 //     }
 //     ,
 //     data: {  //you can send only notification or only data(or include both)
 //         my_key: 'my value',
 //         my_another_key: 'my another value'
 //     }
 // };

 // fcm.send(message.printInfo, function(err, response){
 //     if (err) {
 //         console.log("Something has gone wrong! ::", err);
 //     } else {
 //         console.log("Successfully sent with response: ", response);
 //     }
 // });


//basic server connection direction
app.post('/', async (req, res)=>{
  res.send("success");
});
// 아래는 가입시 추가적인 정보 업로드하는 것
app.post('/register/upload', async (req, res)=>{
  console.log("---- some one registered -----");
  var request_type =req.body.request_type;
  switch (request_type){
    case "additionals_register_upload":
        var request_data = req.body.request_data;
        var json = JSON.parse(request_data);
        var device_id = json.deviceID;
        var age = json.age;
        var location = json.location;
        var gender = json.gender;
        var stmt = "INSERT INTO member_additional_info (m_f_id, m_location, m_age, m_gender, m_point, m_register_date) VALUES (?, ?, ?, ?, 0, ?)";
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

      console.log("user device_id : " , device_id);
      console.log("user message : " , message_content);

      var sql = "SELECT f.F_Token, f.F_date, m.m_location, m.m_age, m.m_gender FROM firebasedevicetokenid f , member_additional_info m WHERE m.m_f_id = ? AND f.F_id = ? GROUP BY f.F_id";
      var array = [device_id, device_id];
      var result = await asyncQuery(sql, array);
      var u_token =  result[0].F_Token;
      var u_last_conn_date =  result[0].F_date;
      var u_location =  result[0].m_location;
      var u_age =  result[0].m_age;
      var u_gender =  (result[0].m_gender == "m") ? "f" : "m";
      var searchResult = search(age_type, location_type, gender_type, u_age, u_location, u_gender, device_id);
      var result = await asyncQuery(searchResult[0], searchResult[1]);
      console.log(" ---------- SEARCH RESULT :: -----------");
      console.log("Count Result : ", result.length);
      var randomNumber = getRandomIntInclusive(0, (result.length-1));
      console.log("Selected Random Number : ", randomNumber);

      var selected =  result[randomNumber];
      var selected_id =  selected.F_id;
      var selected_token =  selected.F_Token;

      console.log(" RAW DATA ---- ::: ----- BELOW ----- ");
      console.log(result);

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
                  console.log("upload_success");
                  resultObject.response_data = "success";
                  res.send(resultObject);
                }
              });
          }
      });

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
        var time =  dateFormat(new Date(parseInt(result[i].r_date)), "yyyy년 mm월 dd일 h시 MM분");

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
        innerObject.time = time;


        var search_index = s_index(sortedArray, token);
        if(search_index == -1){
          var object = new Object();
          object.token = token;
          object.messageStatus = messageStatus;
          object.initial_s_info = senderInfo;
          object.initial_r_info =  receiverInfo;
          object.last_message_info = {"message": message, "time": time};
          object.items = [innerObject];
          sortedArray.push(object);
        }else{
          sortedArray[search_index].items.push(innerObject);
          sortedArray[search_index].last_message_info = {"message": message, "time": time};
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

    var pstmt = "SELECT * FROM random_message WHERE r_token = ? ORDER BY r_id ASC";
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
//신고
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

      responseObject.response_data = result[0].count;
      console.log("count ::::  ", result[0].count);
      res.send(responseObject);
      break;
    default:

  }
});
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
  console.log("------------------- profile ------------------");
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
        console.log(" RESULT :: > 0 ");
        responseObject.response_data = result;
        res.send(responseObject);
      }else{
        console.log(" RESULT :: < 0 ");
        responseObject.response_data = "err";
        res.send(responseObject);
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
