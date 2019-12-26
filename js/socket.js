// var express = require('express');
// var socket = require('socket.io');
// var fs = require('fs');
// var app = express();
// var io = socket(server);
// var server = app.listen(3000,'0.0.0.0',function() {
//   console.log('Server connected at port 3000');
// });

// io.on('connection',function(socket){
//   console.log('socket connected');
//   socket.on('data',function (data) {
//     console.log('Data transfer is ready');
//   });
// });

var app = require('express')();
var http = require('http').Server(app).listen(3000);
var io = require('socket.io').listen(http);
const bodyParser= require('body-parser');
const connectionPool = require('./connectdb');
const cookieParser = require('cookie-parser'); // store cookie to clients machine
const session = require('express-session'); // login confirmation
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true, parameterLimit: 1000000}));
//const users = [{name:'admin', uid:'admin', password:'111'}];
let devices = [];
let users = [];
let sensorsData = {};
var switchConditions = [];
const conditionCheckTime = 1; // in secs
setInterval(conditionChecker, conditionCheckTime*1000);
connectionPool.query('select * from switch_conditions', function (err, result){
	if (err) throw err;
		switchConditions = result;

	console.log('Database has beed loaded on the server!');
});
function conditionChecker(){
	if(switchConditions.length>0){
		switchConditions.forEach(function(element){
			let device = devices.find(function(elem){
			 	return elem.devid==element.devid;
			});
			if(device){
				switch (element.sensor_type) {
					case 'temp':
						// if there is sensor data of the device
						if(sensorsData[device.sid]){
							let res = statement(parseInt(sensorsData[device.sid].temp), parseInt(element.value), element.cond);
							console.log(sensorsData[device.sid].temp, element.value, element.cond);
							if(res==-1){
								console.log('Invalid operator');
							}else if(res){
								// do something
								let json = {};
								if(element.switch_state == 'on'){
									// change to element.switch_pin
									json[element.switch_pin] = 'high';
									io.to(device.sid).emit('switchChange', json);
								}else{
									json[element.switch_pin] = 'low';
									io.to(device.sid).emit('switchChange', json);
								}
								console.log('Switch state changed');
								console.log(json);
							}else{
								// do opposite, condition is not sattisfied
								let json = {};
								if(element.switch_state == 'on'){
									// change to element.switch_pin
									json[element.switch_pin] = 'low';
									io.to(device.sid).emit('switchChange', json);
								}else{
									json[element.switch_pin] = 'high';
									io.to(device.sid).emit('switchChange', json);
								}
							}
						}

						break;
					case 'humid':
						if(sensorsData[device.sid]){
							let res = statement(parseInt(sensorsData[device.sid].humid), parseInt(element.value), element.cond);
							console.log(sensorsData[device.sid].humid, element.value, element.cond);
							if(res==-1){
								console.log('Invalid operator');
							}else if(res){
								// do something
								let json = {};
								if(element.switch_state == 'on'){
									// change to element.switch_pin
									json[element.switch_pin] = 'high';
									io.to(device.sid).emit('switchChange', json);
								}else{
									json[element.switch_pin] = 'low';
									io.to(device.sid).emit('switchChange', json);
								}
								console.log('Switch state changed');
								console.log(json);
							}else{
								// do opposite, condition is not sattisfied
								let json = {};
								if(element.switch_state == 'on'){
									// change to element.switch_pin
									json[element.switch_pin] = 'low';
									io.to(device.sid).emit('switchChange', json);
								}else{
									json[element.switch_pin] = 'high';
									io.to(device.sid).emit('switchChange', json);
								}
							}
						}
						break;
					default:
						// statements_def
						break;
				}
			}

		});
	}
}

function statement(left, right, oper){
	switch (oper) {
		case '<':
			if(left<right)
				return true;
			else
				return false;
			break;
		case '>':
			if(left>right)
				return true;
			else
				return false;
			break;
		case '<=':
			if(left<=right)
				return true;
			else
				return false;
			break;
		case '>=':
			if(left>=right)
				return true;
			else
				return false;
			break;
		case '=':
			if(left==right)
				return true;
			else
				return false;
			break;
		default:
			return -1;
			break;
	}

}

const modulesList = [
					{'module':'switch', 'pins':['D0','D1','D2']},
					{'module':'light-sensor', 'pins':['A0']},
					{'module':'temperature', 'pins':['D2']}
					];

