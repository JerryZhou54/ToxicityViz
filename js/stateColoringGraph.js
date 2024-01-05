StateColorGraph = function(_chart_id, _parentWidth, _parentHeight){
	this.parentWidth = _parentWidth;
	this.parentHeight = _parentHeight;
	this.chart_id = _chart_id;
	this.initVis()
      }

StateColorGraph.prototype.initVis = function(){
    var vis = this;
    console.log('initializing '+vis.chart_id)

    vis.margin = {
        top: -50,
        right: (vis.parentWidth*(1/10)),
        bottom: (vis.parentHeight*(1/10)),
        left: (vis.parentWidth*(1/10))
    };

    vis.width = vis.parentWidth - vis.margin.right - vis.margin.left
    vis.height = vis.parentHeight - vis.margin.top - vis.margin.bottom

    //vis.path = d3.geoPath();

    /////////////////////////////////////////////////////////////////
    // section adapted from source: http://bl.ocks.org/michellechandra/0b2ce4923dc9b5809922
    // D3 Projection
    vis.projection = d3.geoAlbersUsa()
    .translate([vis.width/2, vis.height/2])    // translate to center of screen
    .scale([1000]);          // scale things down so see entire US

    // Define path generator
    vis.path = d3.geoPath()               // path generator that will convert GeoJSON to SVG paths
    .projection(vis.projection);  // tell path generator to use albersUsa projection
    /////////////////////////////////////////////////////////////////


    vis.svg = d3.select(vis.chart_id)
                .append('svg')
                .attr('id', 'country-svg')
                .attr('width', vis.parentWidth)
                .attr('height', vis.parentHeight)
                .on("click", function() {
                    handleClick(null, null)
                })
    vis.g = vis.svg
               .append('g')
               .attr('id', 'country-g')
               .attr('transform', 'translate('+vis.margin.left+', '+vis.margin.top+')');

    vis.states_g = vis.g
               .append('g')
               .attr('id', 'states-g');

    vis.svg2 = d3.select("#in-state-stats-card")
                .append('svg')
                .attr('id', 'plot-svg')
                .attr('width', vis.parentWidth)
                .attr('height', vis.parentHeight)

    vis.svg2.append("g")
            .attr("id", "legend")
            .attr("transform", "translate("+vis.width+",80)") 

    vis.svg.append("g")
            .attr("id", "legend-main")
            .attr("transform", "translate(10,40)")

    vis.svg2.append("text")
            .text("Std_Toxicity")
            .attr("transform", "translate("+vis.width+",60)")
            .style("fill", "black")
            .style("font-size", "15px")
            .style("font_family", "sans-serif")

    vis.svg.append("text")
            .text("Avg_Toxicity")
            .attr("transform", "translate(10,30)")
            .style("fill", "black")
            .style("font-size", "15px")
            .style("font_family", "sans-serif")

    vis.state_tip = d3.tip()
            .attr("class", "d3-tip")
            .html(function(d){
                let text;
                for (const element of vis.average_toxicity) {
                    if (element.key == d.properties.name) {
                        avg_toxicity = element.value.avg_toxicity
                        count = element.value.count
                    }
                }
                text = "<strong>State:</strong> <span style='color:red'>" + d.properties.name + "</span><br>";
                text += "<strong>Avg Toxicity:</strong> <span style='color:red'>" + avg_toxicity + "</span><br>";
                text += "<strong>Total Tweets:</strong> <span style='color:red'>" + count + "</span><br>";
                return text
            });

    vis.hashtag_tip = d3.tip()
            .attr("class", "d3-tip")
            .html(function(d){
                let text;
                text = "<strong>Hashtag: #</strong> <span style='color:red'>" + d.key + "</span><br>";
                text += "<strong>Avg Toxicity:</strong> <span style='color:red'>" + d.value.avg_toxicity.toFixed(3) + "</span><br>";
                text += "<strong>Std Deviation:</strong> <span style='color:red'>" + d.value.std_toxicity.toFixed(3) + "</span><br>";
                text += "<strong>Total Tweets:</strong> <span style='color:red'>" + d.value.count + "</span><br>";
                return text
            });

    vis.svg.call(vis.state_tip)
    vis.svg.call(vis.hashtag_tip)
}

