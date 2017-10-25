(function (d3, window) {
    'use strict';

    var chart;
    var vis;

    // Dimensions of the chart.
    var margin = {top: 20, right: 50, bottom: 30, left: 20};
    var width = 500 - margin.left - margin.right;
    var height = 300 - margin.top - margin.bottom;

    // Sets the ranges.
    var x = d3.scaleLinear().range([0, width]);
    var y = d3.scaleLinear().range([height, 0]);

    function init() {
        chart = d3.select('#overview').append('svg');
        vis = chart
          .attr("width", width + margin.left + margin.right)
          .attr("height", height + margin.top + margin.bottom)
          .append("g")
          .attr('class', 'grid')
          .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        ;

        // Adds the x-axis
        vis.append("g")
          .attr('class', 'x-axis')
          .attr('transform', 'translate(0,' + height + ')')
        ;

        // Adds the y-axis.
        vis.append("g")
          .attr('class', 'y-axis')
          .attr('transform', 'translate(' + width + ', 0)')
        ;

        d3.csv('data/everything.csv', update);
    }

    function update(data) {
        var pairs = data.reduce(groupBy.bind(null, 'year', 'popularity'), []);

        pairs = pairs.map(function (pair) {
            var sum = 0;
            var n = 0;

            for (var i in pair.values) {
                var value = pair.values[i];

                if (value === '') {
                    continue;
                }

                sum += +pair.values[i];
                n++;
            }

            return {year: pair.x, popularity: sum / n}
        });

        pairs = pairs.filter(function (pair) {
            if (pair.year) {
                return true;
            }

            return false;
        });

        // Scale the range of the data
        x.domain(d3.extent(pairs, function(d) { return d.year; }));
        y.domain([
            d3.min(pairs, function(d) { return d.popularity - 2; }),
            d3.max(pairs, function(d) { return d.popularity + 2; })
        ]);

        // define the line
        var valueLine = d3.line()
            .x(function(d) { return x(d.year); })
            .y(function(d) { return y(d.popularity); })
        ;

        vis
            .append('path')
            .datum(pairs)
            .attr('class', 'line')
            .attr('d', valueLine)
        ;

        // Update the x-axis.
        chart.selectAll('.x-axis')
          .attr("transform", "translate(0," + height + ")")
          .call(d3.axisBottom(x))
        ;

        // Update the y-axis.
        chart.selectAll('.y-axis')
          .call(d3.axisRight(y).ticks(5))
        ;
    }

    // Adds a row to groups based on x and y attributes.
    function groupBy(x, y, groups, row) {
        for (var i in groups) {
          if (groups[i].x === row[x]) {
            groups[i].values.push(row[y]);

            return groups;
          }
        }

        groups.push({x: row[x], values: []});

        return groups;
    }

    init();

    return;




    // set the dimensions and margins of the graph
    var margin = {top: 20, right: 20, bottom: 30, left: 50},
        width = 960 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

    // parse the date / time
    var parseTime = d3.timeParse("%d-%b-%y");

    // set the ranges
    var x = d3.scaleTime().range([0, width]);
    var y = d3.scaleLinear().range([height, 0]);

    // Scale the range of the data
    x.domain(d3.extent(data, function(d) { return d.date; }));
    y.domain([0, d3.max(data, function(d) { return d.close; })]);

    // define the line
    var valueline = d3.line()
        .x(function(d) { return x(d.date); })
        .y(function(d) { return y(d.close); });

    // append the svg obgect to the body of the page
    // appends a 'group' element to 'svg'
    // moves the 'group' element to the top left margin
    var svg = d3.select("body").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform",
              "translate(" + margin.left + "," + margin.top + ")");

    // Get the data
    d3.csv("data/everything.csv", function(error, data) {
      if (error) throw error;

      // format the data
      data.forEach(function(d) {
          d.date = parseTime(d.date);
          d.close = +d.close;
      });

      // Scale the range of the data
      x.domain(d3.extent(data, function(d) { return d.date; }));
      y.domain([0, d3.max(data, function(d) { return d.close; })]);

      // Add the valueline path.
      svg.append("path")
          .data([data])
          .attr("class", "line")
          .attr("d", valueline);

      // Add the X Axis
      svg.append("g")
          .attr("transform", "translate(0," + height + ")")
          .call(d3.axisBottom(x));

      // Add the Y Axis
      svg.append("g")
          .call(d3.axisLeft(y));

    });

})(d3, window);