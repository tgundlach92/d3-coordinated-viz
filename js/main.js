//Gundlach Activity 9
(function(){

//Global Variables
var attrArray = ["Solar", "Wind", "Tidal", "Nuclear", "Geothermal"];
var expressed = attrArray[0];
//run script on load
window.onload = setMap();

//function to create our desired map with dimensions
function setMap(){
    //map fram size
    var width = window.innerWidth * 0.5,
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

        setGraticule(map, path);
		//translate europe TopoJSON
        var worldCountries = topojson.feature(world, world.objects.ne_50m_admin_0_countries),
            europeCountries = topojson.feature(europe, europe.objects.EuropeCountries).features;

        var world = map.append("path")
            .datum(worldCountries)
            .attr("class", "world")
            .attr("d", path),

            europeCountries = joinData(europeCountries, csvData);


        var colorScale = makeColorScale(csvData);

            setEnumerationUnits(europeCountries, map, path, colorScale);

            setChart(csvData, colorScale);
        };
    }; //endofsetmap
function setGraticule(map, path){

        var graticule = d3.geoGraticule()
            .step([5,5]);

        var gratBackground = map.append("path")
            .datum(graticule.outline())
            .attr("class", "gratBackground")
            .attr("d", path)

        var gratLines = map.selectAll(".gratLines") //select graticule elements that will be created
            .data(graticule.lines()) //bind graticule lines to each element to be created
            .enter() //create an element for each datum
            .append("path") //append each element to the svg as a path element
            .attr("class", "gratLines") //assign class for styling
            .attr("d", path); //project graticule lines
};

function joinData(europeCountries, csvData){


        for (var i=0; i<csvData.length; i++){
            var csvRegion = csvData[i]; //the current region
            var csvKey = csvRegion.name_topo; //the CSV primary key

        //loop through geojson regions to find correct region
          for (var a=0; a<europeCountries.length; a++){

              var geojsonProps = europeCountries[a].properties; //the current region geojson properties
              var geojsonKey = geojsonProps.admin; //the geojson primary key

            //where primary keys match, transfer csv data to geojson properties object
              if (geojsonKey == csvKey){

                //assign all attributes and values
                attrArray.forEach(function(attr){
                    var val = parseFloat(csvRegion[attr]); //get csv attribute value
                    geojsonProps[attr] = val; //assign attribute and value to geojson properties
                });
            };
        };
    };
    return europeCountries;
};

function setEnumerationUnits(europeCountries, map, path, colorScale){
//add europe countries to map
  var europe = map.selectAll(".europe")
      .data(europeCountries)
      .enter()
      .append("path")
      .attr("class", function(d){
          return "europe " + d.properties.jiu;
      })
      .attr("d", path)
      .style("fill", function(d){
          return choropleth(d.properties, colorScale);
      });
};

//function to create color scale generator
function makeColorScale(data){

    var colorClasses = [
        "#001320",
        "#00223a",
        "#003153",
        "#00406d",
        "#004f86"
    ];

//create color scale generator
    var colorScale = d3.scaleThreshold()
        .range(colorClasses);

//build array of all values of the expressed attribute
    var domainArray = [];
    for (var i=0; i<data.length; i++){
      var val = parseFloat(data[i][expressed]);
        domainArray.push(val);
    };

//cluster data using ckmeans clustering algorithm to create natural breaks
    var clusters = ss.ckmeans(domainArray, 5);
//reset domain array to cluster minimums
        domainArray = clusters.map(function(d){
    return d3.min(d);
    });
//remove first value from domain array to create class breakpoints
    domainArray.shift();

//assign array of last 4 cluster minimums as domain
    colorScale.domain(domainArray);

    return colorScale;
};

//function to create coordinated bar chart
function setChart(csvData, colorScale){
//chart frame dimensions
    var chartWidth = window.innerWidth * 0.425,
        chartHeight = 473,
        leftPadding = 45,
        rightPadding = 2,
        topBottomPadding = 5,
        chartInnerWidth = chartWidth - leftPadding - rightPadding,
        chartInnerHeight = chartHeight - topBottomPadding * 2,
        translate = "translate(" + leftPadding + "," + topBottomPadding + ")";

//create a second svg element to hold the bar chart
    var chart = d3.select("body")
        .append("svg")
        .attr("width", chartWidth)
        .attr("height", chartHeight)
        .attr("class", "chart");

//create a rectangle for chart background fill
    var chartBackground = chart.append("rect")
        .attr("class", "chartBackground")
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);

//create a scale to size bars proportionally to frame and for axis
    var yScale = d3.scaleLinear()
        .range([463, 0])
        .domain([0, 90000000]);

//set bars for each province
    var bars = chart.selectAll(".bar")
        .data(csvData)
        .enter()
        .append("rect")
        .sort(function(a, b){
            return b[expressed]-a[expressed];
        })
        .attr("class", function(d){
            return "bar " + d.name_topo;
        })
        .attr("width", chartInnerWidth / csvData.length - 1)
        .attr("x", function(d, i){
            return i * (chartInnerWidth / csvData.length) + leftPadding;
        })
        .attr("height", function(d, i){
            return 463 - yScale(parseFloat(d[expressed]));
        })
        .attr("y", function(d, i){
            return yScale(parseFloat(d[expressed])) + topBottomPadding;
        })
        .style("fill", function(d){
            return choropleth(d, colorScale);
        });

//create a text element for the chart title
    var chartTitle = chart.append("text")
        .attr("x", 67)
        .attr("y", 30)
        .attr("class", "chartTitle")
        .text("MW (Energy Production Potential)" + expressed + " in each region");

//create vertical axis generator
    var yAxis = d3.axisLeft()
        .scale(yScale);

//place axis
    var axis = chart.append("g")
        .attr("class", "axis")
        .attr("transform", translate)
        .call(yAxis);

//create frame for chart border
    var chartFrame = chart.append("rect")
        .attr("class", "chartFrame")
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);
    };


//function to test for data value and return color
function choropleth(props, colorScale){
//make sure attribute value is a number
    var val = parseFloat(props[expressed]);
//if attribute value exists, assign a color; otherwise assign gray
    if (typeof val == 'number' && !isNaN(val)){
        return colorScale(val);
    } else {
        return "#FFFFFF";
    };
};


})(); //last line of main.js
