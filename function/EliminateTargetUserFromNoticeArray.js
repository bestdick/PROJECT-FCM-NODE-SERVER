function EliminateTargetUserFromNoticeArray(targetUser, noticeArray){
  this.targetUser = targetUser;
  this.noticeArray = noticeArray
}

var proto = EliminateTargetUserFromNoticeArray.prototype;

proto.setTargetUser = function(targetUser){
  this.targetUser = targetUser;
};
proto.getTargetUser = function(){
  return this.targetUser;
};
proto.setNoticeArray  = function(noticeArray){
  this.noticeArray = noticeArray;
};
proto.getNoticeArray = function(){
  return this.noticeArray;
};

proto.EliminateAction = function(){
  var target = this.targetUser;
  var array = this.noticeArray;

  for(var i = 0 ; i < array.length; i ++){
    var type = array[i].type;
    if(type != "announcement"){
      var senderID = array[i].senderID;
      if(senderID == target){
        array.splice(i,1);
      }
    }
  }
  console.log(array.length);
  return array;
};

module.exports = EliminateTargetUserFromNoticeArray;