// initialize cookie-parser to allow us access the cookies stored in the browser.
app.use(cookieParser());

// initialize express-session to allow us track the logged-in user across sessions.
app.use(session({secret: "Secret key protecter string sdff",
   				key: 'user_sid',
				resave: false,
			    saveUninitialized: true,
			    cookie: {
			    	// expires in an hour
			        expires: 6000000
			    }
}));

var loginChecker = (req, res, next) => {
	let index = users.findIndex(function(elem){
	 	return elem.token==req.body.token;
	});
    if (index<0) {
        res.send('login');
    } else {
        next();
    }
};

app.post('/login', function(req, res) {
	const uid = req.body.id;
	const pwd = req.body.pw;
	console.log(uid)
	console.log(pwd)
	const sql = `select * from users where uid=\'${uid}\' and password=\'${pwd}\'`;
	connectionPool.query(sql, function (err, result){
		if (err){
			return err;
		}
	 	if(result.length>0){
	 		//req.session.logged = true;
	 		//req.session.uid = result[0].id;
	 		let index = users.findIndex(function(elem){
	 			return elem.uid==result[0].id;
	 		});
			console.log('login index', index);
	 		let token;
	 		if(index>=0){
	 			token = randHex(32);
				users[index].token = token;
	 		}else{
				token = randHex(32);
				users.push({'uid':result[0].id,'token':token});
	 		}
			// temorary
			res.send({'access':'success', 'token': token});
	 	}else{
  			res.send({'access':'invalid'});
	 	}
	});

	// const index = users.findIndex(obj => obj.uid===uid);

	// if(index!=-1 && users[index].password === pwd){
	// 	req.session.logged = true;
	// 	// temorary
	// 	res.send("success");
	// }else{
	// 	//set the appropriate HTTP header
 //  		res.send("error");
	// }
});

// app.post('/login', (req, res)=>{
// 	const id = req.body.id;
// 	const password = req.body.pw;
// 	console.log(id);
// 	console.log(password);

// 	if(id=="a" && password=="111"){
// 		res.send("success");
// 	}else{
// 		res.send("error");
// 	}
// });

io.on('connection', function(socket){
	console.log('a user connected!');
	socket.on('disconnect', function(){
        console.log('user disconnected');
        //devices.findIndex()
        let index = devices.findIndex(function(elem){
	 		return elem.sid==socket.id;
		});
		if(index>=0){
			clearInterval(devices[index].interval);
			devices.splice(index, 1);
		}
	});
	// device authentification
	socket.on('auth', async function(data){
        console.log(data," device has been connected");
        console.log(socket.id);
		let loops = {};
        let setupConfigs = {};
        const sql = `select d0, d1, d2, a0, d0_state, d1_state, d2_state, a0_state from devices where device_id=\'${data}\'`;
        const result = await asyncQuery(sql);

        // light sensor configs
        if(result[0].a0==='light-sensor'){
        	loops['a0'] = 'light';
        	setupConfigs['a0'] = 'in';
        }

        // switch configs
        if(result[0].d0==='switch'){
        	setupConfigs['d0'] = 'out';
        }
        if(result[0].d1==='switch'){
        	setupConfigs['d1'] = 'out';
        }
        if(result[0].d2==='switch'){
        	setupConfigs['d2'] = 'out';
        }

        // dht config
        if(result[0].d2==='temperature'){
        	setupConfigs['dht'] = 'attached';
        	loops['dht'] = 'stat';
        }

        // // light-sensor config
        // if(result[0].d0==='light-sensor'){
        // 	setupConfigs['d0'] = 'in';
        // 	loops['d0'] = 'light';
        // }
        // if(result[0].d1==='light-sensor'){
        // 	setupConfigs['d1'] = 'in';
        // 	loops['d0'] = 'light';
        // }
        // if(result[0].d2==='light-sensor'){
        // 	setupConfigs['d2'] = 'in';
        // 	loops['d0'] = 'light';
        // }
        console.log('setupConfigs', setupConfigs);
        //devices.push({'devid':data, 'sid':socket.id});


        let switchStates = {};
        if(result[0].d0==='switch'){
        	if(result[0].d0_state==='on'){
        		switchStates['d0'] = 'high';
        	}else{
        		switchStates['d0'] = 'low';
        	}
        }
        if(result[0].d1==='switch'){
        	if(result[0].d1_state==='on'){
        		switchStates['d1'] = 'high';
        	}else{
        		switchStates['d1'] = 'low';
        	}
        }
        if(result[0].d2==='switch'){
        	if(result[0].d2_state==='on'){
        		switchStates['d2'] = 'high';
        	}else{
        		switchStates['d2'] = 'low';
        	}
        }
        // // change later. currently only d2 port
        // if(result[0].d2==='temperature'){
        // 	setupConfigs['dht'] = 'attached';
        // 	loops['temp'] = 'stat';
        // }

        // emit config params
        io.to(socket.id).emit('configs', setupConfigs);
        io.to(socket.id).emit('switchChange', switchStates);


        let interval = null;
        // set intervals
        console.log('loops:', loops);
        if(loops){
        	interval = setInterval(function(){
				io.to(socket.id).emit('statRequest', loops);
				//io.to(socket.id).emit('dhtStatus', {'temp':'stat'});
			}, 1000);
        }
        devices.push({'devid':data, 'sid':socket.id, 'interval': interval});

	});
	// listents for send-chat-message event
	const json = {"command":112};
	socket.on('send-chat-message', (message)=>{
		// broadcast everyone except the sender
		//socket.broadcast.emit('response', message);
		var temp = JSON.parse(message);
		//socket.broadcast.emit('response', temp);
		//console.log(devices);
		let device = devices.find(function(elem){
			return elem.devid=='q1kow2ooe';
		});
		//console.log(device);
		if(device){
			//io.to(device.sid).emit('switchChange', temp);
			io.to(device.sid).emit('dhtStatus', temp);

			//socket.connected[device.sid].emit('response', temp);
		}
	});

	socket.on('dht', function(message){
		sensorsData[socket.id] = message;
		console.log(sensorsData[socket.id]);
	});

});


