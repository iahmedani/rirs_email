require('dotenv').config();
var knex = require('knex')({
  client: 'mysql2',
  connection: {
    host : process.env.DB_HOST,
    user : process.env.DB_USER,
    password : process.env.DB_PASS,
    database : process.env.DB_DATABASE
  }
});
var express = require('express');
var bodyParser = require('body-parser');
var multer = require('multer');
var logger = require('morgan');

var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
app.use(multer());
app.use(logger('dev'));

app.post('/test', (req, reso)=>{
  console.log(req.body);
})

