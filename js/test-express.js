const express = require('express');
const app = express();
const path = require('path');
const router = express.Router();

console.log("path :: ", path.join(__dirname + '/../'));

app.use('/', router);
app.listen(process.env.port || 3000);

console.log("Server Running at Port 3000");

 app.post('/', (req, res)=>  res.send("hello world") ) ;

// app.get('/notification', (req, res)=> res.send("notif"));


// router.get('/',function(req,res){
//   res.sendFile(path.join(__dirname+'/../client/test-client.html'));
//   //__dirname : It will resolve to your project folder.
// });


// app.get('/test/', function(req, res)=> res.send("fuck yea"));
