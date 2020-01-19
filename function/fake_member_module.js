const uuidv4 = require('uuid/v4');

module.exports = function(){
  return{
    create_fake_member : function (connection, age_type, location_type, gender_type, i_age, i_location, i_gender, callback) {

          if(gender_type == 1){
            var location = i_location;
            var gender = i_gender;
            var age = getRandomIntInclusive((i_age-5), (i_age+5));
            var f_id = uuidv4()+"_"+Date.now();
            var pstmt = "INSERT INTO temp_search_fail (t_id, t_location, t_age, t_gender, t_time) VALUES (?,?,?,?,?)";
            var sqlArray = [f_id, location, age, gender, Date.now()];
            connection.query(pstmt, sqlArray, function(err, result){
              if(err){
                var object = new Object();
                object.response = "fail";
                callback(object);
              }else{
                var object = new Object();
                object.response = "success";
                object.id = f_id;
                object.location = location;
                object.age = age;
                object.gender = gender;
                callback(object);
              }
            });
          }else{
            var location = i_location;
            var gender = (i_gender == "m")? "f" : "m";
            var age = getRandomIntInclusive((i_age-5), (i_age+5));
            var f_id = uuidv4()+"_"+Date.now();
            var pstmt = "INSERT INTO temp_search_fail (t_id, t_location, t_age, t_gender, t_time) VALUES (?,?,?,?,?)";
            var sqlArray = [f_id, location, age, gender, Date.now()];
            connection.query(pstmt, sqlArray, function(err, result){
              if(err){
                var object = new Object();
                object.response = "fail";
                callback(object);
              }else{
                var object = new Object();
                object.response = "success";
                object.id = f_id;
                object.location = location;
                object.age = age;
                object.gender = gender;
                callback(object);
              }
            });
          }
        },
        save_message_toward_fake : function (connection, token_id, sender_id, receiver_id, message, callback){
          var pstmt = "INSERT INTO random_message (r_token, r_sender_id, r_receiver_id, r_message, r_instant_sender, r_receiver_read, r_date) VALUES (?,?,?,?,?,?,?)";
          var sqlArray = [token_id, sender_id, receiver_id, message, sender_id, -1, Date.now()];
          connection.query(pstmt, sqlArray, function(err, result){
            if(err){
              callback("err");
            }else{
              callback("success");
            }
          });
        }
  }

}

function getRandomIntInclusive(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min; //최댓값도 포함, 최솟값도 포함
}