StateColorGraph.prototype.wrangleData = function(_data_geo, _state_data, _link_filter, _time_filter) {
    var vis = this;
    vis.category = _link_filter;
    vis.time_range = _time_filter;
    console.log('wrangling '+ vis.chart_id);

    //TODO: First filter data by time
    vis.average_toxicity = _state_data.filter(d => d.time.getTime() >= vis.time_range[0] && d.time.getTime() <= vis.time_range[1])

    vis.hashtags_data = vis.average_toxicity.filter(d => d.hashtags != "")

    if (vis.category == "all") {
	vis.average_toxicity = vis.average_toxicity.map(d => {
	   return {
	      state: d.state,
	      value: d.toxicity+d.severe_toxicity+d.obscene+d.identity_attack+d.insult+d.threat
	   }
	})
	vis.average_toxicity = d3.nest()
    .key(d => d.state)
    .rollup(function(v) { return {
            avg_toxicity: d3.mean(v, d => d.value),
            count: v.length
        }
    })
    .entries(vis.average_toxicity)

    vis.hashtags_data = vis.hashtags_data.map(d => {
        return {
            state: d.state,
            hashtags: d.hashtags,
            value: d.toxicity+d.severe_toxicity+d.obscene+d.identity_attack+d.insult+d.threat
        }
    })
    } else {
	vis.average_toxicity = d3.nest()
    .key(d => d.state)
    .rollup(function(v) { return {
        avg_toxicity: d3.mean(v, d => d[vis.category]),
        count: v.length
        }
    })
    .entries(vis.average_toxicity)
    
    vis.hashtags_data = vis.hashtags_data.map(d => {
        return {
            state: d.state,
            hashtags: d.hashtags,
            value: d[vis.category]
        }
    })
    }

    vis.map = _data_geo

    vis.land = topojson.feature(vis.map, vis.map.objects.states);

    vis.updateVis()
}

StateColorGraph.prototype.updateVis = function() {
   var vis = this;
   colorscale = d3.scaleQuantile()
	//.domain([0, 0.05])
	// Should we use a global domain or a comparative one?
   	.domain(d3.extent(vis.average_toxicity, d => d.value.avg_toxicity))
    .range(["lightsalmon", "orangered", "red", "darkred"])

   console.log("Updating" + vis.chart_id)
   //console.log(colorscale.domain())
   //draw country map
   vis.states_g.selectAll("path")
	.data(vis.land.features)
	.join(enter => enter.append("path")
		.attr("class", "land")
		.attr("d", vis.path)
		.style("fill", function(d) {
              for (var element of vis.average_toxicity) {
                  if (element.key == d.properties.name) {
                      return colorscale(element.value.avg_toxicity)
                  }
              }
		})
        .on("mouseover", function(d) {
            d3.select(this).style("opacity", 0.5)
            vis.state_tip.show(d)
        })
        .on("mouseout", function(d) {
            d3.select(this).style("opacity", 1)
            vis.state_tip.hide(d)
        })
        .on("click", function(d) {
            d3.event.stopPropagation()
            handleClick(d, vis)
        }),
	      update => update.style("fill", function(d) {
            for (var element of vis.average_toxicity) {
                if (element.key == d.properties.name) {
                    return colorscale(element.value.avg_toxicity)
                }
            }
	      })
	)

   // draw interior borders
   vis.states_g.append("path")
	.datum(topojson.mesh(vis.map, vis.map.objects.states, (a, b) => a !== b))
	.attr("class", "border interior")
	.attr("d", vis.path)

   // draw exterior borders
   vis.states_g.append("path")
       .datum(topojson.mesh(vis.map, vis.map.objects.states, (a, b) => a === b))
       .attr("class", "border exterior")
       .attr("d", vis.path);

    var legend_main = d3.legendColor()
       .labelFormat(d3.format(".3f"))
       .scale(colorscale)

    vis.svg.select("#legend-main")
       .call(legend_main)
}

function handleClick(d, vis) {
    if (d == null) {
        console.log("Closing")

        $("#level-filter").val("state-level")
        d3.select("#in-state-stats-card")
        .style("display", "none")
        return
    }

    d3.select("#plot-g").remove()

    vis.g1 = vis.svg2.append('g')
            .attr('id', 'plot-g')
            .attr('transform', 'translate('+vis.margin.left+', '+vis.margin.top+')');

    console.log("Opening")
    d3.select("#in-state-stats-card")
            .style("display", "block")

    $("#level-filter").on('change', function() {
        handleLevelChange(d, this.value, vis)
    })
    var state = d.properties.name
    var state_hashtags_data = vis.hashtags_data.filter(d => d.state == state)
    var hashtags_count = []
    state_hashtags_data.map(d => {
        d.hashtags.forEach(hashtag => {
            hashtags_count.push({
                hashtag: hashtag.trim().toLowerCase(),
                value: d.value
            })
        });
    })

    hashtags_count = d3.nest()
    .key(d => d.hashtag)
    .rollup(function(v) {
        return {
            count: v.length,
            avg_toxicity: d3.sum(v, d => d.value) / v.length,
            std_toxicity: d3.deviation(v, d => d.value)
        }
    })
    .entries(hashtags_count)
    .sort(function(x, y) {
        return d3.descending(x.value.count, y.value.count)
    })

   hashtags_count = hashtags_count.slice(0, 50)
   createStatsPlot(state, vis, hashtags_count)
}

