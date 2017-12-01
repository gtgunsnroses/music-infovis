/**
 * This file handles all of the data mangling necessary for different
 * visualizations.
 *
 * Usage:
 *
 *     var repo = repository('data/everything.csv');
 *
 *     repo.averagePopularityByYear().then(update);
 */

// @todo move this to a separate file
(function (w) {
  'use strict';

  w.p = function p(f) {
    var count = arguments.length;
    var index = 1;
    var args = new Array(count - 1);

    while (index < count) args[index - 1] = arguments[index++];

    return f.bind.apply(f, [null].concat(args));
  }

})(window);

(function (d3, w, Promise) {
    'use strict';

    var Repository = function (pathToData) {
        this.pathToData = pathToData;

        var gettingTable = new Promise(function (resolve, reject) {
            d3.csv(pathToData, function (table) { resolve(table); });
        });

        this.avgByYear = function (props) {
            var propsToFn = {};
            for (var i in props) {
                propsToFn[props[i]] = avg;
            }

            return gettingTable.then(p(aggregateByYear, propsToFn));
        };

        this.averagePopularityByYear = function () {
            return gettingTable.then(p(aggregateByYear, {'popularity': avg}));
        };

        this.tracksOfYear = function (year) {
            return gettingTable.then(p(tracksOfYear, year));
        };
    };

    function avg(v) {
        return v.reduce(sum) / v.length;
    }

    /**
     * Computes an aggregate by year. Example output:
     *
     *   [
     *     {year: 1991, *prop1*: 43.5, *prop2*: 15.6, ...},
     *     {year: 1992, *prop1*: 56.4, *prop2*: 14.2, ...},
     *     ...
     *   ]
     *
     * Example usage:
     *
     *   aggregateByYear({
     *       popularity: avg,
     *       energy: mean
     *   }, table);
     *
     * @param {Object} keysToFn The properties to aggregate over mapped to aggregate functions
     * @param {Array}  table
     *
     * @return {Array}
     */
    function aggregateByYear(propsToFn, table) {
        var props = Object.keys(propsToFn);

        return table
            .reduce(groupBy.bind(null, 'year', props), [])
            .filter(function (aggregate) { return !!aggregate.year; })
            .map(function (aggregate) {
                for (var i in props) {
                    var prop = props[i];

                    aggregate[prop] = aggregate[prop]
                        .filter(function (v) { return v !== ''; })
                        .map(function (v) { return +v; })
                    ;

                    aggregate[prop] = propsToFn[prop](aggregate[prop]);
                }

                return aggregate;
            })
        ;
    }

    /**
     * @param {String} year  The year for which you'd like to get the items
     * @param {Array}  table The original data
     *
     * @return {Array}
     */
    function tracksOfYear(year, table) {
        var tracks = table
            .filter(function (row) { return String(row.year) === String(year); })
            .filter(function (row) { return row.popularity !== ''; })
        ;

        tracks.sort(function (a, b) {
            return a.rank - b.rank;
        });

        return tracks;
    }

    function sum(a, b) { return a + b; }

    /**
     * Adds the row to groups based on x and y attributes.
     *
     * @param {String} x
     * @param {Array}  ys
     * @param {Array}  groups
     * @param {Object} row
     *
     * @return {Array} New groups object
     */
    function groupBy(x, ys, groups, row) {
        for (var i in groups) {
          if (groups[i][x] === row[x]) {
            for (var j in ys) {
                groups[i][ys[j]].push(row[ys[j]]);
            }

            return groups;
          }
        }

        var group = {};
        group[x] = row[x];
        for (var j in ys) {
            group[ys[j]] = [row[ys[j]]];
        }

        groups.push(group);

        return groups;
    }

    w.repository = function (pathToData) {
        return new Repository(pathToData);
    };

})(d3, window, Promise);
