const ip = require("ip");
const express = require('express');
const app = express();
const session = require('express-session');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const auth = require('./auth.js');

app.set('views', './views'); //Configuramos el directorio de vistas
app.set('view engine', 'ejs');


app.use(cookieParser());
app.use(bodyParser.urlencoded({extended : false})); //Para recuperar parámetros de peticiones post

app.use(session({
    secret: '2C44-4D44-WppQ38S',
    resave: true,
    saveUninitialized: true
}));

app.use('/', auth({ passwordFile: './users.json',
                    pathToProtect: './gh-pages',
                    loginView: 'formulariologin',
                    fullLoginView: 'logincompleto'
}));

app.get('/', function(req,res){
  res.render('index');
});

// listen on all addresses
const server = app.listen(8080, '0.0.0.0', function () {

  const host = server.address().address
  const port = server.address().port

  console.log('Server with sessions and auth listening at http://%s:%s my ip = %s', host, port, ip.address())

})
