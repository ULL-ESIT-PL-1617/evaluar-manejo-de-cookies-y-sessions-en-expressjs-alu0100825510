var fs = require('fs');
var bcrypt = require('bcrypt-nodejs');
var salt = bcrypt.genSaltSync(10);
const express = require('express');
var router = express.Router();

module.exports = function(passwordFile, pathToProtect) {
  if (!fs.existsSync(passwordFile)) fs.writeFileSync('./users.json', '[]');

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
  router.use('/content', 
    auth, // middleware!
    express.static(pathToProtect));

  router.get('/', function(req,res){
    res.render('index');
  });

  //Fase de login ////////////////////////////////////////////////////////////////
  router.get('/login', function (req, res) {
    if ( (!req.session.username)) {
      res.render('formulariologin');
    }
    else if ((req.session.username)) {
      res.render('logincompleto', {username:req.session.username});
    }
  });

  router.post('/login', function(req,res){
    var configFile = fs.readFileSync(passwordFile);
    var config = JSON.parse(configFile);

    let u = config.find((user) => user.username == req.body.username);
    if (u && (u !== -1)) {
      if ((req.session) && req.body && req.body.password && (bcrypt.compareSync(req.body.password, u.password))){
        req.session.username = req.body.username;
        req.session.password = req.body.password;
        req.session.admin = true;
        return res.render('logincompleto', {username:req.session.username});
      } 
    }
    else
     return res.render('errorlogin');
  });

  //Fase de registro /////////////////////////////////////////////////////////////
  router.get('/register', function (req, res) {
    if ((!req.session.username)) {
      res.render('formularioregistro');
    }
    else{
      res.render('logincompleto', {username:req.session.username});
    }
  });

  router.post('/register', function (req, res) {

    var configFile = fs.readFileSync(passwordFile);
    var config = JSON.parse(configFile);
    var index = config.findIndex((i) => {
      return  (i.username == req.body.username);
    });
    var newUser = {"username" : req.body.username, "password" : bcrypt.hashSync(req.body.password, salt) };
    if (index == -1) config.push(newUser);
    else return res.render('errorregister', newUser);
    var configJSON = JSON.stringify(config);
    fs.writeFileSync(passwordFile, configJSON);
    res.render('registrado', {username:req.body.username});

  });

  //Cerrar sesion ////////////////////////////////////////////////////////////////
  router.get('/logout', function(req,res){
    req.session.destroy();
    res.send('logout success! <br/> <a href="/">volver</a>');

  });
  return router;
};