function handleLevelChange(d, level, vis) {
    d3.select("#plot-g").remove()
    vis.g1 = vis.svg2
            .append('g')
            .attr('id', 'plot-g')
            .attr('transform', 'translate('+vis.margin.left+', '+vis.margin.top+')');

    d3.select("#in-state-stats-card")
            .style("display", "block")

    if (level == "state-level") {
        var state = d.properties.name
        var state_hashtags_data = vis.hashtags_data.filter(d => d.state == state)
        var threshold = 50
    } else {
        var state = "US"
        var state_hashtags_data = vis.hashtags_data
        var threshold = 100
    }
    
    var hashtags_count = []
    state_hashtags_data.map(d => {
        d.hashtags.forEach(hashtag => {
            hashtags_count.push({
                hashtag: hashtag.trim().toLowerCase(),
                value: d.value
            })
        });
    })

    hashtags_count = d3.nest()
    .key(d => d.hashtag)
    .rollup(function(v) {
        return {
            count: v.length,
            avg_toxicity: d3.sum(v, d => d.value) / v.length,
            std_toxicity: d3.deviation(v, d => d.value)
        }
    })
    .entries(hashtags_count)
    .sort(function(x, y) {
        return d3.descending(x.value.count, y.value.count)
    })

   hashtags_count = hashtags_count.slice(0, threshold)
   createStatsPlot(state, vis, hashtags_count)
}

function createStatsPlot(state, vis, hashtags_count) {
    console.log("Creating plot")
    formatDay = d3.timeFormat("%Y/%m/%d");
    var stdscale = d3.scaleQuantile()
    .domain(d3.extent(hashtags_count, d => d.value.std_toxicity))
    .range(["lightsalmon", "orangered", "red", "darkred"])

    d3.select("#in-state-title")
    .text("Trending hashtags in "+state+" from "+formatDay(vis.time_range[0])+" to "+formatDay(vis.time_range[1]) + " by " + vis.category)

    xaxis = d3.scaleSqrt()
            .domain([0, d3.max(hashtags_count, d => d.value.count)])
            .range([0, vis.width])

    yaxis = d3.scaleLinear()
            .domain([0, d3.max(hashtags_count, d => d.value.avg_toxicity)])
            .range([vis.height, 80])

    dot_size = d3.scaleLinear()
            .domain([0, d3.max(hashtags_count, d => d.value.std_toxicity)])
            .range([1.5, 8])

    vis.g1.append("g")
        .attr("transform", "translate(0," + vis.height + ")")
        .call(d3.axisBottom(xaxis))

    vis.g1.append("g")
        .call(d3.axisLeft(yaxis))

    vis.g1.append("text")
        .attr("id", "x_axis_label")
        .style("fill", "black")
        .style("font-size", "15px")
        .attr("x", 300)
        .attr("y", vis.height + 40)
        .text("Number of Tweets")

    vis.g1.append("text")
        .attr("id", "y_axis_label")
        .style("fill", "black")
        .style("font-size", "15px")
        .attr("transform", "rotate(-90)")
        .attr("x", -vis.height/2)
        .attr("y", -50)
        .text("Avg_Toxicity")

    vis.g1.append("g")
        .selectAll("dot")
        .data(hashtags_count)
        .enter()
        .append("circle")
        .attr("cx", function(d) { return xaxis(d.value.count)})
        .attr("cy", function(d) { return yaxis(d.value.avg_toxicity)})
        .attr("r", 8)
        .style("fill", function(d) { return stdscale(d.value.std_toxicity)})
        .on("mouseover", function(d) { vis.hashtag_tip.show(d)})
        .on("mouseout", function(d) { vis.hashtag_tip.hide(d)})

    var legend = d3.legendColor()
        .labelFormat(d3.format(".2f"))
        .scale(stdscale)

    vis.svg2.select("#legend")
        .call(legend)
    
    /**
    vis.g1.selectAll("text")
        .data(hashtags_count)
        .enter()
        .append("text")
        .text(function(d) {
            return d.key;
        })
        .attr("x", function(d) {
            return xaxis(d.value.count)+10;  // Returns scaled location of x
        })
        .attr("y", function(d) {
            return yaxis(d.value.avg_toxicity);  // Returns scaled circle y
        })
        .attr("font_family", "sans-serif")  // Font type
        .attr("font-size", "8px")  // Font size
        .attr("fill", "black")
        */
}