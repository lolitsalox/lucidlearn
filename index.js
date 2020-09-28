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
const bcrypt = require("bcrypt");




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

async function generateID() {
    let id;
    try {
        let result = await db.query({text: "SELECT id FROM users", rowMode: "array"});
        do {
            id = Math.random() * 10**18;
        } while (result.rows.includes(id) || `${id}`.length != 18);
        return id;
    } catch (err) {
        console.log(err);
    }
}

async function userWith(field, value) {
    try {
        const result = await db.query("SELECT email FROM users WHERE email='roiesholet@gmail.com'");
        console.log(result.rows, result.rowCount);
        return result.rowCount > 0;
    } catch (err) {
        console.log(err);
    };
}

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
app.post("/create_user", async (request, response) => { // lucidlearn.tk/user_with
    const inputFirstName = request.query["first-name"],
    inputLastName = request.query["last-name"],
    inputEmail = request.query["email"],
    inputUsername = request.query["username"],
    inputPassword = request.query["password"];
    const id = await generateID();

    if (await userWith("email", inputEmail)) {
        return response.status(403).json({"error": "This email is already in use!"});
    }

    if (await userWith("username", inputUsername)) {
        return response.status(403).json({"error": "This username is already in use!"})
    };

    bcrypt.hash(inputPassword, 12, (err, hashed) => {
        if (err) {
            console.log(err);
            return response.sendStatus(500);
        }
        db.query("INSERT INTO users (id, first_name, last_name, email, username, password) VALUES ($1, $2, $3, $4, $5, $6)", [id, inputFirstName, inputLastName, inputEmail, inputUsername, hashed], (err, res) => {
            if (err) {
                console.log(err.stack);
                response.sendStatus(403);
            }
            else response.sendStatus(200);
        });
    });
});


const PORT = process.env.PORT || 8080;
const DYNO_URL = 'https://lucidlearn.herokuapp.com';
http.createServer(app).listen(PORT, function () {
    wakeDyno(DYNO_URL);
    console.log('Express server listening on port ' + PORT);
});