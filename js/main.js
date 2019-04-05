//Gundlach Activity 8
//run script on load
window.onload = setMap();

//function to create our desired map with dimensions
function setMap(){

	//map frame dimensions
    var width = 960,
        height = 460;

    //create new svg container for the map
    var map = d3.select("body")
        .append("svg")
        .attr("class", "map")
        .attr("width", width)
        .attr("height", height);

        //Example 2.1 line 15...create Albers equal area conic projection centered on France
    var projection = d3.geoAlbers()
        .center([0, 49.2])
        .rotate([-4, 0])
        .parallels([43, 62])
        .scale(1000)
        .translate([width / 2, height / 2]);

    var path = d3.geoPath()
        .projection(projection);

    //use Promise.all to parallelize asynchronous data loading
    var promises = [];
    promises.push(d3.csv("data/RenewableEnergyPotential.csv")); //load attributes from csv
    promises.push(d3.json("data/WorldCountries.topojson")); //load background spatial data
	promises.push(d3.json("data/EuropeCountries.topojson")); //load background spatial data
	Promise.all(promises).then(callback);

	function callback(data){
	csvData = data[0];
	world = data[1];
	europe = data[2];
        console.log(csvData);
        console.log(world.objects);
        console.log(europe.objects);
		//translate europe TopoJSON
        var worldCountries = topojson.feature(world, world.objects.ne_50m_admin_0_countries),
            europeCountries = topojson.feature(europe, europe.objects.EuropeCountries).features;

		//create graticule generator
        var graticule = d3.geoGraticule()
            .step([5, 5]); //place graticule lines every 5 degrees of longitude and latitude

		//create graticule background
        var gratBackground = map.append("path")
            .datum(graticule.outline()) //bind graticule background
            .attr("class", "gratBackground") //assign class for styling
            .attr("d", path) //project graticule

		//create graticule lines
        var gratLines = map.selectAll(".gratLines") //select graticule elements that will be created
            .data(graticule.lines()) //bind graticule lines to each element to be created
            .enter() //create an element for each datum
            .append("path") //append each element to the svg as a path element
            .attr("class", "gratLines") //assign class for styling
            .attr("d", path); //project graticule lines

		//add world countries to map
        var world = map.append("path")
            .datum(worldCountries)
            .attr("class", "world")
            .attr("d", path);

        //add europe countries to map
        var europe = map.selectAll(".europe")
            .data(europeCountries)
            .enter()
            .append("path")
            .attr("class", function(d){
                return "europe " + d.properties.adm1_code;
            })
            .attr("d", path);

    };
};
