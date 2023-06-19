var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var hbs =require("express-handlebars")
// var fileUpload=require("express-fileupload")
var multer=require("multer")
var db=require('./config/connection');
var session =require('express-session');
var nocache=require('nocache')
var usersRouter = require('./routes/users');
var adminRouter = require('./routes/admin');
var alert  = require("alert");
var handlebars=require("handlebars")
const flash = require('connect-flash');
const nodemailer = require("nodemailer");
const { body, validationResult } = require('express-validator');
handlebars.registerHelper('eq', function (value1, value2) {
  return value1 === value2;
});

handlebars.registerHelper('gt', function (value1, value2) {
  return value1 > value2;
});

handlebars.registerHelper('lt', function (value1, value2) {
  return value1 < value2;
});
handlebars.registerHelper('add', function (value1, value2) {
  return value1 + value2;
});

handlebars.registerHelper('sub', function (value1, value2) {
  return value1 - value2;
});
handlebars.registerHelper('isChecked', function(condition) {
  return condition ? 'checked' : '';
});
var app = express();





// view engine setup
app.set('views', path.join(__dirname, 'views'));
 app.set('view engine', 'hbs');
app.engine('hbs',hbs({
  extname:'hbs',
  defaultLayout:'layout',
  layoutsDir:__dirname + '/views/layout/',
  prtialsDir:__dirname + '/views/partials/'
}));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(flash());
app.use('/public' ,express.static(path.join(__dirname, 'public')));
// express form validate
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use(session({secret:"Key",cookie:{maxAge:60000*20}}))









app.use(function (req, res, next) { 
  res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
   next(); });
app.use(nocache())


db.connect((err)=>{
  if(err) console.log("connection Error");
  else    console.log('Database connected');
})

app.use('/', usersRouter);
app.use('/admin', adminRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});



module.exports = app;