// root directory
app.get('/', function(req, res) {
    res.sendFile(__dirname + '/esp.html');
});

// script directory
app.get('/esp.js', function(req, res) {
    res.sendFile(__dirname + '/esp.js');
});

app.post('/registration', async (req, res)=>{
	const uid = req.body.id;
	const password = req.body.pw;
	let sql = `select * from users where uid=\'${uid}\'`;
	let result  = await asyncQuery(sql);
	if(result.length>0){
		res.send('exist');
	}else{
		sql = `insert into users(uid, password) values(\'${uid}\', \'${password}\')`;
		connectionPool.query(sql, function (err, result){
			if (err){
				return err;
			}
		});
		res.send("success");
	}
});

app.post('/add/deviceid', loginChecker, async (req, res)=>{
	const devid = req.body.devid;
	const devname = req.body.devname;

	let index = users.findIndex(function(elem){
	 	return elem.token==req.body.token;
	});
	const uid = users[index].uid;
	console.log('devid ' + devid)
	console.log('devname ' + devname)
	console.log('uid ' + uid)

	let sql = `select * from devices where device_id=\'${devid}\'`;
	let result  = await asyncQuery(sql);

	if(result.length>0){
		// such a device exist
		sql = `update devices set device_name=\'${devname}\', user_id=\'${uid}\' where device_id=\'${devid}\'`;
		connectionPool.query(sql, function (err, result){
			if (err){
				return err;
			}
		});
		res.send('success');
	}else{
		// does not exist
		res.send("notexist");
	}
});

app.post('/add/modules', loginChecker, (req, res)=>{
	res.json(modulesList);
});

app.post('/add/module', loginChecker, async (req, res)=>{
	const devid = req.body.devid;
	const module_ = req.body.module;
	const pinNum = req.body.pinNum;
	console.log(devid);
	console.log(module_);
	console.log(pinNum);
	if(devid&&module_&&pinNum){
		let sql;;

		switch (pinNum) {
			case 'D0':
				if(module_=='switch'){
					sql = `update devices set d0=\'${module_}\', d0_state=\'off\' where device_id=\'${devid}\'`;
				}else{
					sql = `update devices set d0=\'${module_}\' where device_id=\'${devid}\'`;
				}
				break;
			case 'D1':
				if(module_=='switch'){
					sql = `update devices set d1=\'${module_}\', d1_state=\'off\' where device_id=\'${devid}\'`;
				}else{
					sql = `update devices set d1=\'${module_}\' where device_id=\'${devid}\'`;
				}
				break;
			case 'D2':
				if(module_=='switch'){
					sql = `update devices set d2=\'${module_}\', d2_state=\'off\' where device_id=\'${devid}\'`;
				}else{
					sql = `update devices set d2=\'${module_}\' where device_id=\'${devid}\'`;
				}
				break;
			case 'A0':
				// pinNum==a0
				sql = `update devices set a0=\'${module_}\' where device_id=\'${devid}\'`;
				break;
		}
		let result =  await asyncQuery(sql);
		console.log(result);
		res.send('success');
	}else{
		res.send('error');
	}

});

