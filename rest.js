var fs = require("fs");
var filename = __dirname + "/" + "playlist.json";
var playlist = {};
fs.readFile(filename, 'utf8', function (err, data) {
    playlist = JSON.parse(data);
});

var app = require('express')();
var bodyParser = require('body-parser');
app.use(bodyParser.json());

app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,PATCH,POST,DELETE');
    next();
});

app.get('/playlist', function (req, res) {
    res.json(playlist);
    console.log("get");
});

app.put('/playlist', function (req, res) {
    var list = req.body;
    console.log(list);
    console.log("put");
    fs.writeFile(filename, JSON.stringify(list));
});
var server = app.listen(8400, function () {
    var port = server.address().port;
    console.log("Example app listening on port %s", port);
});
