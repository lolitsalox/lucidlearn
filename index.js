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

// client.query('SELECT table_schema,table_name FROM information_schema.tables;', (err, res) => {
//     if (err) throw err;
//     for (let row of res.rows) {
//       console.log(JSON.stringify(row));
//     }
//     client.end();
//   });
client.query("CREATE TABLE IF NOT EXISTS test_table (uid int, name text)", (err, res) => {
    if (err) throw err;
    client.end();
});
count = 1;
client.query("INSERT INTO test_table VALUES ($1, $2)", (count++, "nisim maxim"), (err, res) => {
    if (err) throw err;
    console.log(count);
    client.end();
});

app.use(express.static(path.join(__dirname, "public")));


app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));


const PORT = process.env.PORT || 8080;
const DYNO_URL = 'https://lucidlearn.herokuapp.com';
http.createServer(app).listen(PORT, function() {
    wakeDyno(DYNO_URL);
    console.log('Express server listening on port ' + PORT);
});