d3.selection.prototype.moveToFront = function() {
  return this.each(function(){
    this.parentNode.appendChild(this);
  });
};


var margin = {top: 50, right: 30, bottom: 30, left: 400},
  width = 1250 - margin.left - margin.right,
  barHeight = 20;
  
var x = d3.scale.linear()
  .range([0, width]);

var prec = d3.format('.2g');

var viewOptions = ['Default', 'Unemployment Rate', 'Major', 'Major Category'];

d3.select("body").select("#viewSelect").selectAll("option").data(viewOptions).enter().append("option")
  .text(function(d){ return d;})
  .attr('value', function(d){ return d;});

d3.json('all-ages.json', function(error, data) { 

  data = nonZeroUnemployment(data);

  var sortType = 'descending';

  var original_data = data;

  var allMajors = getAllMajors(data);
  var allMajorCategories = getAllMajorCategories(data);
  
  var height = barHeight * data.length;

  var xAxis = d3.svg.axis()
    .scale(x)
    .orient('top')
    .innerTickSize(-height - 9)
    .outerTickSize(3)
    .tickPadding(10);

  var y = d3.scale.ordinal()
    .rangeRoundBands( [height, 0], 0.1);

  x.domain( [ 0, d3.max(data, function(d) { return d.Unemployment_rate; }) ] );
  y.domain( data.map(function(d) { return d.Major; }) );

  var chart = d3.select('#chart')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
    .append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

  chart.append('g')
    .attr('class', 'x axis')
    .attr('transform', 'translate(0, -10)')
    .call(xAxis);

  var determineData = function(view, callback) {
    var selectedView = view;
    if (selectedView == 'Unemployment Rate') {
      if (sortType == 'descending') {
        data = sortByUnemployment(original_data);
      } else {
        data = sortByUnemployment(original_data).reverse();
      }
    } else if (selectedView == 'Major') {
      data = sortByMajor(original_data); 
    } else if (selectedView == 'Major Category') {
      data = sortByMajorCategory(original_data);
    } else { // 'Default'
      data = original_data;
    }
    callback(selectedView);
  }

  var populateChart = function(selectedView) {

    var bar = chart.selectAll('g.barg')
      .data(data, key); // update selection

    var barEnter = bar.enter(); // enter selection
    var barExit = bar.exit(); // exit selection

    // exit phase (currently no exit)
    //barExit.remove();
    
    // enter phase
    var barEnterG = barEnter.append('g')
      .attr('class', 'barg')
      .attr('transform', function(d, i) { return 'translate(0,' + (i * barHeight) + ')'; });

    barEnterG.append('rect')
      .attr('height', barHeight - 1)
      .attr('width', 0)
      .on('mouseover', function() {
        d3.select(this)
          .style('fill', '#2ecc71');
        d3.select(this.parentNode)
          .append('text')
            .attr('id', 'tooltip')
            .attr('text-anchor', 'end')
            .attr('x', function(d) {
              return x(d.Unemployment_rate) - 5;
            })
            .attr('y', 12.5)
            .style('fill', 'white')
            .text(function(d) {
              return prec(d.Unemployment_rate);
            });
        d3.select(this.parentNode).select('.major')
          .style('fill', '#2ecc71');
      })
      .on('mouseout', function() {
        d3.select(this)
          .transition().duration(10)
            .style('fill', '#3498db');
        d3.selectAll("#tooltip")
          .transition().duration(10)
            .style('opacity', 0)
            .remove()
        d3.select(this.parentNode).select('.major')
          .transition().duration(10)
            .style('fill', '#34495e');
      })
      .transition().duration(500)
        .attr('width', function(d) { return x(d.Unemployment_rate); });

    barEnterG.append('text')
      .attr('class', 'major')
      .attr('x', -5)
      .attr('y', barHeight / 2)
      .attr('dy', '.35em')
      .text(function(d) { return d.Major; })
      .on('mouseover', function() {

        d3.select(this)
          .style('fill', '#2ecc71');
        d3.select(this.parentNode)
          .append('text')
            .attr('id', 'tooltip')
            .attr('text-anchor', 'end')
            .attr('x', function(d) {
              return x(d.Unemployment_rate) - 5;
            })
            .attr('y', 12.5)
            .style('fill', 'white')
            .text(function(d) {
              return prec(d.Unemployment_rate);
            });
        d3.select(this.parentNode).select('rect')
          .style('fill', '#2ecc71');
      
      })
      .on('mouseout', function() {

        d3.select(this)
          .transition().duration(10)
            .style('fill', '#34495e');
        d3.selectAll("#tooltip")
          .transition().duration(10)
            .style('opacity', 0)
            .remove()
        d3.select(this.parentNode).select('rect')
          .transition().duration(10)
            .style('fill', '#3498db');

      })
      .style('opacity', 0)
      .transition().duration(500)
        .style('opacity', 1);

    // update phase
    bar
      .transition().duration(50)
        .style('opacity', 0)
      .transition().delay(100).duration(0)
        .attr('transform', function(d, i) { return 'translate(0,' + (i * barHeight) + ')'; })
      .transition().delay(200).duration(500)
        .style('opacity', 1);

    bar.selectAll('rect')
      .transition().delay(100)
        .attr('width', 0)
      .transition().delay(200).duration(500)
        .attr('width', function(d) { return x(d.Unemployment_rate); });

    // reverse sort type

    if (selectedView == 'Unemployment Rate') {
      document.getElementById('chart').onclick = function() {
        if (sortType == 'descending') {
          sortType = 'ascending';
        } else {
          sortType = 'descending';
        }
        document.getElementById("viewSelect").onchange();
      };
    } else {
      document.getElementById('chart').onclick = null;
    }

    // alphabetical indication

    if (selectedView == 'Major') {
      var majorAlphabeticals = getMajorAlphabeticals(data);
    } else {
      var majorAlphabeticals = [];
    }

    var letterCount = {};
    for (var i = 0; i < data.length; i++) {
      var letter = data[i].Major[0];
      if (letter in letterCount) {
        letterCount[letter]++;
      } else {
        letterCount[letter] = 1;
      }
    }

    var letterY = {};
    var yThusFar = 0;

    for (var i = 0; i < Object.keys(letterCount).length; i++) {
      var letter = Object.keys(letterCount)[i];
      letterY[letter] = yThusFar;
      yThusFar += letterCount[letter] * 20; 
    }

    var alph = chart.selectAll('g.alphg')
      .data(majorAlphabeticals); // update selection

    var alphEnter = alph.enter(); // enter selection
    var alphExit = alph.exit(); // exit selection

    var alphEnterG = alphEnter.append('g')
      .attr('class', 'alphg')
      .attr('transform', function(d) {
        return 'translate(0,' + letterY[d] + ')';
      });

    alphEnterG.append('text')
      .attr('x', width - 5)
      .attr('y', 13)
      .attr('text-anchor', 'end')
      .text( function(d) { return d; })
      .attr('pointer-events', 'none');

    alphEnterG.append('rect')
      .attr('x', width - 16)
      .attr('y', 2)
      .attr('width', 15)
      .attr('height', 15)
      .style('fill-opacity', 0)
      .on('mouseover', function(d) {

        d3.select(this.parentNode).append('rect')
          .attr('class', 'highlighter')
          .attr('height', function(d) {
            return letterCount[d] * 20 - 1;
          })
          .attr('width', width)
          .attr('fill', '#34495e')
          .style('opacity', 0)
          .transition().duration(300)
            .style('opacity', 0.2);

        d3.select(this).moveToFront();
        bar.moveToFront();

        var letter = d3.select(this.parentNode).select('text').text();

        bar.selectAll('text')
          .transition().duration(300)
            .style('fill', function(d) {
              if (d.Major[0] == letter) {
                return '#3498db';
              }
            });

        d3.select(this.parentNode).select('text')
          .transition().duration(300)
            .attr('fill', '#3498db');

      })
      .on('mouseout', function(d) {

        d3.select(this.parentNode).selectAll('.highlighter')
          .transition().duration(300)
            .style('opacity', 0)
            .remove();

        bar.selectAll('text')
          .transition().duration(300)
            .style('fill', '#34495e');

        d3.select(this.parentNode).select('text')
          .transition().duration(300)
            .attr('fill', '#34495e');

      });

    alph
      .style('opacity', 0)
      .transition().delay(200).duration(500)
        .style('opacity', 1);

    alphExit
      .transition().duration(50)
          .style('opacity', 0)
      .remove();

    // category indication

    var categoryColors = ['#f1c40f', '#e67e22', '#d35400']

    if (selectedView == 'Major Category') {
      var majorCategories = getAllMajorCategories(data);
    } else {
      var majorCategories = [];
    }

    var categoryCount = {};
    for (var i = 0; i < data.length; i++) {
      var category = data[i].Major_category;
      if (category in categoryCount) {
        categoryCount[category]++;
      } else {
        categoryCount[category] = 1;
      }
    }

    var categoryY = {};
    var ySoFar = 0;

    for (var i = 0; i < Object.keys(categoryCount).length; i++) {
      var category = Object.keys(categoryCount)[i];
      categoryY[category] = ySoFar;
      ySoFar += categoryCount[category] * 20; 
    }

    var cat = chart.selectAll('g.catg')
      .data(majorCategories); // update selection

    var catEnter = cat.enter(); // enter selection
    var catExit = cat.exit(); // exit selection

    var catEnterG = catEnter.append('g')
      .attr('class', 'catg')
      .attr('transform', function(d) { 
        return 'translate(0,' + categoryY[d] + ')'; 
      });

    catEnterG.append('rect')
      .attr('class', 'cat')
      .attr('height', function(d) {
        return categoryCount[d] * 20 - 1;
      })
      .attr('width', width)
      .style('fill', function(d, i) {
        return categoryColors[i % 3];
      })
      .style('opacity', 0.3);

    catEnterG.append('text')
      .attr('x', width - 5)
      .attr('y', 13)
      .attr('text-anchor', 'end')
      .text( function(d) { 
        return d;
      })
      .on('mouseover', function() {

        d3.select(this)
          .transition().duration(300)
            .style('fill', '#f1c40f');

        var category = d3.select(this).text();
        bar.selectAll('rect')
          .transition().duration(300)
            .style('fill', function(d) {
              if (d.Major_category == category) {
                return '#f1c40f'
              }
            });

        bar.selectAll('text')
          .transition().duration(300)
            .style('fill', function(d) {
              if (d.Major_category == category) {
                return '#f1c40f'
              }
            });


      })
      .on('mouseout', function() {

        d3.select(this)
          .transition().duration(300)
            .style('fill', '#34495e');

        bar.selectAll('rect')
          .transition().duration(300)
            .style('fill', '#3498db');

        bar.selectAll('text')
          .transition().duration(300)
            .style('fill', '#34495e');

      });
     
    bar.moveToFront();

    cat
      .style('opacity', 0)
      .transition().delay(200).duration(500)
        .style('opacity', 1);

    catExit
      .transition().duration(50)
          .style('opacity', 0)
      .remove();

    // fixes graphical premature trigger bugs?
    d3.select('#chart')
      .attr('pointer-events', 'none')
      .transition().delay(1000)
        .attr('pointer-events', 'all');
  };

  document.getElementById("viewSelect").onchange = function () {

    determineData(this.value, populateChart);

  }; // end onchange

  document.getElementById("viewSelect").onchange(); // call this at start

}); // end d3 json read call

function key(d) {
  return d.Major;
}

function nonZeroUnemployment(data) {
  return _.reject(data, function(d) {
    return d.Unemployment_rate == 0;
  });
}

function getAllMajors(data) {
  var result = _.map(data, function(d) {
    return d.Major;
  });
  return result;
}

function getMajorAlphabeticals(data) {
  var result = _.map(data, function(d) {
    return d.Major[0]
  });
  result = _.uniq(result);
  result = _.sortBy(result);
  return result;
}

function getAllMajorCategories(data) {
  var result = _.map(data, function(d) {
    return d.Major_category;
  });
  result = _.uniq(result);
  result = _.sortBy(result);
  return result;
}

function sortByUnemployment(data) {
  return _.sortBy(data, function(d) {
    return d.Unemployment_rate;
  }).reverse();
}

function sortByMajor(data) {
  return _.sortBy(data, function(d) {
    return d.Major;
  });
}

function sortByMajorCategory(data) {
  return _.sortBy(data, function(d) {
    return d.Major_category;
  });
}