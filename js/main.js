(function (d3, w) {
    'use strict';

    var repo = w.repository('data/everything.csv');

    redraw();
    w.addEventListener('resize', w.throttle(redraw, 200));

    function redraw() {
        var overviewParent = d3.select('#overview').html('');
        var detailParent = d3.select('#detail').html('');

        var overview = createOverview(overviewParent);
        var detail = createDetail(detailParent);

        var fetching = repo.avgByYear([
            'popularity',
            'energy',
            'danceability',
            'tempo',
            'acousticness',
            'loudness',
            'popularity'
        ]);

        fetching.then(p(updateOverview, overview, detail, 'tempo'));
        repo.tracksOfYear(2000)
            .then(function (tracks) { return {tracks: tracks, year: 2000}; })
            .then(p(updateDetail, detail))
        ;

        d3.selectAll('.js-aggregation').on('click', function (_, i, selection) {
            var el = selection[i];
            var prop = el.getAttribute('data-prop');

            d3.selectAll(selection).classed('selected', false);
            d3.select(el).classed('selected', true);

            fetching.then(p(updateOverview, overview, detail, prop));
        });
    }

    function updateYear(year, chart) {
        repo
            .tracksOfYear(year)
            .then(function (tracks) { return {tracks: tracks, year: year}; })
            .then(p(updateDetail, chart))
        ;
    }

    function createOverview(parent) {
        var width = parent.node().getBoundingClientRect().width;
        var height = $(parent.node()).height();

        // Dimensions of the chart.
        var margin = {top: 30, right: 20, bottom: 20, left: 50};
        width -= (margin.left + margin.right);
        height -= (margin.top + margin.bottom);

        var svg = parent.append('svg')
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
        ;

        var grid = svg
            .append("g")
            .attr('class', 'grid')
            .attr('transform', translate(margin.left, margin.top))
        ;

        grid
            .append('line')
            .attr('class', 'selection-line')
            .attr('x1', 0)
            .attr('x2', width)
        ;

        // Adds the x-axis
        svg.append("g")
            .attr('class', 'x-axis')
            .attr('transform', translate(margin.left, margin.top))
        ;

        // Adds the y-axis.
        svg.append("g")
            .attr('class', 'y-axis')
            .attr('transform', translate(margin.left, margin.top))
        ;

        return {
            svg: svg,
            x: d3.scaleLinear().range([0, width]),
            y: d3.scaleLinear().range([0, height])
        };
    }

    function updateOverview(chart, detail, prop, pairs) {
        // Scale the range of the data
        var yExtent = d3.extent(pairs, function(d) { return +d.year; }).reverse();
        yExtent[0] += 1;
        yExtent[1] -= 1;

        chart.y.domain(yExtent);
        chart.x.domain([
            d3.min(pairs, function(d) { return d[prop] - 0.01; }),
            d3.max(pairs, function(d) { return d[prop] + 0.01; })
        ]);

        var radius = d3.scaleLinear().range([5, 20]).domain([
            d3.min(pairs, function(d) { return d.popularity; }),
            d3.max(pairs, function(d) { return d.popularity; })
        ]);

        // define the line
        var valueLine = d3.line()
            .y(function(d) { return chart.y(d.year); })
            .x(function(d) { return chart.x(d[prop]); })
        ;

        var container = chart.svg.select('.grid');

        var itemsOld = container.selectAll('.year-item').data(pairs);
        var itemsDel = itemsOld.exit();
        var itemsNew = itemsOld.enter();

        itemsNew = itemsNew.append('circle').attr('class', 'year-item');

        var itemsAll = itemsOld.merge(itemsNew);
        itemsAll
            .attr('r', function (pair) { return radius(pair.popularity); })
            .on('click', function (pair, i, itemsAll) {
                d3.selectAll(itemsAll).classed('selected', false);
                d3.select(itemsAll[i]).classed('selected', true);

                var line = d3.select('.selection-line');

                line
                    .transition()
                    .duration(1000)
                    .attr('y1', chart.y(pair.year))
                    .attr('y2', chart.y(pair.year))
                ;

                updateYear(pair.year, detail);
            })
            .transition()
            .duration(750)
            .attr('cx', function (pair) { return chart.x(pair[prop]); })
            .attr('cy', function (pair) { return chart.y(pair.year); })
        ;

        // Update x-axis and y-axis.
        chart.svg.selectAll('.x-axis').call(d3.axisTop(chart.x).ticks(5));
        chart.svg.selectAll('.y-axis').call(d3.axisLeft(chart.y).tickFormat(d3.format('d')));
    }

    function createDetail(parent) {
        var width = parent.node().getBoundingClientRect().width;
        var height = parent.node().getBoundingClientRect().height;

        width = width > height ? height : width;
        height = height > width ? width : height;

        var svg = parent.append('svg')
            .attr("width", width)
            .attr("height", height)
        ;

        svg
            .append('rect')
            .attr('class', 'detail-background')
            .attr('x', 0.02 * width)
            .attr('y', 0.02 * height)
            .attr('width', 0.96 * width)
            .attr('height', 0.96 * height)
            .attr('rx', 15)
            .attr('ry', 15)

        var v1_x = 0.02 * width
        var v1_y = 0.5 * height - 20
        var v2_x = 0.02 * width
        var v2_y = 0.5 * height + 20
        var v3_x = 0
        var v3_y = 0.5 * height

        svg
            .append('polygon')
            .attr('points', v1_x + ',' + v1_y + ' ' + v2_x + ',' + v2_y + ' ' + v3_x + ',' + v3_y)
            .attr('class', 'triangle')



        var chart = {
            svg: svg,
            popularityDisk: {
                center: {
                    x: 0.5 * width, // pixels
                    y: 0.5 * height // pixels
                },
                marginInner: 100,  // pixels
                marginOuter: 10,  // pixels
                sliderSpace: 0.05, // fraction of entire disk
                radius: 0.34 * width, // pixels
                threshold: 0, // 0 - 100 (popularity)
            }
        };

        createRankPath(svg, chart.popularityDisk)
            .attr('id', 'rank-path')
            .attr('class', 'rank-path')
        ;

        var popFilter = svg
            .append('path')
            .attr('class', 'popularity-filter')
            .attr('fill', '#D9558A')
            .attr('fill-opacity', '0.25')
            .attr('transform', translate(chart.popularityDisk.center.x, chart.popularityDisk.center.y))
        ;

        createPopularitySlider(svg, chart.popularityDisk)
            .attr('class', 'pop-slider')
            .on('slider-adjusted.arc', p(updateFilterArc, popFilter, chart.popularityDisk))
            // Set the initial value.
            .dispatch('slider-adjusted', {detail: {popularity: chart.popularityDisk.threshold}})
        ;

        createPlayer(svg, chart.popularityDisk)
            .attr('class', 'player-control')
        ;

        svg
            .append('g')
            .attr('class', 'detail-container')
        ;


        return chart;
    }

    function createPlayer(parent, disk) {
        var player = parent
            .append('g')
            .attr('transform', translate(disk.center.x - 15, disk.center.y - 15))
        ;

        var playBtn = player
            .append('g')
            .attr('class', 'player-control-play')
            .classed('player-control-visible', true)
            .on('click', play)
        ;

        playBtn
            .append('polygon')
            .attr('points', '0,0 30,15 0,30')
        ;

        var pauseBtn = player
            .append('g')
            .attr('class', 'player-control-pause')
            .classed('player-control-visible', true)
            .on('click', pause)
        ;

        pauseBtn
            .append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', 10)
            .attr('height', 30)
        ;

        pauseBtn
            .append('rect')
            .attr('x', 20)
            .attr('y', 0)
            .attr('width', 10)
            .attr('height', 30)
        ;

        return player;
    }

    function updateFilterArc(arc, disk, _) {
        var popularity = d3.event.detail.popularity;
        var path = d3.arc()
            .innerRadius(disk.marginInner)
            .outerRadius(innerRadius(disk.radius, disk.marginInner, disk.marginOuter, popularity))
            .startAngle(0)
            .endAngle(2 * Math.PI)
        ;

        arc.attr('d', path());
    }

    function createRankPath(parent, popularityDisk) {
        var path = d3.path();
        path.arc(
            popularityDisk.center.x,
            popularityDisk.center.y,
            popularityDisk.radius + 10,
            (2 * Math.PI) * (0 + 0.5 * popularityDisk.sliderSpace) - 0.5 * Math.PI,
            (2 * Math.PI) * (1 - 0.5 * popularityDisk.sliderSpace) - 0.5 * Math.PI
        );

        return parent
            .append('path')
            .attr('d', path.toString())
        ;
    }

    function createPopularitySlider(parent, disk) {
        var length = disk.radius - (disk.marginInner + disk.marginOuter);
        var slider = parent.append('g');
        var handle = slider.append('g');

        var x = d3.scaleLinear()
            .domain([0, 100])
            .range([0, length])
            .clamp(true)
        ;

        var min = x.range()[0];
        var max = x.range()[1];
        var mid = 0.5 * (max - min);

        var knobScale = d3.scaleLinear()
            .domain([8, 12])
            .range([0, length])
        ;

        slider
            .append('line')
            .attr('class', 'pop-slider-track')
            .attr('y1', min)
            .attr('y2', max)
        ;

        slider.append('circle').attr('class', 'pop-slider-max').attr('r', 8).attr('cy', min);
        slider.append('circle').attr('class', 'pop-slider-mid').attr('r', 10).attr('cy', mid);
        slider.append('circle').attr('class', 'pop-slider-min').attr('r', 12).attr('cy', max);

        slider.append('text').attr('class', 'pop-slider-txt').attr('y', min + 3).attr('text-anchor', 'middle').text(0);
        slider.append('text').attr('class', 'pop-slider-txt').attr('y', mid + 3).attr('text-anchor', 'middle').text(50);
        slider.append('text').attr('class', 'pop-slider-txt').attr('y', max + 3).attr('text-anchor', 'middle').text(100);

        var knob = slider
            .append('circle')
            .attr('class', 'pop-slider-knob')
            .attr('r', 5)
        ;

        var knobText = slider
            .append('text')
            .attr('class', 'pop-slider-knob-text')
        ;

        slider
            .attr('transform', translate(disk.center.x, disk.center.y - (disk.radius - disk.marginOuter)))
            .append('line')
            .attr('class', 'pop-slider-overlay')
            .attr('y1', min)
            .attr('y2', max)
            .call(d3.drag()
                .on('start.interrupt', function() { slider.interrupt(); })
                .on('start drag', function () {
                    slider.dispatch('slider-adjusted', {detail: {
                        // Substracting disk center, because it is 50% from
                        // beginning and we're also translating by -50% in CCS.
                        popularity: Math.round(x.invert(d3.event.y + (isWebkit() ? 0 : disk.center.y)))
                    }});
                })
            )
        ;

        slider.on('slider-adjusted.knob', p(adjustPopularityKnob, knob, knobText, x))

        return slider;
    }

    function adjustPopularityKnob(knob, text, scale, _) {
        var popularity = d3.event.detail.popularity;
        var t = popularity * 0.01;
        var radius = (1 - t) * 8 + t * 12;

        knob.attr('cy', scale(popularity));
        knob.attr('r', radius);
        text.text(Math.round(popularity));
        text.attr('y', scale(popularity) + 5)
        text.attr('x', radius + 5);
    }

    function translate(x, y) {
        return 'translate(' + x + ', ' + y + ')';
    }

    function color(track) {
        // Linear interpolation between 2 values.
        var l = function l(a, b, t) { return Math.round((1 - t) * a + t * b); };

        var h = [85, 230, 230]; // Happy
        var n = [255, 255, 255]; // Neutral
        var s = [251, 96, 160]; // Sad

        var t = track.valence;
        var r = t < 0.5 ? l(s[0], n[0], t / 0.5) : l(n[0], h[0], (t - 0.5) / 0.5);
        var g = t < 0.5 ? l(s[1], n[1], t / 0.5) : l(n[1], h[1], (t - 0.5) / 0.5);
        var b = t < 0.5 ? l(s[2], n[2], t / 0.5) : l(n[2], h[2], (t - 0.5) / 0.5);

        return 'rgb(' + r + ', ' + g + ', ' + b + ')';
    }

    function updateDetail(chart, tracksAndYear) {
        var year = tracksAndYear.year;
        var tracks = tracksAndYear.tracks;
        var ds = chart.popularityDisk.sliderSpace * (2 * Math.PI);
        var da = (2 * Math.PI - ds) / tracks.length;
        var width = parseInt(chart.svg.style('width'), 10);
        var height = parseInt(chart.svg.style('height'), 10);

        var container = chart.svg.select('.detail-container');

        var cx = chart.popularityDisk.center.x;
        var cy = chart.popularityDisk.center.y;

        var rFn = function (track) { return 8; };
        var xFn = function (track, i) { return cx + 0.4 * width * Math.cos(angle(da, ds, i) - 0.5 * Math.PI); };
        var yFn = function (track, i) { return cy + 0.4 * width * Math.sin(angle(da, ds, i) - 0.5 * Math.PI); };

        var itemsOld = container.selectAll('.detail-item').data(tracks);
        var itemsDel = itemsOld.exit();
        var itemsNew = itemsOld.enter();

        itemsNew = itemsNew.append('g').attr('class', 'detail-item');
        itemsNew.append('g').attr('class', 'circle-container').append('circle').attr('class', 'circle');
        itemsNew.append('path').attr('class', 'popularity');
        itemsNew.append('text').append('textPath').attr('class', 'rank').attr('xlink:href', '#rank-path');

        var itemsAll = itemsOld.merge(itemsNew);

        itemsAll
            .select('.circle-container')
            .attr('transform', function (track, i) {return 'translate(' + xFn(track, i) + ',' + yFn(track, i) + ')'})
        ;

        itemsAll
            .select('.circle')
            .attr('r', rFn)
            .attr('class', function(track, i) {
                var circleClass = 'circle';
                var vibrateFrequency = (function(value){
                    var index = null
                    if (value < 50) index = 1;
                    else if (value >= 50 && value < 90) index = 2;
                    else if (value >= 90 && value < 130) index = 3;
                    else if (value >= 130 && value < 170) index = 4;
                    else {index = 5;}
                    return 'vibrate-frequency-' + index
                })(track.tempo)
                var vibrateSize = (function(value){
                    var index = null;
                    if (value < 0.2) index = 1;
                    else if (value >= 0.2 && value < 0.4) index = 2;
                    else if (value >= 0.4 && value < 0.6) index = 3;
                    else if (value >= 0.6 && value < 0.8) index = 4;
                    else {index = 5;}
                    return 'vibrate-size-' + index
                })(track.energy)
                return circleClass + ' ' + vibrateFrequency + ' ' + vibrateSize
            })
        ;

        itemsAll
            .select('.popularity')
            .attr('d', p(createArc, 0.2, da, ds, chart.popularityDisk.radius, chart.popularityDisk.marginInner, chart.popularityDisk.marginOuter))
            .attr('transform', translate(cx, cy))
            .attr('fill', p(color))
            .attr('fill-opacity', p(updateOpacity, chart.popularityDisk.threshold))
            .on('click', changeTrackAndPlay)
            .on('mouseenter', function(track, i) {
                $('#song-name').empty()
                $('#song-artist').empty()
                $('#energy').empty()
                $('#danceability').empty()
                $('#tempo').empty()
                $('#song-detail').addClass('detail-show')
                $('#song-name').append(track.name)
                $('#song-artist').append(track.artist)
                $('#energy').append(track.energy);
                $('#danceability').append(track.danceability)
                $('#tempo').append(track.tempo);
                $(document).on('mousemove', function(e){
                    $('#song-detail').css({
                       left:  e.pageX,
                       top:   e.pageY + 30
                    });
                });
                return arcGrow.call(this, da, ds, chart.popularityDisk.radius, chart.popularityDisk.marginInner, chart.popularityDisk.marginOuter, track, i)
            })
            .on('mouseout', function(track, i) {
                $('#song-detail').removeClass('detail-show')
                return arcShrink.call(this, da, ds, chart.popularityDisk.radius, chart.popularityDisk.marginInner, chart.popularityDisk.marginOuter, track, i)
            })
        ;


        function arcGrow(da, ds, r, ri, ro, track, i) {
            d3.select(this).transition().duration(0).attrTween("d", function(track) {
              var interpolate = d3.interpolate(0.2, 1);
              return function(t) { var w = interpolate(t); return createArc(w, da, ds, r, ri, ro, track, i); };
            });
        }

        function arcShrink(da, ds, r, ri, ro, track, i) {
            d3.select(this).transition().duration(200).attrTween("d", function(track) {
              var interpolate = d3.interpolate(1, 0.2);
              return function(t) { var w = interpolate(t); return createArc(w, da, ds, r, ri, ro, track, i); };
            });
        }

        chart.svg.selectAll('.pop-slider').on('slider-adjusted.filter', function () {
            chart.popularityDisk.threshold = d3.event.detail.popularity;
            itemsAll
                .select('.popularity')
                .attr('fill-opacity', p(updateOpacity, d3.event.detail.popularity))
            ;
        });

        itemsAll
            .select('.rank')
            .attr('startOffset', function (track, i) {
                return (100 * angle(da, 0, i) / (2 * Math.PI - ds)) + '%';
            })
            .text(function (track) { return track.rank; })
        ;

        itemsDel.remove();
    }

    function changeTrackAndPlay(track) {
        d3
            .select('#player')
            .attr('src', 'https://p.scdn.co/mp3-preview/15f78fd0c74a576cddb1362fd8dae43b984b37a2?cid=b1f28da8553c44beb65edac3ed1abac7')
        ;

        play();
    }

    function play() {
        console.log('playing');
        d3.select('#player')['_groups'][0][0].play();
        d3.select('.player-control-play').classed('player-control-visible', true);
        d3.select('.player-control-pause').classed('player-control-visible', false);
    }

    function pause() {
        console.log('pausing');
        d3.select('#player')['_groups'][0][0].pause();
        d3.select('.player-control-play').classed('player-control-visible', false);
        d3.select('.player-control-pause').classed('player-control-visible', true);
    }

    function updateOpacity(popularity, track) {
        return track.popularity < popularity ? 0.1 : 1.0;
    }

    /**
     * @param {Float}   da    Angle (in radians) to use per track
     * @param {Float}   ds    Space above for the slider (???)
     * @param {Integer} r     Radius (in pixels) of the maximum
     * @param {Fkoat}   r1    Radius of the inner clear area (in pixels)
     * @param {Float}   r2    Radius of the outer clear area (in pixels)
     * @param {Object}  track
     * @param {Integer} i
     *
     * @return {[type]}
     */
    function createArc(w, da, ds, r, ri, ro, track, i) {
        var s = 0;
        var a = i * da;

        var lmin = ((r - ri - ro) / r);
        var lmax = (r - ro) / r;

        var arc = d3.arc()
            .innerRadius(innerRadius(r, ri, ro, track.popularity))
            .outerRadius(r)
            .startAngle(angle(da, ds, i) - 0.5 * w * da)
            .endAngle(angle(da, ds, i) + 0.5 * w * da)
        ;

        return arc();
    }

    function innerRadius(r, ri, ro, popularity) {
        var lmin = ((r - ri - ro) / r);
        var lmax = (r - ro) / r;

        return r * (lmax - lmin * 0.01 * popularity)
    }

    function angle(da, ds, i) {
        return i * da + 0.5 * (ds + da);
    }

    function isWebkit() {
        var isChrome = /Chrome/.test(w.navigator.userAgent) && /Google Inc/.test(w.navigator.vendor);
        var isSafari = /Safari/.test(w.navigator.userAgent) && /Apple Computer/.test(w.navigator.vendor);

        return isChrome || isSafari;
    }

})(d3, window);