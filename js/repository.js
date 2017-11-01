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

        this.averagePopularityByYear = function () {
            return gettingTable.then(averagePopularityByYear);
        };

        this.tracksOfYear = function (year) {
            return gettingTable.then(p(tracksOfYear, year));
        };
    };

    /**
     * Computes average popularity by year. Example output:
     *
     *   [
     *     {year: 1991, popularity: 43.5},
     *     {year: 1992, popularity: 56.4},
     *     ...
     *   ]
     *
     * @param {Array} table The original data
     *
     * @return {Array}
     */
    function averagePopularityByYear(table) {
        return table
            .reduce(groupBy.bind(null, 'year', 'popularity'), [])
            .filter(function (pair) { return !!pair.year; })
            .map(function (pair) {
                pair.popularity = pair.popularity
                    .filter(function (v) { return v !== ''; })
                    .map(function (v) { return +v; })
                ;

                return {
                    year: pair.year,
                    popularity: pair.popularity.reduce(sum) / pair.popularity.length
                };
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
        return table.filter(function (row) { return String(row.year) === String(year); });
    }

    function sum(a, b) { return a + b; }

    /**
     * Adds the row to groups based on x and y attributes.
     *
     * @param {String} x
     * @param {String} y
     * @param {Array} groups
     * @param {Object} row
     *
     * @return {Array} New groups object
     */
    function groupBy(x, y, groups, row) {
        for (var i in groups) {
          if (groups[i][x] === row[x]) {
            groups[i][y].push(row[y]);

            return groups;
          }
        }

        var group = {};
        group[x] = row[x];
        group[y] = [row[y]];

        groups.push(group);

        return groups;
    }

    w.repository = function (pathToData) {
        return new Repository(pathToData);
    };

})(d3, window, Promise);
