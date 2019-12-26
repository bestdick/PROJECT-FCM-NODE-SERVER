var admin = require("firebase-admin");

var serviceAccount = require("../firebase_key/chattingtest-a8358-firebase-adminsdk-t0k40-4feb7cb82c.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  //databaseURL: "https://chattingtest-a8358.firebaseio.com"
});


// var fcm_target_token ="AAAA6rfi34s:APA91bECbtPb04JGww0bYUUywciUhl2aMjJ-PFkiFHZremNTdzVxEP-B4fNLPE_UjeXuXqnBC4Jp_9Ob6FX_yy71PWBkjG6yohqL9fF6ms0m_SPMVQzvuzGKBCgcK_5fU2AU7igSNqGg";
var fcm_target_token ="BFk6lYe6cRth9a3WQxsfaNWELZ0Xn8cwgZ5yv-8ljT29ozOqxtrTwoipWee6Z7nnppE3YnWnocBA2yP4E_pFL8s";
var fcm_message  = {
  notification:{
    title:"test title",
    body:"test message"
  }
};

admin.messaging().sendToDevice(fcm_target_token, fcm_message)
    .then(function(response){
      console.log("success : ", response);
    })
    .catch(function(error){
      console.log("fail : ", error);
    });
