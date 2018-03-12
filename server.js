var express = require('express');
var app = express();
var session = require('express-session');
var cookieParser = require('cookie-parser');
var fs = require('fs');
var bcrypt = require('bcrypt-nodejs');
var salt = bcrypt.genSaltSync(10);
var bodyParser = require('body-parser');

var file = './users.json'; //archivo donde se guardan los usuarios
if (!fs.existsSync(file)) fs.writeFileSync('./users.json', '[]');

app.set('views', './views'); //Configuramos el directorio de vistas
app.set('view engine', 'ejs');


app.use(cookieParser());
app.use(bodyParser.urlencoded({extended : false})); //Para recuperar parámetros de peticiones post

app.use(session({
    secret: '2C44-4D44-WppQ38S',
    resave: true,
    saveUninitialized: true
}));

// Funcion de autenticación, si existe nombre y password en la sesión, se puede ver el contenido
var auth = function(req, res, next) {
    if(req.session && req.session.username && req.session.password){
      return next();
    }
    else { // https://developer.mozilla.org/es/docs/Web/HTTP/Status/401 
      return res.sendStatus(401); // 401: falta autenticación para el recurso solicitado.
    }
  };

//Ruta estática para ver el contenido, se necesita haber iniciado previamente sesion
app.use('/content', auth, express.static('./gh-pages'));

app.get('/', function(req,res){
  res.render('index');
});


//Fase de login ////////////////////////////////////////////////////////////////
app.get('/login', function (req, res) {
  if ( (!req.session.username)) {
    res.render('formulariologin');
  }
  else if ((req.session.username)) {
    res.render('logincompleto', {username:req.session.username});
  }
});

app.post('/login', function(req,res){


  var configFile = fs.readFileSync(file);
  var config = JSON.parse(configFile);

  let u = config.find((user) => user.username == req.body.username);
  if (u !== -1) {
    if ((req.session) && (bcrypt.compareSync(req.body.password, u.password))){
      req.session.username = req.body.username;
      req.session.password = req.body.password;
      req.session.admin = true;
      return res.render('logincompleto', {username:req.session.username});
    } 
  }
  else
   return res.render('errorlogin');
})

//Fase de registro /////////////////////////////////////////////////////////////
app.get('/register', function (req, res) {
  if ((!req.session.username)) {
    res.render('formularioregistro');
  }
  else{
    res.render('logincompleto', {username:req.session.username});
  }
});

app.post('/register', function (req, res) {

  var configFile = fs.readFileSync(file);
  var config = JSON.parse(configFile);
  var index = config.findIndex((i) => {
    return  (i.username == req.body.username)
  });
  var newUser = {"username" : req.body.username, "password" : bcrypt.hashSync(req.body.password, salt) };
  if (index == -1) config.push(newUser);
  else return res.render('errorregister', newUser);
  var configJSON = JSON.stringify(config);
  fs.writeFileSync(file, configJSON);
  res.render('registrado', {username:req.body.username});

});

//Cerrar sesion ////////////////////////////////////////////////////////////////
app.get('/logout', function(req,res){
  req.session.destroy();
  res.send('logout success! <br/> <a href="/">volver</a>');

});



var port = process.env.PORT || 8080;
app.listen(port);
console.log("Server de sessions y autenticación escuchando por el puerto " + port);
