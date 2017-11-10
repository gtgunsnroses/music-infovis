(function (d3, w) {
    'use strict';

    var repo = w.repository('data/everything.csv');

    var chart;
    var vis;

    // Dimensions of the chart.
    var margin = {top: 20, right: 50, bottom: 30, left: 20};
    var width = 500 - margin.left - margin.right;
    var height = 300 - margin.top - margin.bottom;

    // Sets the ranges.
    var x = d3.scaleLinear().range([0, width]);
    var y = d3.scaleLinear().range([height, 0]);

    init();
    repo.averagePopularityByYear().then(update);

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
    }

    function update(pairs) {
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
})(d3, window);