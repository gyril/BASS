HOST = null;
PORT = 8765;
DEBUG = false;
var NOT_FOUND = "Uh oh -- no file found...\n";

function notFound(req, res) {
  res.writeHead(404, { "Content-Type": "text/plain"
                     , "Content-Length": NOT_FOUND.length
                     });
  res.end(NOT_FOUND);
}

var starttime = (new Date()).getTime();

var url = require("url");
var http = require("http");
var util = require("util");
var qs = require("querystring");
var fs = require("fs");
var readFile = fs.readFile;
var joueurs = require('./joueurs.json');
var matchs = require('./matchs.json');
var historique = require('./historique.json');
var exec = require('child_process').exec,
    child;

function extname (path) {
  var index = path.lastIndexOf(".");
  return index < 0 ? "" : path.substring(index);
}

function mimeType(file) {
	switch(extname(file)) {
		case ".json":
			return "text/json";
			break;		
		case ".js":
			return "text/javascript";
			break;
		case ".html":
			return "text/html";
			break;
		default:
			return "text/plain";
			break;
	}
}

function staticHandler(filename) {
  var body, headers;
  var content_type = mimeType(filename);

  function loadResponseData(callback) {
    if (body && headers && !DEBUG) {
      callback();
      return;
    }

    util.puts("loading " + filename + "...");
    readFile(filename, function (err, data) {
      if (err) {
        util.puts("Error loading " + filename);
      } else {
        body = data;
        headers = { "Content-Type": content_type
                  , "Content-Length": body.length
                  };
        if (!DEBUG) headers["Cache-Control"] = "public";
        util.puts("static file " + filename + " loaded");
        callback();
      }
    });
  }

  return function (req, res) {
    loadResponseData(function () {
      res.writeHead(200, headers);
      res.end(req.method === "HEAD" ? "" : body);
    });
  }
};

function updateSkill (res) {
	var r1 = joueurs[res.g1],
		r2 = joueurs[res.g2],
		r3 = joueurs[res.p1],
		r4 = joueurs[res.p2];
		
		if(typeof r1 == "undefined" || typeof r2 == "undefined" || typeof r3 == "undefined" || typeof r4 == "undefined")
			return;
			
		//ajout du dernier match
		matchs.push({"m":res, "time":new Date(), "id":matchs.length});
		
		//update de l'historique
		function hist(joueur, score) {
			try {
				historique[joueur].push(score);
			} catch(e) {
				historique[joueur] = [score];
			}
		}
		hist(res.g1, r1);
		hist(res.g2, r2);
		hist(res.p1, r3);
		hist(res.p2, r4);
		
		var script = 'python ts/run.py '+r1.mu+' '+r1.sigma+' '+r2.mu+' '+r2.sigma+' '+r3.mu+' '+r3.sigma+' '+r4.mu+' '+r4.sigma;
			
		child = exec(script,
		  function (error, stdout, stderr) {
			console.log(stdout);
			var rep = JSON.parse(stdout);
			console.log(rep);
			
			
			// modification de l'objet "joueurs"
			joueurs[res.g1] = rep.r1;
			joueurs[res.g2] = rep.r2;
			joueurs[res.p1] = rep.r3;
			joueurs[res.p2] = rep.r4;
			
			console.log(joueurs);
			
			//écrasement des fichiers JSON avec les objets actualisés
			fs.writeFile('matchs.json', JSON.stringify(matchs));
			fs.writeFile('joueurs.json', JSON.stringify(joueurs));
			fs.writeFile('historique.json', JSON.stringify(historique));
			
			if (error !== null) {
			  console.log('exec error: ' + error);
			}
		});
	
}

var getMap = {};

getMap['/submit.html'] = function (req, res) {
	console.log(req.method);
	
	if(req.method == "POST") {
		var body = '';
		req.on('data', function (data) {
			body += data;
		});
		req.on('end', function () {
			var POST = qs.parse(body);
			console.log(joueurs);
			
			//historisation du fichier joueurs.json avant toute modif
			fs.writeFile('joueurs/joueurs.'+matchs.length+'.json', JSON.stringify(joueurs));
			
			//update des BASS
			updateSkill(POST);
			
			(function (code, body) {
			  res.writeHead(code, { "Content-Type": "text/html"
								  , "Content-Length": body.length
								  });
			  res.end(body);
			})(200, '<html><body>Merci<br><a href="resultat.html">Retour</a><br><a href="classement.html">Classement</a></body></html>');
		});
	}
	return;
};

getMap['/resultat.html'] = staticHandler("resultat.html");

getMap['/classement.html'] = staticHandler("classement.html");

getMap['/matchs.json'] = function(req, res) {
	
	req.on('end', function () {
		res.writeHead(200, { "Content-Type": "text/json"
			  , "Content-Length": JSON.stringify(matchs).length
			  });
		res.end(JSON.stringify(matchs));
	});
};

getMap['/joueurs.json'] = function(req, res) {
	var body;
	
	if(req.url.indexOf("?")>-1) {
		var ver = req.url.split("?")[1];
		console.log("loading joueurs."+ver+".json");
		var j = loadJSON("./joueurs/joueurs."+ver+".json");
		body = JSON.stringify(j);
	} else {
		body = JSON.stringify(joueurs)
	}
	
	req.on('end', function () {
		res.writeHead(200, { "Content-Type": "text/json"
			  , "Content-Length": body.length
			  });
		res.end(body);
	});
};

function loadJSON(file) {
	return fs.existsSync(file) ? require(file) : {};
}

var server = http.createServer(function(req, res) {
  if (req.method === "GET" || req.method === "POST" || req.method === "HEAD") {
    var handler = getMap[url.parse(req.url).pathname] || notFound;

    handler(req, res);
  }
});

server.listen(Number(process.env.PORT || PORT), HOST);