app.post('/node/modules', loginChecker, async (req, res)=>{
	const devid = req.body.devid;

	let sql = `select * from devices where device_id=\'${devid}\'`;
	const result = await asyncQuery(sql);

	let json = [];

	if(result[0].d0){
		json.push({'moduleName':result[0].d0,'pinNum':'D0'});
	}
	if(result[0].d1){
		json.push({'moduleName':result[0].d1,'pinNum':'D1'});
	}
	if(result[0].d2){
		json.push({'moduleName':result[0].d2,'pinNum':'D2'});
	}
	if(result[0].a0){
		json.push({'moduleName':result[0].a0,'pinNum':'A0'});
	}
	res.send(json);

});

app.post('/node/module', loginChecker, async (req, res)=>{
	const devid = req.body.devid;
	const pinNum = req.body.pinNum;
	const switch_ = req.body.switch;
	const temperature = req.body.temperature;
	const light = req.body.light;

	let device = devices.find(function(elem){
	 	return elem.devid==devid;
	});
	console.log(devid);
	console.log(switch_);
	console.log('temperature:', temperature);
	console.log(light);

	if(device){
		let sql;
		let result;
		if(switch_){
			if(switch_=='stat'){
				sql = `select d0_state, d1_state, d2_state from devices where device_id=\'${devid}\'`;
				result = await asyncQuery(sql);
				switch(pinNum){
					case 'D0':
						if(result[0].d0_state==null){
							res.send({'stat':'error'});
						}else{
							res.send({'stat':result[0].d0_state});
						}
					break;
					case 'D1':
						if(result[0].d1_state==null){
							res.send({'stat':'error'});
						}else{
							res.send({'stat':result[0].d1_state});
						}
					break;
					case 'D2':
						if(result[0].d2_state==null){
							res.send({'stat':'error'});
						}else{
							res.send({'stat':result[0].d2_state});
						}
					break;

					default:
						res.send({'stat':'error'});

				}
			}else if(switch_=='on'){

				switch(pinNum){
					case 'D0':
						sql = `update devices set d0_state=\'on\' where device_id=\'${devid}\'`;
						result = await asyncQuery(sql);
						if(device){
							io.to(device.sid).emit('switchChange', {'d0':'high'});
						}
						res.send({'stat':'on'});
					break;
					case 'D1':
						sql = `update devices set d1_state=\'on\' where device_id=\'${devid}\'`;
						result = await asyncQuery(sql);
						if(device)
							io.to(device.sid).emit('switchChange', {'d1':'high'});
						res.send({'stat':'on'});
					break;
					case 'D2':
						sql = `update devices set d2_state=\'on\' where device_id=\'${devid}\'`;
						result = await asyncQuery(sql);
						if(device)
							io.to(device.sid).emit('switchChange', {'d2':'high'});
						res.send({'stat':'on'});
					break;

					default:
						res.send({'stat':'error'});

				}

			}else{
				switch(pinNum){
					case 'D0':
						sql = `update devices set d0_state=\'off\' where device_id=\'${devid}\'`;
						result = await asyncQuery(sql);
						if(device)
							io.to(device.sid).emit('switchChange', {'d0':'low'});
						res.send({'stat':'off'});
					break;
					case 'D1':
						sql = `update devices set d1_state=\'off\' where device_id=\'${devid}\'`;
						result = await asyncQuery(sql);
						if(device)
							io.to(device.sid).emit('switchChange', {'d1':'low'});
						res.send({'stat':'off'});
					break;
					case 'D2':
						sql = `update devices set d2_state=\'off\' where device_id=\'${devid}\'`;
						result = await asyncQuery(sql);
						if(device)
							io.to(device.sid).emit('switchChange', {'d2':'low'});
						res.send({'stat':'off'});
					break;

					default:
						res.send({'stat':'error'});

				}

			}
		}

		if(temperature){

			let conds = [];
			switchConditions.forEach(function(element){
				if(element.devid == devid){
					conds.push(element);
				}
			});

			if(sensorsData[device.sid]){
				res.send({'temp':sensorsData[device.sid].temp, 'humid':sensorsData[device.sid].humid, 'cond':conds});
			}else{
				res.send({'stat':'error'});
			}


		}

		if(light){
			// get light status
			if(sensorsData[device.sid]){
				res.send({'light':sensorsData[device.sid].light});
			}else{
				res.send({'stat':'error'});
			}

		}
	}



});

