(function (d3, w) {
    'use strict';

    var repo = w.repository('data/everything.csv');
    var overview = createOverview(500, 300);

    repo.averagePopularityByYear().then(p(updateOverview, overview));

    function createOverview(width, height) {
        // Dimensions of the chart.
        var margin = {top: 20, right: 50, bottom: 30, left: 20};
        width -= (margin.left + margin.right);
        height -= (margin.top + margin.bottom);

        var svg = d3.select('#overview').append('svg')
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
        ;

        var grid = svg
            .append("g")
            .attr('class', 'grid')
        ;

        // Adds the x-axis
        grid.append("g")
            .attr('class', 'x-axis')
            .attr('transform', 'translate(0,' + height + ')')
        ;

        // Adds the y-axis.
        grid.append("g")
            .attr('class', 'y-axis')
            .attr('transform', 'translate(' + width + ', 0)')
        ;

        return {
            svg: svg,
            x: d3.scaleLinear().range([0, width]),
            y: d3.scaleLinear().range([height, 0])
        };
    }

    function updateOverview(chart, pairs) {
        // Scale the range of the data
        chart.x.domain(d3.extent(pairs, function(d) { return d.year; }));
        chart.y.domain([
            d3.min(pairs, function(d) { return d.popularity - 2; }),
            d3.max(pairs, function(d) { return d.popularity + 2; })
        ]);

        // define the line
        var valueLine = d3.line()
            .x(function(d) { return chart.x(d.year); })
            .y(function(d) { return chart.y(d.popularity); })
        ;

        chart
          .svg
          .selectAll('.grid')
          .append('path')
          .datum(pairs)
          .attr('class', 'line')
          .attr('d', valueLine)
        ;

        // Update x-axis and y-axis.
        chart.svg.selectAll('.x-axis').call(d3.axisBottom(chart.x));
        chart.svg.selectAll('.y-axis').call(d3.axisRight(chart.y).ticks(5));
    }
})(d3, window);