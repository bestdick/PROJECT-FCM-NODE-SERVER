function message(to, title, body, type, token) {
 this.to = to;
 this.title = title;
 this.body = body;
 this.type = type;
 this.token = token;
};
var proto = message.prototype;

proto.setTo = function(to){
 this.to = to;
};

proto.getTo = function() {
 return this.to;
};

proto.setTitle = function(title){
 this.title = title;
};

proto.getTitle = function() {
 return this.title;
};


proto.setBody = function(body){
 this.body = body;
};

proto.getBody = function() {
 return this.body;
};
proto.setToken = function(token){
 this.token = token;
};

proto.getToken = function() {
 return this.token;
};
proto.setType = function(type){
  this.type = type;
};
proto.getType = function(){
  return this.type;
};
// var pstmt = "SELECT * FROM random_message WHERE r_token = ? ORDER BY r_id ASC";

proto.targetMessage = function() { //this may vary according to the message type (single recipient, multicast, topic, et cetera)
  return  {
    to: this.to,
    // collapse_key: 'your_collapse_key',
    // notification: {
    //     title: this.title,
    //     body: this.body,
    //     click_action : "OPEN_ACTIVITY"
    // },
    data:{
      type: this.type,
      token: this.token,
      message: this.body,
      title : this.title,
      body: this.body
    }
  }
};

module.exports = message;
