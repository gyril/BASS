HOST = null;
PORT = 8088;
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
var exec = require('child_process').exec,
    child;

function extname (path) {
  var index = path.lastIndexOf(".");
  return index < 0 ? "" : path.substring(index);
}

function staticHandler(filename) {
  var body, headers;
  var content_type = extname(filename)=="json" ? "text/json" : "text/html";

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
		
		var script = 'python ts/run.py '+r1.mu+' '+r1.sigma+' '+r2.mu+' '+r2.sigma+' '+r3.mu+' '+r3.sigma+' '+r4.mu+' '+r4.sigma;
			
		child = exec(script,
		  function (error, stdout, stderr) {
			console.log(stdout);
			var rep = JSON.parse(stdout);
			console.log(rep);
			joueurs[res.g1] = rep.r1;
			joueurs[res.g2] = rep.r2;
			joueurs[res.p1] = rep.r3;
			joueurs[res.p2] = rep.r4;
			
			console.log(joueurs);
			fs.writeFile('joueurs.json', JSON.stringify(joueurs));
			
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
			matchs.push({"m":POST, "time":new Date()});
			fs.writeFile('matchs.json', JSON.stringify(matchs));
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
		(function () {
		  res.writeHead(200, { "Content-Type": "text/json"
			  , "Content-Length": JSON.stringify(matchs).length
			  });
		  res.end(JSON.stringify(matchs));
		})();
	});
};
getMap['/joueurs.json'] = function(req, res) {
	
	req.on('end', function () {
		(function () {
		  res.writeHead(200, { "Content-Type": "text/json"
			  , "Content-Length": JSON.stringify(joueurs).length
			  });
		  res.end(JSON.stringify(joueurs));
		})();
	});
};

var server = http.createServer(function(req, res) {
  if (req.method === "GET" || req.method === "POST" || req.method === "HEAD") {
    var handler = getMap[url.parse(req.url).pathname] || notFound;

    res.simpleText = function (code, body) {
      res.writeHead(code, { "Content-Type": "text/plain"
                          , "Content-Length": body.length
                          });
      res.end(body);
    };

    res.simpleJSON = function (code, obj) {
      var body = new Buffer(JSON.stringify(obj));
      res.writeHead(code, { "Content-Type": "text/json"
                          , "Content-Length": body.length
                          });
      res.end(body);
    };

    handler(req, res);
  }
});

server.listen(Number(process.env.PORT || PORT), HOST);