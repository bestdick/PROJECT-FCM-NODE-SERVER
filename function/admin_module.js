var mysql = require('mysql');
var config = require('../database/db_info.js').local;
// var mysql_dbc = require('../database/db_con.js')();
// var connection = mysql_dbc.init();
// mysql_dbc.test_open(connection);


module.exports =  function(connection){
  this.connection = connection;
  return{
    login: function(input_id, input_pw){
      if(input_id == "admin" && input_pw =="wnrud12"){
        return "access_granted";
      }else{
        return "access_denied";
      }
    },

    main :  async function(callback){
      var array = new Array();
      var pstmt = "SELECT DISTINCT r.r_token FROM random_message r, message_status m WHERE LOCATE(?, r.r_token) AND r.r_sender_id = r.r_instant_sender";
      var sqlArray = ["fake"];
      var result = await asyncQuery(pstmt, sqlArray);

      for(var i = 0 ; i<result.length; i++){
          var token = result[i].r_token;
          var _pstmt = "SELECT token FROM message_status WHERE token = ?";
          var _sqlArray = [token];
          var _result = await asyncQuery(_pstmt, _sqlArray);
          if(_result.length == 0){
            var __pstmt = "SELECT * FROM random_message WHERE r_token = ? ORDER BY r_id DESC LIMIT 1";
            var __sqlArray = [token];
            var __result = await asyncQuery(__pstmt, __sqlArray);
            var sender = __result[0].r_sender_id;
            var instant_sender =__result[0].r_instant_sender;
            // console.log("SENDER ::", sender);
            // console.log("instant ::", instant_sender);
            if(sender == instant_sender){
              array.push(result[i]);
            }
          }
      }
      callback(array);
    },

    selected_message : async function(token, callback){
      var array =  new Array();
      var pstmt = "SELECT * FROM random_message WHERE r_token = ? ORDER BY r_id ASC";
      var sqlArray = [token];
      var result = await asyncQuery(pstmt, sqlArray);

      for(var i = 0 ; i < result.length; i++){
        var id = result[i].r_id;
        var token = result[i].r_token;
        var sender = result[i].r_sender_id;
        var _pstmt = "SELECT f.F_Token, f.F_date, m.m_location, m.m_age, m.m_gender, m.m_point FROM firebasedevicetokenid f , member_additional_info m WHERE m.m_f_id = ? AND f.F_id = ? GROUP BY f.F_id";
        var _sqlArray = [sender, sender];
        var _result = await asyncQuery(_pstmt, _sqlArray);
        var senderInfo = _result[0];

        var receiver = result[i].r_receiver_id;
        var _pstmt = "SELECT * FROM temp_search_fail WHERE t_id = ?";
        var _sqlArray = [receiver];
        var _result = await asyncQuery(_pstmt, _sqlArray);
        var receiverInfo = _result[0];

        var message = result[i].r_message;
        var instant_sender =result[i].r_instant_sender;
        var receiver_read = result[i].r_receiver_read;
        var time= result[i].r_date;

        var items = new Object();
        items.message = message;
        items.instant_sender = instant_sender;
        items.receiver_read = receiver_read;
        items.time= time;

        var object = new Object();
        object.id = id;
        object.token = token;
        object.sender = sender;
        object.senderInfo = senderInfo;
        object.receiver = receiver;
        object.receiverInfo = receiverInfo;
        object.items = [items];

        var index = s_index(array, token);
        if(index == -1){
          array.push(object);
        }else{
          array[index].items.push(items);
        }
      }
      callback(array);
    },

    send_message : async function(json, callback){
      //fcm 은 서버에서 처리하고 그 후 작업들을 여기서 처리한다.
      var pstmt = "INSERT INTO random_message (r_token, r_sender_id, r_receiver_id, r_message, r_instant_sender, r_receiver_read,  r_date) VALUES (?, ?, ?, ?, ?, ?, ? )";
      var sqlArray = [json.token, json.sender, json.receiver, json.message, json.receiver, json.read, json.time];
      connection.query(pstmt, sqlArray, function(err, result){
        if(err){
          callback("fail");
        }else{
          callback("success");
        }
      });
    }


  }
};


function s_index (array, key){
  for(var i = 0 ; i < array.length; i++){
    // console.log(array[i].token , "  :: ", key );
    if(array[i].token == key){

      return i;
    }
  }
  return -1;
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
