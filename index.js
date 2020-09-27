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

function generateID() {
    db.query("SELECT id FROM users", (err, res) => {
        if (err) throw err;
        const ids = [];
        res.rows.forEach(id => ids.push(id));
    });
    let id;
    do {
        id = Math.random() * 19;
    } while (ids.includes(id));
    return id;
};

app.use(express.static(path.join(__dirname, "public")));

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, '/public/Login/index.html')));
app.get('/register', (req, res) => res.sendFile(path.join(__dirname, '/public/Register/index.html')));
app.get('/arc-sw.js', (req, res) => res.sendFile(path.join(__dirname, '/public/Login/arc-sw.js')));

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

app.get("/validate", (request, response) => {
    db.query("SELECT * FROM users WHERE username=$1 and password=$2", [request.query.username, request.query.password], (err, res) => {
        if (err) throw err;
        if (res.rowCount > 0) { // MAKE SURE THE REQUEST IS COMING FROM lucidlearn.tk/register lucidlearn.tk/validate
            response.send("sup bitch how ya doin'");
        } else {
            response.send("who you");
        }
    });
});
app.post("/create_user", (request, response) => { // lucidlearn.tk/user_with
    for (const item in request.query) {
        console.log(item);
    }
    response.sendStatus(200);
});


const PORT = process.env.PORT || 8080;
const DYNO_URL = 'https://lucidlearn.herokuapp.com';
http.createServer(app).listen(PORT, function () {
    wakeDyno(DYNO_URL);
    console.log('Express server listening on port ' + PORT);
});