const { Client } = require('pg');
const express = require("express");
const app = express();
const path = require('path');
const http = require("http");
const { wakeDyno } = require('heroku-keep-awake');


const client = new Client({
    connectionString: "postgres://dzmnmictdmtiaa:cbb90ed9cb8a3d088a862ef4da189c3d4e2602482e1796defb36bdd246638e17@ec2-52-212-157-46.eu-west-1.compute.amazonaws.com:5432/users",
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
count = 0;
client.query("INSERT INTO test_table VALUES ($1, $2)", [count, "nisim maxim"], (err, res) => {
    if (err) throw err;
    client.end();
});

app.use(express.static(path.join(__dirname, "public")));


app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/db', (req, res) => {
    res.send(`<h1>count: ${count++}</h1>`);
    client.query("UPDATE test_table SET uid=$1 WHERE name='nisim maxim'", [count], (err, res) => {
        if (err) throw err;
        client.end();
    });
});


const PORT = process.env.PORT || 8080;
const DYNO_URL = 'https://lucidlearn.herokuapp.com';
http.createServer(app).listen(PORT, function() {
    wakeDyno(DYNO_URL);
    console.log('Express server listening on port ' + PORT);
});