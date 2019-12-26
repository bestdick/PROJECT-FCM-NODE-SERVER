var FCM = require('fcm-node');
    var serverKey = 'AAAA6rfi34s:APA91bF66oVcBbk1vyDk8uooTmjB8EIkSGNRCHMa1trleQm7cB_uOfv45bl4DhudLYCm3VgchjF1sVe1CYjFY9dr-oqtLRKQpRd5VmGpsF5Newz87HedNBLib6IzZIlt_eEEjQIHJTRu'; //put your server key here
    var fcm = new FCM(serverKey);

    var message = { //this may vary according to the message type (single recipient, multicast, topic, et cetera)
         to: 'cKp2efr6oGA:APA91bFD8-eljig0vYXA10eX8DkH3bo-FM-HlD5n0arQVsGvXBYYSDziR3y8iwJX2WiFj6BFfetD7WnXx142ilYphbkpYYj97OQJ2Z2ZopCA7ca9sFJ9I7J3Q1txpOUw5-Igrw8DEnFj',
        // collapse_key: 'your_collapse_key',

        notification: {
            title: 'Title of your push notification',
            body: 'Body of your push notification'
        }
        // ,
        //
        // data: {  //you can send only notification or only data(or include both)
        //     my_key: 'my value',
        //     my_another_key: 'my another value'
        // }
    };

    fcm.send(message, function(err, response){
        if (err) {
            console.log("Something has gone wrong! ::", err);
        } else {
            console.log("Successfully sent with response: ", response);
        }
    });
