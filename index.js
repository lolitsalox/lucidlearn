const { Client } = require('pg');
const express = require("express");
const app = express();
const path = require('path');
const http = require("http");
const { wakeDyno } = require('heroku-keep-awake');


const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

client.connect();

client.query("INSERT INTO users (id, password, email, name) VALUES (1234567890, 69420666, roiesholet@gmail.com, Roie)", (err, res) => {
    if (err) throw err;
    client.end();
  });

app.use(express.static(path.join(__dirname, "public")));


app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'Login_v2/index.html')));
app.get('/db', (req, res) => {
    client.query("SELECT * FROM users", (err, res_) => {
        if (err) throw err;
        res.send(`<h1>${res_.rows.join('\n')}</h1>`);
        client.end();
    });
});


const PORT = process.env.PORT || 8080;
const DYNO_URL = 'https://lucidlearn.herokuapp.com';
http.createServer(app).listen(PORT, function() {
    wakeDyno(DYNO_URL);
    console.log('Express server listening on port ' + PORT);
});