function CheckAdditionalExist(connection, device_id){
  this.connection = connection;
  this.device_id = device_id;
};

var proto = CheckAdditionalExist.prototype;

proto.method = function(){
  var stmt = "SELECT * FROM member_additional_info WHERE m_f_id =?";
  this.connection.query(stmt, this.device_id, function(err, result){
    if(err){
      console.log("err::", err);
      this.result = err;

    }else{
      console.log("result ::", result.length);
      this.result = result.length;

    }
  });
};

proto.callback = function(){
  return {
      result: this.result
  }
};

module.exports=CheckAdditionalExist;



// module.exports = {
//   checker : function (connection, device_id){
//   var stmt = "SELECT * FROM member_additional_info WHERE m_f_id =?";
//   connection.query(stmt, device_id, function(err, result){
//     if(err){
//       console.log("err::", err);
//
//       return err;
//     }else{
//       console.log("result ::", result.length);
//
//       return result.length;
//     }
//       });
//     }
//
// };
