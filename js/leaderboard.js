/**
 * @author martin
 */


// create container

var container = d3.select(".container").append("svg:svg")
	.attr("width",800)
	.attr("height",600);


d3.json("joueurs.json", function(data) {

 // Prepare data
	
var classement = [];
	
	function compare(a, b) {
			return b[1] - a[1];
				}
				
	for(var i in data) {
			classement.push([i, Math.ceil(data[i]['mu'] - data[i]['sigma']*2)]);
				}
				
	var ranks = classement.sort(compare);
	

 // Append players & score
				
var playersContainer = container.selectAll("g")
		.data(ranks)
	.enter().append("svg:g")
	.attr("transform",function(d,i) {return "translate(20,"+(i*20 + 20)+")";});
	
	playersContainer.append("svg:text")
		.text(function(d) {return d[0];});
			});