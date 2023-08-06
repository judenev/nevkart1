var createError = require('http-errors');
var express = require('express');
var hbs =require('express-handlebars')
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var db =require('./connection/connections');

var adminRouter = require('./routes/admin');

var usersRouter = require('./routes/users');
var session = require('express-session');
const multer = require('multer');
var app = express();
const fileupload = require("express-fileupload");
const helpers=require('handlebars-helpers')();
const Handlebars= require('handlebars')

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.engine('hbs',hbs.engine({extname:'hbs',defaultLayout:'layout',layoutsDir:__dirname+'/views/layout/',helpers:helpers}))
//app.use(multer)
Handlebars.registerHelper("inc",function(value){
  return parseInt(value)+1
  
});
Handlebars.registerHelper("when",function(operand_1,operator,operand_2,options){
  var operators={
    'eq':function(l,r){return l==r},
    'noteq':function(l,r){return l!=r},
    'gt':function(l,r){return Number(l) >Number(r);},
    'or': function(l,r){return l||r},
    'and': function(l,r){return l&&r;},
    '%': function(l,r){return(l%r)==0;}


  }
, result=operators[operator](operand_1,operand_2);
if(result)return options.fn(this);
else return options.inverse(this)


})
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
var bodyParser = require('body-parser');
const { options } = require('./routes/admin');
app.use(bodyParser.urlencoded({ extended: true }))
// app.use(fileupload());

db.connect((err)=>{
  if(err) console.log("Error Occured");
  else console.log('Connected database');
})
app.use(session({secret:"##jude",  saveUninitialized: false, cookie:{maxAge:600000},resave:false}))
app.use( (req, res, next) =>{
  res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
  next();
});
app.use('/admin', adminRouter);
app.use('/', usersRouter);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  console.log('page not ');
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
