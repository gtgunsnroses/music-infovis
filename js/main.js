(function (d3, w) {
    'use strict';

    var repo = w.repository('data/everything.csv');
    var overview = createOverview(500, 300);
    var detail = createDetail(500, 500);

    repo.averagePopularityByYear().then(p(updateOverview, overview));
    repo.tracksOfYear(2000).then(p(updateDetail, detail));

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

    function createDetail(width, height) {
        // Dimensions of the chart.
        var margin = {top: 20, right: 50, bottom: 30, left: 20};
        width -= (margin.left + margin.right);
        height -= (margin.top + margin.bottom);

        var svg = d3.select('#detail').append('svg')
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
        ;

        return {
            svg: svg
        };
    }

    function l(a, b, t) {
        return (1 - t) * a + t * b;
    }

    function updateDetail(chart, tracks) {
        var ds = (20 / 180) * Math.PI;
        var da = (2 * Math.PI - ds) / tracks.length;

        var arcs = tracks.map(p(createArc, da, ds));
        var i = 0;

        var g = chart.svg.append('g').attr('class', 'detail-container');

        var h = [85, 230, 230];
        var n = [255, 255, 255];
        var s = [251, 96, 160];

        arcs.forEach(function (arc) {

            var t = arc.track.valence;
            var fill = [
                t < 0.5 ? l(s[0], n[0], t / 0.5) : l(n[0], h[0], (t - 0.5) / 0.5),
                t < 0.5 ? l(s[1], n[1], t / 0.5) : l(n[1], h[1], (t - 0.5) / 0.5),
                t < 0.5 ? l(s[2], n[2], t / 0.5) : l(n[2], h[2], (t - 0.5) / 0.5),
            ];

            g.append('path')
                .style("fill", 'rgb(' + fill[0] + ', ' + fill[1] + ', ' + fill[2] + ')')
                .attr('d', arc.arc)
                .attr('transform', 'translate(240,240)')
            ;
        });
    }

    function createArc(da, ds, track, i) {
        var s = 0;
        var a = i * da;
        var m = 0.3;

        console.log(track.popularity);
        var arc = d3.arc()
            .innerRadius(20 + 200 * (1 - 0.01 * track.popularity))
            .outerRadius(240)
            .startAngle(a + da * m + s + 0.5 * ds)
            .endAngle(a + da * (1 - m) + s + 0.5 * ds)
        ;

        return {track: track, arc: arc};
    }


})(d3, window);