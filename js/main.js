(function ($) {
    'use strict';

    jQuery.fn.d3Click = function () {
      this.each(function (i, e) {
        var evt = new MouseEvent("click");
        e.dispatchEvent(evt);
      });
    };
})(jQuery);

(function (d3, w) {
    'use strict';


    var repo = w.repository('data/everything-final.csv');

    redraw();
    w.addEventListener('resize', w.throttle(redraw, 200));

    init()

    function init() {
        $('#help-btn').on('click', function() {
            console.log('close!')
            $('#help').toggleClass('help-container--hidden')
            $('#help-btn').toggleClass('help-btn--hidden')
            $('#main-vis').toggleClass('main-vis--blur')
        })

        $('#close-btn').on('click', function() {
            console.log('close!!')
            $('#help').toggleClass('help-container--hidden')
            $('#help-btn').toggleClass('help-btn--hidden')
            $('#main-vis').toggleClass('main-vis--blur')
        })

        $('.help-background').on('click', function() {
            console.log('close!')
            $('#help').toggleClass('help-container--hidden')
            $('#help-btn').toggleClass('help-btn--hidden')
            $('#main-vis').toggleClass('main-vis--blur')
        })
    }

    function redraw() {
        var overviewParent = d3.select('#overview').html('');
        var detailParent = d3.select('#detail').html('');

        var detail = createDetail(detailParent);
        var overview = createOverview(overviewParent, detail);

        var fetching = repo.avgByYear([
            'popularity',
            'energy',
            'danceability',
            'tempo',
            'acousticness',
            'loudness',
            'popularity'
        ]);

        fetching
            .then(p(updateOverview, overview, detail, 'loudness'))
            // Click on the first year to make it visible.
            .then(function () { $('.year-item').last().d3Click(); })
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

    function onYearChange(overview, detail, year, i, itemsAll) {
        d3.selectAll(itemsAll).classed('selected', false);
        d3.select(itemsAll[i]).classed('selected', true);

        var line = d3.select('.selection-line');

        line
            .attr('y1', overview.y(year))
            .attr('y2', overview.y(year))
        ;

        var knob = d3.select('.year-slider-knob').attr('cy', overview.scale(year));

        updateYear(year, detail);
    }

    function createOverview(parent, detail) {
        var width = parent.node().getBoundingClientRect().width;
        var height = $(parent.node()).height();

        // Dimensions of the chart.
        var margin = {top: 40, right: 60, bottom: 20, left: 60};
        width -= (margin.left + margin.right);
        height -= (margin.top + margin.bottom);

        var svg = parent.append('svg')
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
        ;

        var chart = {
            svg: svg,
            x: d3.scaleLinear().range([0, width]),
            y: d3.scaleLinear().range([0, height]),
            scale: d3.scaleLinear().domain([2015, 1965]).range([0 + (1/52 * height), height - (1/52 * height)]).clamp(true)
        };

        var yearItems = [];

        createYearSlider(svg, chart.scale, width, height, margin)
            .on('slider-adjusted.year', function () {
                if (0 === yearItems.length) {
                    var missingItems = Array.prototype.slice.call(d3.selectAll('.year-item')._groups[0]);
                    yearItems.push.apply(yearItems, missingItems);
                }

                var year = d3.event.detail.year;
                var i = year - 1965;

                onYearChange(chart, detail, year, i, yearItems);
            })
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
            .attr('x2', width + 0.5 * margin.right)
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

        return chart;
    }

    function updateOverview(chart, detail, prop, pairs) {
        // Scale the range of the data
        var yExtent = d3.extent(pairs, function(d) { return +d.year; }).reverse();
        yExtent[0] += 1;
        yExtent[1] -= 1;

        chart.y.domain(yExtent);

        if ('tempo' === prop) {
            chart.x.domain([
                d3.min(pairs, function(d) { return 0.95 * d[prop]; }),
                d3.max(pairs, function(d) { return 1.05 * d[prop]; })
            ]);
        } else if ('loudness' === prop) {
            chart.x.domain([-12, -4]);
        } else {
            chart.x.domain([0, 1]);
        }

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

        itemsDel
            .on('click', null)
            .on('mouseenter', null)
            .on('mousemove', null)
            .on('mouseout', null)
        ;

        var itemsAll = itemsOld.merge(itemsNew);
        itemsAll
            .attr('r', function (pair) { return radius(pair.popularity); })
            .on('click', function (pair, i, itemsAll) {
                onYearChange(chart, detail, pair.year, i, itemsAll);
            })
            .on('mouseenter', function(pair, i, itemsAll) {
                $('#year').empty()
                $('#year').append(pair.year)
                $('#year-popularity').empty()
                $('#year-popularity').append(pair.popularity.toFixed(2))
                $('#year-energy').empty()
                $('#year-energy').append(pair.energy.toFixed(2))
                $('#year-tempo').empty()
                $('#year-tempo').append(pair.tempo.toFixed(2))
                $('#year-danceability').empty()
                $('#year-danceability').append(pair.danceability.toFixed(2))
                $('#year-detail').addClass('detail-show')
            })
            .on('mousemove', function (pair, i, itemsAll) {
                if (d3.event.pageY + 30 + $('#year-detail').height() > $(window).height()) {
                    $('#year-detail').css({
                       left:  d3.event.pageX,
                       top:   d3.event.pageY - $('#year-detail').height() - 30
                    });
                } else {
                    $('#year-detail').css({
                       left:  d3.event.pageX,
                       top:   d3.event.pageY + 30
                    });
                }
            })
            .on('mouseout', function(pair, i, itemsAll) {
                $('#year-detail').removeClass('detail-show')
            })
            .transition()
            .duration(750)
            .attr('cx', function (pair) { return chart.x(pair[prop]); })
            .attr('cy', function (pair) { return chart.y(pair.year); })
        ;

        // Update x-axis and y-axis.
        var yAxis = d3.axisLeft(chart.y).tickFormat(d3.format('d'));
        var xAxis = d3.axisTop(chart.x).ticks(5);
        if (!['tempo', 'loudness'].includes(prop)) {
            xAxis.tickFormat(function (d) { return Math.round(d * 100); });
        }

        chart.svg.selectAll('.x-axis').call(xAxis);
        chart.svg.selectAll('.y-axis').call(yAxis);
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

        svg
            .append('text')
            .attr('class', 'year-label')
            .text('2000')
            .attr('text-anchor', 'middle')
            .attr('x', 0.5 * width)
            .attr('y', 0.07 * height)
        ;



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
            .attr('stroke', '#b1b1b1')
            .attr('stroke-opacity', '0.2')
            .attr('fill', '#D9558A')
            .attr('fill-opacity', '0.1')
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

        svg
            .append('g')
            .append('image')
            .attr('opacity', '1')
            .attr('x', width - 150)
            .attr('y', height - 150)
            .attr('width', '100')
            .attr('xlink:href', './img/valence.png')


        return chart;
    }

    function createPlayer(parent, disk) {
        var player = parent
            .append('g')
            .attr('transform', translate(disk.center.x - 75, disk.center.y - 75))
        ;

        player
            .append('defs')
            .append('clipPath')
            .attr('id', 'player-art-clip')
            .append('circle')
            .attr('r', 75)
            .attr('cx', 75)
            .attr('cy', 75)
        ;

        var artContainer = player
            .append('g')
            .attr('class', 'player-art-container')
        ;

        artContainer
            .on('click', play)
        ;


        var playBtn = player
            .append('g')
            .attr('class', 'player-control-play')
            .attr('transform', translate(60, 60))
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
            .attr('transform', translate(60, 60))
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

    function createYearSlider(parent, scale, width, height, margin) {
        var slider = parent.append('g').attr('class', 'year-slider');
        var knob = slider.append('circle');
        var track = slider.append('rect');

        slider
            .attr('transform', translate(margin.left + width + 0.5 * margin.right, margin.top))
        ;

        track
            .attr('class', 'year-slider-track')
            .attr('x', -(width + 0.5 * margin.right))
            .attr('y', 0)
            .attr('width', width + margin.right)
            .attr('height', height)
        ;

        knob
            .attr('class', 'year-slider-knob')
            .attr('r', 8)
        ;

        track.call(d3.drag()
            .on('start.interrupt', function() { slider.interrupt(); })
            .on('start drag', function () {
                slider.dispatch('slider-adjusted', {detail: {
                    // Subtracting disk center, because it is 50% from
                    // beginning and we're also translating by -50% in CCS.
                    year: Math.round(scale.invert(d3.event.y))
                }});
            })
        );

        slider.on('slider-adjusted.knob', function () {
            knob.attr('cy', scale(d3.event.detail.year));
        });

        return slider;
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

    function refreshPlayer() {
        pause()
        d3
            .select('.player-art-container')
            .html('')
            .append('image')
            .attr('opacity', '1')
            .attr('x', '0')
            .attr('y', '0')
            .attr('width', '150')
            .attr('height', '150')
            .attr('clip-path', 'url(#player-art-clip)')
            .attr('xlink:href', './img/player_default@x2.png')
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

        var rFn = function (track) { return 6; };
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

        $('.year-label').empty()
        $('.year-label').append(year)


        itemsDel
            .on('click', null)
            .on('mouseenter', null)
            .on('mousemove', null)
            .on('mouseout', null)
        ;

        itemsAll
            .select('.circle-container')
            .attr('transform', function (track, i) {return 'translate(' + xFn(track, i) + ',' + yFn(track, i) + ')'})
        ;

        itemsAll
            .select('.circle')
            .attr('r', rFn)
            .attr('stroke-opacity', p(updateOpacity, chart.popularityDisk.threshold))
            .attr('class', function(track, i) {
                return [
                    'circle',
                    'vibrate-frequency-' + Math.round(track.tempo),
                    'vibrate-size-' + Math.round(track.energy * 100)
                ].join(' ');
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
                $('#popularity').empty()
                $('#rank-num').empty()
                $('#song-detail').addClass('detail-show')
                $('#song-name').append(track.name)
                $('#song-artist').append(track.artist)
                $('#energy').append(track.energy);
                $('#danceability').append(track.danceability)
                $('#tempo').append(track.tempo)
                $('#popularity').append(track.popularity)
                $('#rank-num').append(track.rank)
                return arcGrow.call(this, da, ds, chart.popularityDisk.radius, chart.popularityDisk.marginInner, chart.popularityDisk.marginOuter, track, i)
            })
            .on('mousemove', function (track, i) {
                if (d3.event.pageY + 30 + $('#song-detail').height() > $(window).height()) {
                    $('#song-detail').css({
                       left:  d3.event.pageX,
                       top:   d3.event.pageY - $('#song-detail').height() - 30
                    });
                } else {
                    $('#song-detail').css({
                       left:  d3.event.pageX,
                       top:   d3.event.pageY + 30
                    });
                }
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

            itemsAll
                .select('.circle')
                .attr('stroke-opacity', p(updateOpacity, d3.event.detail.popularity))
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
        if (!track.preview) {
            pause();
            d3
            .select('.player-art-container')
            .html('')
            .append('image')
            .attr('opacity', '1')
            .attr('x', '0')
            .attr('y', '0')
            .attr('width', '150')
            .attr('height', '150')
            .attr('clip-path', 'url(#player-art-clip)')
            .attr('xlink:href', './img/player_no_track@x2.png')
        ;
        }

        else {
        d3
            .select('.player-art-container')
            .html('')
            .append('image')
            .attr('opacity', '0.4')
            .attr('x', '0')
            .attr('y', '0')
            .attr('width', '150')
            .attr('height', '150')
            .attr('clip-path', 'url(#player-art-clip)')
            .attr('xlink:href', track.image)
            .attr('class', 'art-rotate')
        ;


        d3.select('#player').attr('src', track.preview);
        play();
    }
    }

    function play() {
        d3.select('#player')['_groups'][0][0].play();
        d3.select('.player-control-play').classed('player-control-visible', true);
        d3.select('.player-control-pause').classed('player-control-visible', false);
        $('.art-rotate').removeClass('art-rotate-pause')
        $('.player-art-container').off('click', play)
        $('.player-art-container').on('click', pause)
    }

    function pause() {
        d3.select('#player')['_groups'][0][0].pause();
        d3.select('.player-control-play').classed('player-control-visible', false);
        d3.select('.player-control-pause').classed('player-control-visible', true);
        $('.art-rotate').addClass('art-rotate-pause')
        $('.player-art-container').off('click', pause)
        $('.player-art-container').on('click', play)
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