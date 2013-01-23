/**
 * @author martin
 */


// create container

var container = d3.select(".container").append("svg:svg")
	.attr("width",800)
	.attr("height",600);


d3.json("joueurs.json",function(data) { 
	
// prepare data

var playersData = d3.nest().key(function(d) {return d.player}).entries(data);
	
var playersContainer = container.selectAll("g")
		.data(playersData)
	.enter().append("svg:g")
	.attr("transform",function(d,i) {return "translate(20,"+i*20+")";});
	
playersContainer.append("svg:text")
	.text(function(d) {return d.key;});


});