app.post('/node/controllers', loginChecker, async (req, res)=>{
	const devid = req.body.devid;
	let sql = `select * from devices where device_id=\'${devid}\'`;
	let result =  await asyncQuery(sql);
	let json = [];
	if(result[0].d0=='switch'){
		json.push({'switch':'d0'});
	}
	if(result[0].d1=='switch'){
		json.push({'switch':'d1'});
	}
	if(result[0].d2=='switch'){
		json.push({'switch':'d2'});
	}
	res.send(json);
	console.log(devid);
});

app.post('/add/condition', loginChecker, async (req, res)=>{

	const devid = req.body.devid;
	const switch_pin = req.body.switch_pin;
	const switch_state = req.body.switch_state;
	const sensor_type = req.body.sensor_type;
	const value = req.body.value;
	const cond = req.body.cond;

	let index = switchConditions.findIndex(function(element){
		return element.devid==devid && element.switch_pin==switch_pin;
	});
	console.log(index);
	console.log(devid);
	console.log(switch_pin);
	console.log(switch_state);
	console.log(sensor_type);
	console.log(value);
	console.log(cond);
	if(index>=0){
		// condition exist
		let sql = `update switch_conditions set switch_state=\'${switch_state}\', sensor_type=\'${sensor_type}\', value=\'${value}\', cond=\'${cond}\' where devid=\'${devid}\' and switch_pin=\'${switch_pin}\'`;
		let result =  await asyncQuery(sql);
		switchConditions[index].switch_state = switch_state;
		switchConditions[index].sensor_type = sensor_type;
		switchConditions[index].value = value;
		switchConditions[index].cond = cond;
		console.log('Changed condition');
	}else{
		// new condition
		let sql = `insert into switch_conditions values(\'${devid}\',\'${switch_pin}\',\'${switch_state}\',\'${sensor_type}\',\'${value}\', \'${cond}\')`;
		let result =  await asyncQuery(sql);
		switchConditions.push({'devid':devid,'switch_pin':switch_pin, 'switch_state':switch_state,'sensor_type':sensor_type,'value':value, 'cond':cond});
		console.log('New condition');

	}

	res.send({'stat':'success'});


});




app.post('/user/main', loginChecker, async (req, res)=>{
	let user = users.find(function(elem, index){
	 	return elem.token==req.body.token;
	});
	const uid = user.uid;
	console.log(uid);
	let sql = `SELECT device_id as devid, device_name as devname FROM \`devices\` WHERE user_id=\'${uid}\'`;
	let result =  await asyncQuery(sql);
	let json = [];
	result.forEach(function(elem, index){
		let state = devices.find(function(e,i){
			return e.devid==elem.devid;
		});
		if(state){
			state = 'online';
			json.push({'devid':elem.devid, 'devname':elem.devname, 'state':state});
		}else{
			state = 'offline';
			json.push({'devid':elem.devid, 'devname':elem.devname, 'state':state});
		}
	});

	res.json(json);

});


function asyncQuery(sql){
	return new Promise(function(resolve, reject){
		connectionPool.query(sql, function (err, result){
		if (err){
			return reject(err);
		}
		resolve(result);
		});
	});
}

function randHex(len) {
	var maxlen = 8,
      min = Math.pow(16,Math.min(len,maxlen)-1)
      max = Math.pow(16,Math.min(len,maxlen)) - 1,
      n   = Math.floor( Math.random() * (max-min+1) ) + min,
      r   = n.toString(16);
	while ( r.length < len ) {
	 	r = r + randHex( len - maxlen );
	}
	return r;
};


console.log("Socket-Server running @ http://localhost:" + "3000");
