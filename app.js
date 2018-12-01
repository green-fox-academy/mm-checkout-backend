'use strict'

const express = require('express');
const app = express();
const mysql = require('mysql');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();

const conn = mysql.createConnection({
  host: 'mattermostdb.caklgmbaggid.eu-central-1.rds.amazonaws.com',
  user: 'mattermostdb',
  password: 'mattermost',
  database: 'mattermost',
});

conn.connect((err) => {
  if (err) {
    console.log(err);
    return;
  }
  console.log(`Connection to DB established`);
});

app.use('/assets', express.static('assets'));
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
  const incoming = req.body;
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/feedback', jsonParser, (req, res) => {
  const {rating, feeling, finished, energy, favorite, feedback, hardest, is_relevant, whatlearned} = req.body.model;
  // let channel = model.channel;
  // let username = model.username;
  // let created_at = model.created_at;
  let token = req.body.token;
  let mmToken = 1111;

  // if (token === mmToken) {
  if (rating && feeling && finished && energy) {
    conn.query(`INSERT INTO checkout (rating, feeling, finished, energy) values (?, ?, ?, ?);`, [rating, feeling, finished, energy], (err, result) => {
      if (err) {
        console.log(`Database error POST`);
        res.status(500).send(err.message);
        return;
      } else {
        res.status(200).json({
          result,
        })
      }
    })
  }
  // } else {
  //   console.log(`Invalid authentication`);
  //   res.status(400).send(err.message);
  //   return;
  // }
})

app.get('/link', (req, res) => {
  { username, channel_name }  = req.params;
  console.log(`${username}, ${channel_name}`);
  res.json({
    "url" : `http://mmcheckoutfrontend.s3-website.eu-central-1.amazonaws.com?channel_name=${channel_name}&username=${username}`,
    "message": "Click on the link to submit your feedback."
  });
});


app.get('/daily-feedback', (req, res) => {
  conn.query(`SELECT DISTINCT channel FROM checkout`, (err, result) => {
    if (err) {
      console.log(`Database error daily-feedback`);
      res.status(500).send(err.message);
      return;
    } else {
      res.status(200).json({
        result,
      })
    }
  })
});

app.get('/checkouts/:channel', (req, res) => {
  conn.query(`SELECT * FROM checkout WHERE channel='${req.params.channel}';`, function (err, results) {
    if (err) {
      console.log(err.toString());
      res.status(500).send('Database error');
      return;
    }
    res.render('channelinfo', {
      results,
    });
  });
});

module.exports = app;
