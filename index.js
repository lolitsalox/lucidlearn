const {
    Pool
} = require('pg');
const express = require("express");
const app = express();
const path = require('path');
const http = require("http");
const {
    wakeDyno
} = require('heroku-keep-awake');
const bcrypt = require("bcrypt");
const cookieParser = require("cookie-parser");



const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

(async () => {
    const client = await pool.connect();
    try {
        const res = await client.query("SELECT * FROM users");
        res.rows.forEach(row => {
            console.log(JSON.stringify(row, null, 4));
        });
    } finally {
        client.release();
    }
})().catch(err => console.log(err.stack));

app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));


async function validateCookie(req, res, next) {
    const {cookies} = req;
    if ("session_id" in cookies) {
        const client = await pool.connect();
        try {
            const result = await client.query("SELECT session_id FROM cookies WHERE session_id = $1", [cookies.session_id]);
            if (result.rows.length) {
                const client1 = await pool.connect();
                try {
                    const newCookie = generateCookieID();
                    await client1.query("UPDATE cookies SET session_id = $2 WHERE session_id = $1", [cookies.session_id, newCookie]);
                    res.cookie("session_id", newCookie);
                    next();
                } catch (err) {
                    console.log(err);
                } finally {
                    client1.release();
                }
            }
        } catch (err) {
            console.log(err);
        } finally {
            client.release();
        }
    }
}


app.get('/', validateCookie, (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, '/public/Login/index.html')));
app.get('/register', (req, res) => res.sendFile(path.join(__dirname, '/public/Register/index.html'))); // we stopped at cookie with validating;
app.get('/arc-sw.js', (req, res) => res.sendFile(path.join(__dirname, '/public/Login/arc-sw.js')));


async function generateCookieID() {
    const client = await pool.connect();
    try {
        let id;
        const result = await client.query({text: "SELECT session_id FROM cookies", rowMode: "array"});
        do {
            id = Math.random() * 10**18;
        } while (result.rows.includes(id) || `${id}`.length != 18);
        return id;
    } catch (err) {
        console.log(err);
    } finally {
        client.release();
    }
}


async function generateID() {
    const client = await pool.connect();
    try {
        let id;
        const result = await client.query({text: "SELECT id FROM users", rowMode: "array"});
        do {
            id = Math.random() * 10**18;
        } while (result.rows.includes(id) || `${id}`.length != 18);
        return id;
    } catch (err) {
        console.log(err);
    } finally {
        client.release();
    }
}

async function userWith(field, value) {
    const client = await pool.connect();
    try {
        const res = await client.query(`SELECT id FROM users WHERE ${field} = '${value}'`);
        console.log(res.rows);
        return res.rows.length > 0;
    } catch (err) {
        console.log(err);
    } finally {
        client.release();
    }
}


app.post("/validate", async (request, response) => {
    const client = await pool.connect();
    try {
        const res = await client.query(`SELECT password FROM users WHERE ${Object.keys(request.query)[0]} = $1`, [request.query[Object.keys(request.query)[0]]]);
        if (res.rows.length) {
            bcrypt.compare(request.query.password, res.rows[0]["password"], async (err, same) => {
                if (same) {
                    const client1 = await pool.connect();
                    try {
                        const newCookie = generateCookieID();
                        response.cookie("session_id", newCookie, {maxAge: 31556952000});
                        response.status(200).send("success");
                        await client1.query("BEGIN");
                        await client1.query("INSERT INTO cookies (session_id) VALUES ($1)", [newCookie]);
                        await client1.query("COMMIT");
                    } catch (err) {
                        console.log(err);
                    } finally {
                        client1.release();
                    }
                } else {
                    response.status(401).send("error1");
                }
            });
        } else {
            response.status(401).send("error0");
        }
    } catch (err) {
        console.log(err);
    } finally {
        client.release();
    }
});

app.post("/create_user", async (request, response) => { // lucidlearn.tk/user_with
    const inputFirstName = request.query["first-name"],
    inputLastName = request.query["last-name"],
    inputEmail = request.query["email"],
    inputUsername = request.query["username"],
    inputPassword = request.query["password"];
    const id = await generateID();

    const emailAlreadyExists = await userWith("email", inputEmail);
    const usernameAlreadyExists = await userWith("username", inputUsername);

    if (emailAlreadyExists) {
        return response.status(403).send("error0");
    }

    else if (usernameAlreadyExists) {
        return response.status(403).send("error1")
    };

    bcrypt.hash(inputPassword, 12, async (err, hashed) => {
        if (err) {
            console.log(err);
            return response.sendStatus(500);
        }
        const client = await pool.connect();
        const query = {text: "INSERT INTO users (id, first_name, last_name, email, username, password) VALUES ($1, $2, $3, $4, $5, $6)"};
        try {
            await client.query("BEGIN");
            await client.query(query, [id, inputFirstName, inputLastName, inputEmail, inputUsername, hashed]);
            await client.query("COMMIT");
            return response.status(200).send("success");
        } catch (err) {
            console.log(err);
            await client.query("ROLLBACK");
        } finally {
            client.release();
        }
    });
});


const PORT = process.env.PORT || 8080;
const DYNO_URL = 'https://lucidlearn.herokuapp.com';
http.createServer(app).listen(PORT, function () {
    wakeDyno(DYNO_URL);
    console.log('Express server listening on port ' + PORT);
});