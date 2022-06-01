/*let express = require('express');
let app = express();

app.use("/", express.static(__dirname));

app.get("/", function(req, res) {
    res.sendFile(__dirname + '/dist/index.html');
});

// necessary for heroku, as heroku will position the PORT environment variable
let port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log("Server is running on port " + port);
});*/
let express = require('express');
let app = express();
let http = require('http').Server(app);
let io = require('socket.io')(http);
let path = require ('path');
let os = require('os');
let ifaces = os.networkInterfaces();
let port = process.env.PORT || 8000; // connexion heroku

// ================================================
// SHOW IP ADDRESS IN CONSOLE
console.log('=============');
console.log('IP ADDRESS:');
Object.keys(ifaces).forEach(function (ifname) {
    var alias = 0;

    ifaces[ifname].forEach(function (iface) {
    if ('IPv4' !== iface.family || iface.internal !== false) {
        // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
        return;
    }
    if (alias >= 1) {
        // this single interface has multiple ipv4 addresses
        console.log(ifname + ':' + alias, iface.address);
    } else {
        // this interface has only one ipv4 adress
        console.log(ifname, iface.address);
    }
    ++alias;
    });
});
console.log('=============');