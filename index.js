const express = require("express");
const app = express();
const path = require('path');
const http = require("http");
const { wakeDyno } = require('heroku-keep-awake');

app.use(express.static(path.join(__dirname, "public")));


app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));


const PORT = process.env.PORT || 8080;
const DYNO_URL = 'https://lucidlearn.herokuapp.com';
http.createServer(app).listen(PORT, function() {
    wakeDyno(DYNO_URL);
    console.log('Express server listening on port ' + PORT);
});