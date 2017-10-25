var chart;
var height = 200;
var width = 300;
//DEFINE YOUR VARIABLES UP HERE


//Gets called when the page is loaded.
function init(){
  chart = d3.select('#vis').append('svg');
  vis = chart.append('g');
  //PUT YOUR INIT CODE BELOW

}

//Called when the update button is clicked
function updateClicked(){
  d3.csv('data/CoffeeData.csv',update);
}

//Callback for when data is loaded
function update(rawdata){
  //PUT YOUR UPDATE CODE BELOW


}

// Returns the selected option in the X-axis dropdown. Use d[getXSelectedOption()] to retrieve value instead of d.getXSelectedOption()
function getXSelectedOption(){
  var node = d3.select('#xdropdown').node();
  var i = node.selectedIndex;
  return node[i].value;
}

// Returns the selected option in the X-axis dropdown. 
function getYSelectedOption(){
  var node = d3.select('#ydropdown').node();
  var i = node.selectedIndex;
  return node[i].value;
}
