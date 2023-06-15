const adminHelpers = require('/Project Bake corner/helpers/admin-helpers');
let productSell= adminHelpers.getSellingProductInEachMonth

var trace1 = {
   
    x:['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'],
    y: [90, 40, 60,1,2,2,2,2,2,2,1,2],
    type: 'scatter',
    borderColor:'rgb(59,197,154)'
                    
               
};

var data = [trace1];

var layout = {
    title: 'Scroll and Zoom',
    showlegend: false
};
Plotly.newPlot('myDiv', data, layout, { scrollZoom: true });


