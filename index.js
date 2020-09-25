const {
    Client
} = require('pg');
const express = require("express");
const app = express();
const path = require('path');
const http = require("http");
const {
    wakeDyno
} = require('heroku-keep-awake');
const { Console } = require('console');


const db = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

db.connect();

db.query("SELECT * FROM users", (err, res) => {
    if (err) {
        db.end();
        throw err;
    }
    res.rows.forEach(row => {
        console.log(JSON.stringify(row, null, 4));
    });
});

app.use(express.static(path.join(__dirname, "public")));


app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, '/public/Login/index.html')));
app.get('/db', (req, res) => {
    db.query("SELECT * FROM users", (err, res_) => {
        if (err) {
            db.end();
            throw err;
        }
        let rows = [];
        res_.rows.forEach(row => {
            rows.push(JSON.stringify(row, null, 4));
        });
        res.send(`<h1>${rows.join('\n')}</h1>`);
    });
});


const PORT = process.env.PORT || 8080;
const DYNO_URL = 'https://lucidlearn.herokuapp.com';
http.createServer(app).listen(PORT, function () {
    wakeDyno(DYNO_URL);
    console.log('Express server listening on port ' + PORT);
});