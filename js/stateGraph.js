

StateGraph = function(_chart_id, _parentWidth, _parentHeight){
    this.parentWidth = _parentWidth;
    this.parentHeight = _parentHeight;
    this.chart_id = _chart_id;
    this.initVis()
  }


StateGraph.prototype.initVis = function(){
    var vis = this;
    console.log('initializing '+vis.chart_id)

    vis.margin = {
        top: (vis.parentHeight*(1/10)),
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
                    .attr('height', vis.parentHeight);
    vis.g = vis.svg
               .append('g')
               .attr('id', 'country-g')
               .attr('transform', 'translate('+vis.margin.left+', '+vis.margin.top+')');

    vis.states_g = vis.g
               .append('g')
               .attr('id', 'states-g');

    vis.link_g = vis.g
                    .append('g')
                    .attr('id', 'link-g');

    vis.node_g = vis.g
                    .append('g')
                    .attr('id', 'node-g');

    // defines the arrow marker shapes
    vis.svg.append("defs").selectAll("marker")
            .data(["triangle"])
            .enter()
                .append("marker")
                .attr("id", function(d) { return d; })
                .attr("viewBox", "0 0 10 10")
                .attr("refX", 16)
                .attr("refY", 5)//5
                .attr("markerWidth", 6)
                .attr("markerHeight", 6)
                .attr("orient", "auto")
                    .append("path")
                    .attr("d", "M 0 0 L 10 5 L 0 10 z");

    vis.tip_links = d3.tip()
                .attr("class", "d3-tip")
                //.direction(d => d.properties.name == 'Antarctica'?'n':'s')
                .html(function(d){
                    //const r = vis.data_hashed.get(d.properties.name);
                    let text;
                    text = "<strong>Origin State:</strong> <span style='color:red'>" + d.from + "</span><br>";
                    text += "<strong>Destination State:</strong> <span style='color:red'>" + d.to + "</span><br>";
                    text += "<strong>Total Count</strong> <span style='color:red'>" + d.count + "</span><br>";
                    return text
                });

    vis.tip_nodes = d3.tip()
                    .attr("class", "d3-tip")
                    .html(function(d){
                        //const r = vis.data_hashed.get(d.properties.name);
                        let text;
                        text = "<strong>State:</strong> <span style='color:red'>" + d.feature.properties.name + "</span><br>"
                        text += "<strong>Reference Accumulation:</strong> <span style='color:red'>" + d.weight + "</span><br>";
                        return text
                    });

    vis.svg.call(vis.tip_links);
    vis.svg.call(vis.tip_nodes);

}



StateGraph.prototype.wrangleData = function(_data_geo, _data_links, _link_filter){
    var vis = this;
    console.log('wrangling '+ vis.chart_id);

    vis.map = _data_geo

    vis.land = topojson.feature(vis.map, vis.map.objects.states);

    //draw circles on states
    vis.nodes = {},
    vis.links = [];

    vis.land.features.forEach((d, i) => {
        //console.log(d);
        //console.log(i);
        let centroid = vis.path.centroid(d);
        //console.log(centroid);
        if (!Object.is(centroid[0], NaN)){
            let node_entry = {}
            node_entry.x = centroid[0]
            node_entry.y = centroid[1];
            node_entry.feature = d;
            node_entry.weight = 0;
            //vis.nodes.push(centroid);
            vis.nodes[d.properties.name] = node_entry;
        }
        else {
            console.log(`excluding region: ${d.properties.name}`);
        }
    });

    console.log('testing nodes')
    console.log(vis.nodes)
    console.log(Object.values(vis.nodes))


    //vis.nodes_hashed = d3.map(vis.nodes, d => d.feature.properties.name)
    //   console.log('nodes hashed')
    //   console.log(vis.nodes_hashed)
    //   console.log('test look up for Texas')
    //   console.log(vis.nodes_hashed.get('Texas'))
    vis.data_links = _.cloneDeep(_data_links);
    if (_link_filter == 'exclude circular'){
        vis.data_links_filtered = vis.data_links.filter(d => d.from !== d.to);
    }

    else {
        vis.data_links_filtered = vis.data_links
    }

    vis.links = []
    vis.data_links_filtered.slice(0, 40).map(d => {
        //if (vis.nodes_hashed.has(d.from) && vis.nodes_hashed.has(d.to)) {
        if (vis.nodes.hasOwnProperty(d.from) && vis.nodes.hasOwnProperty(d.to)) {
            vis.nodes[d.to].weight += d.count
            d.source = {}
            d.target = {}
            d.source.x = vis.nodes[d.from].x;
            d.source.y = vis.nodes[d.from].y;
            d.target.x = vis.nodes[d.to].x;
            d.target.y = vis.nodes[d.to].y;
            const dx = d.source.x - d.target.x,
                  dy = d.source.y - d.target.y;
            d.distance = Math.sqrt(dx * dx + dy * dy);
            vis.links.push(d);}
    })

    console.log('testing links')
    console.log(vis.links)
    vis.updateVis();

};


StateGraph.prototype.updateVis = function(){
    var vis = this;
    console.log('updating '+vis.chart_id);

    vis.color_scale = d3.scaleSequential()
                        .domain(d3.extent(vis.links, d=>d.count))
                        .interpolator(d3.interpolateYlGn);

    vis.node_scale = d3.scaleSqrt()
                       .domain(d3.extent(Object.values(vis.nodes), d=>d.weight))
                       .range([0, 30]);

    console.log(`test color scale: ${vis.color_scale(3000)}`)

    //draw country map
    vis.states_g.append("path")
         .datum(vis.land)
         .attr("class", "land")
         .attr("d", vis.path);

    // draw interior borders
    vis.states_g.append("path")
         .datum(topojson.mesh(vis.map, vis.map.objects.states, (a, b) => a !== b))
         .attr("class", "border interior")
         .attr("d", vis.path);

    // draw exterior borders
    vis.states_g.append("path")
        .datum(topojson.mesh(vis.map, vis.map.objects.states, (a, b) => a === b))
        .attr("class", "border exterior")
        .attr("d", vis.path);


    vis.link_g.selectAll(".state-edge")
       .data(vis.links)
       .join(enter => enter.append("path")
                           .attr('class', 'state-edge')
                           .attr("d", function(d) {
                               let line_path;
                               if (d.from === d.to) {
                                    line_path = "M" +
                                                d.source.x + "," +
                                                d.source.y + "A" +
                                                30 + "," + 20 + " -45,1,0 " +
                                                (d.target.x+1) + "," +
                                                (d.target.y+1)

                                }
                                else {

                                    line_path = "M" +
                                                d.source.x + "," +
                                                d.source.y + " L " +
                                                d.target.x + "," +
                                                d.target.y;
                                };

                                return line_path;

                            })
                            .attr("marker-end", d => d.from !== d.to ? "url(#triangle)": "")
                            .attr("stroke", d => vis.color_scale(d.count))
                            .on("mouseover", d => {
                                //vis.tip.show(d, d3.select("#legend").node());
                                vis.tip_links.show(d)
                            })
                            .on('mouseout', d => {
                                vis.tip_links.hide(d)
                            }),
            update => update.attr("d", function(d) {
                let line_path;
                if (d.from === d.to) {
                     line_path = "M" +
                                 d.source.x + "," +
                                 d.source.y + "A" +
                                 30 + "," + 20 + " -45,1,0 " +
                                 (d.target.x+1) + "," +
                                 (d.target.y+1)

                 }
                 else {

                     line_path = "M" +
                                 d.source.x + "," +
                                 d.source.y + " L " +
                                 d.target.x + "," +
                                 d.target.y;
                 };

                 return line_path;

             })
             .attr("marker-end", d => d.from !== d.to ? "url(#triangle)": "")
             .style("stroke", d => vis.color_scale(d.count)),
            exit => exit.remove()
       );


    vis.node_g.selectAll(".state-node")
        .data(Object.values(vis.nodes))
        .join(enter => enter.append("circle")
                            .attr('class', 'state-node')
                            .attr("cx", function(d) {if(Object.is(d.x, NaN)) {console.log(d)} return d.x; })
                            .attr("cy", function(d) { return d.y; })
                            .attr("r", d => vis.node_scale(d.weight))
                            .on("mouseover", d => {
                                //vis.tip.show(d, d3.select("#legend").node());
                                let related_nodes = new Set()
                                related_nodes.add(d.feature.properties.name)
                                vis.tip_nodes.show(d)
                                d3.selectAll('.state-edge')
                                  .style('opacity', d_e=> {
                                      const name = d.feature.properties.name
                                      let set_opacity;
                                      if (d_e.to === name || d_e.from == name){
                                          set_opacity = 1
                                          d_e.to !== name ? related_nodes.add(d_e.to) : related_nodes.add(d_e.from);
                                      }
                                      else {
                                          set_opacity = 0
                                      }
                                      return set_opacity//return d_e.to === name || d_e.from == name ? 1 : 0.1
                                  })
                                d3.selectAll('.state-node')
                                  .style('opacity', d_n=> {
                                      return related_nodes.has(d_n.feature.properties.name) ? 0.3 : 0
                                  })
                            })
                            .on('mouseout', d => {
                                vis.tip_nodes.hide(d)
                                d3.selectAll('.state-edge')
                                  .style('opacity', 1)
                                d3.selectAll('.state-node')
                                  .style('opacity', 0.3)
                            }),
             update => update.attr("cx", function(d) {if(Object.is(d.x, NaN)) {console.log(d)} return d.x; })
                             .attr("cy", function(d) { return d.y; })
                             .attr("r", d => vis.node_scale(d.weight)),
             exit => exit.remove()
        )


    vis.node_g.selectAll(".state-node")
        .data(Object.values(vis.nodes))
        .join(enter => enter.append("circle")
                            .attr('class', 'state-node')
                            .attr("cx", function(d) {if(Object.is(d.x, NaN)) {console.log(d)} return d.x; })
                            .attr("cy", function(d) { return d.y; })
                            .attr("r", d => vis.node_scale(d.weight))
                            .on("mouseover", d => {
                                //vis.tip.show(d, d3.select("#legend").node());
                                vis.tip_nodes.show(d)
                                d3.selectAll('.state-edge')
                                  .style('opacity', d_e=> {
                                      const name = d.feature.properties.name
                                      return d_e.to === name || d_e.from == name ? 1 : 0.1
                                  })
                            })
                            .on('mouseout', d => {
                                vis.tip_nodes.hide(d)
                                d3.selectAll('.state-edge')
                                  .style('opacity', 1)
                            }),
             update => update.attr("cx", function(d) {if(Object.is(d.x, NaN)) {console.log(d)} return d.x; })
                             .attr("cy", function(d) { return d.y; })
                             .attr("r", d => vis.node_scale(d.weight)),
             exit => exit.remove()
        )

};