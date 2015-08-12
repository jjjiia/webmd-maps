var width = 1000,
    height = 600;

var cluster = d3.layout.cluster()
    .size([height, width - 500]);

var diagonal = d3.svg.diagonal()
    .projection(function(d) { return [d.y, d.x]; });

$(function() {
	queue()
		.defer(d3.csv, "conditions_0.csv")
		.defer(d3.json, "url_tf.json")
		.defer(d3.json, "url_urls.json")
		.defer(d3.json, "url_title.json")
		.defer(d3.json, "tree.json")
		.await(dataDidLoad);
})

$("#topDifferences .hideTop").hide()

var global = {
	byD:{},
	byO:{},
	usPorts:null,
	foreignPorts:null
}


function dataDidLoad(error, conditions,tf,links,titles,tree) {

	//dropDown(conditions)
	var newtree = removeRootFromTree(tree)
	dropDown(conditions,tf,titles,newtree)
	//drawTree(tree,tf,titles)
}
function removeRootFromTree(root){
    var newDictionary = {}
    console.log(root.children.length)
    for(var i in root.children){
    	var subtree = root.children[i]
    	var mainLink = root.children[i].name
  	newDictionary[mainLink]=subtree
  	//drawTree(subtree)
  	//console.log(mainLink)
    }
	return newDictionary
}

function dropDown(conditions,tf,titles,tree){
	console.log(conditions)
	var dropDown = d3.select("#dropdown-container").append("select")
                    .attr("name", "conditions-list");

	var options = dropDown.selectAll("option")
			.data(conditions)
			.enter()
			.append("option");
	
	 options.text(function (d) {return d.title; })
	        .attr("value", function (d) { return d.url; });
			dropDown.on("change", function(){
			 menuChange(tree,tf,titles)	
			});
}

function menuChange(tree,tf,titles){
	var selectedValue = d3.event.target.value;
    var selectedIndex = d3.event.target.selectedIndex;
	console.log(selectedValue)
	console.log(tree[selectedValue])
	drawTree(tree[selectedValue],tf,titles)
}

function drawTree(root,tf,titles){
	console.log(root)
d3.select("#tree svg").remove()
var svg = d3.select("#tree").append("svg")
    .attr("width", width)
    .attr("height", height)
  .append("g")
    .attr("transform", "translate(100,0)");
	var nodes = cluster.nodes(root),
	    links = cluster.links(nodes);

	var link = svg.selectAll(".link")
	    .data(links)
	  .enter().append("path")
	    .attr("class", "link")
	    .attr("d", diagonal)
		.attr("fill","none")
		.attr("stroke",function(d){
			console.log(d.target)
			return "red"
		})
	var node = svg.selectAll(".node")
	    .data(nodes)
	  .enter().append("g")
	    .attr("class", "node")
	    .attr("transform", function(d) {console.log(d.depth); return "translate(" + d.y + "," + d.x + ")"; })
		.attr("fill",function(d){
			console.log(tf[d.name]);
			if(tf[d.name]=="True"){
				return "red"
			}
			return "black"
		})
	node.append("circle")
	    .attr("r", 4.5);

	node.append("text")
	    .attr("dx", function(d) { return d.children ? -8 : 8; })
	    .attr("dy", 3)
		.attr("fill",function(d){
			console.log(tf[d.name]);
			if(tf[d.name]=="True"){
				return "red"
			}
			return "black"
		})
	    .style("text-anchor", function(d) { return d.children ? "end" : "start"; })
	    .text(function(d) { return titles[d.name]; });
}
function drawConditions(conditions,tf,links,titles){
	//console.log(tf)	
	svg.selectAll("text")
		.data(conditions)
		.enter()
		.append("text")
		.attr("x",20)
		.attr("y",function(d,i){return i*12})
		.text(function(d,i){
			//console.log(d.title)
			return i+" "+d.title
		})
		.attr("fill",function(d){
			if(tf[d.url]=="True"){
				return "red"
			}
			else{
				return "black"
			}
		})
		.attr("class","conditions")
		.on("click",function(d){
			//console.log(tf[d.url])
			var jsonData = formatGraphData(d.url,tf,links,titles)
			drawGraph(jsonData)
		})
}
function repeated(originalUrl,array,tf,urls,titles,nodes,links,loop){
	var newarray = []
		nodes.push({"name":originalUrl,"group":tf[array[i]]})
		for(var i in array){
			nodes.push({"name":array[i],"group":tf[array[i]]})
			links.push({"source":originalUrl,"target":array[i],"value":loop})
			newarray.push(urls[array[i]])
		}
		repeated(newarray)
	
}
function formatGraphData(url,tf,urls,titles){
	var level1 = urls[url]
	var links = []
	var nodes = []
	nodes.push({"name":url,"group":tf[url]})
	var loop = 0
	repeated(url,level1,tf,urls,titles,nodes,links,loop+1)
	//level3 = repeated(url,level2,tf,urls,titles,nodes,links,loop+2)
	//level4 = repeated(url,level3,tf,urls,titles,nodes,links,loop+3)
	var jsonData = {"nodes":nodes,"links":links}
	drawGraph(jsonData)
	return jsonData
}
function drawGraph(graph,tf){
	
	var edges = [];
    graph.links.forEach(function(e) { 
	    var sourceNode = graph.nodes.filter(function(n) { return n.name === e.source; })[0],
	    targetNode = graph.nodes.filter(function(n) { return n.name === e.target; })[0];
	    edges.push({source: sourceNode, target: targetNode, value: e.value});
    });	
		
		
	var force = d3.layout.force()
	    .charge(-120)
	    .linkDistance(10)
	    .size([600,600]);
	
	force.nodes(graph.nodes)
	      .links(edges)
	      .start();

	  var link = map.selectAll(".link")
	      .data(edges)
	      .enter().append("line")
	      .attr("class", "link")
	      .style("stroke-width", function(d) {
			  return 2; return Math.sqrt(d.value); });

	  var node = map.selectAll(".node")
	      .data(graph.nodes)
	      .enter().append("circle")
	      .attr("class", "node")
	      .attr("r", 5)
	      .style("fill", function(d) { console.log(d);
			  if(d.group == "False"){
			  	return "black"
			  }else{
				  return "red"; 			  	
			  }
		  })
	      .call(force.drag);

	  node.append("title")
	      .text(function(d) { return d.name; });

	  force.on("tick", function() {
	    link.attr("x1", function(d) { return d.source.x; })
	        .attr("y1", function(d) { return d.source.y; })
	        .attr("x2", function(d) { return d.target.x; })
	        .attr("y2", function(d) { return d.target.y; });

	    node.attr("cx", function(d) { return d.x; })
	        .attr("cy", function(d) { return d.y; });
	});
}


