//visualization code start from here
//get data general by year(s) and field
function getData(_full_data, _prefix, _years) {
    var dataset = [];
    for (i = 0; i<_years.length; i++) {
        var data = _full_data.map(function(d){
            return d[_years[i]+"_"+_prefix];
        });
        dataset.push(data);
    }
    return dataset;
}
//get employ total premium by year(s)
function getPremium(_full_data, _years) {
    var dataset = [];
    for (i = 0; i<_years.length; i++) {
        var data = _full_data.map(function(d){
            return d[_years[i]+"_Employee_Contribution"] + d[_years[i]+"_Deductible"];
        });
        dataset.push(data);
    }
    return dataset;
}
//get employ premium increase by year(s)
function getPremiumIncrease(_full_data, _years) {
    var dataset = [];
    for (i = 0; i<_years.length && _years[0]<2016; i++) {
        var data = _full_data.map(function(d){
            var premium_inc_1  = d[_years[i]+"_Employee_Contribution"] + d[_years[i]+"_Deductible"];
            var premium_inc_2  = d[_years[i]+1+"_Employee_Contribution"] + d[_years[i]+1+"_Deductible"];
            return parseFloat((premium_inc_2-premium_inc_1)/premium_inc_1);
        });
        dataset.push(data);
    }
    return dataset;
}
//get employ premium vs income by year(s)
function getPremiumIncome(_full_data, _years) {
    var dataset = [];
    for (i = 0; i<_years.length; i++) {
        var data = _full_data.map(function(d){
            return (d[_years[i]+"_Employee_Contribution"] + d[_years[i]+"_Deductible"])/d[_years[i]+"_Income"];
        });
        dataset.push(data);
    }
    return dataset;
}
//get tab index
function getSelectedTab() {
    return $("#chart-tabs").tabs("option", "active");
}
//get checked states
function getSelectedStates() {
    return $("#state-set input[name='states']:checked").val();
}
//get checked visualization option
function getSelectedVis() {
    return $("#visual-option input[name='tab-viz-option']:checked").val();
}
//get tab title
function getCurTabTitle() {
    return $("#chart-tabs ul li[tabindex='0'] a").text();
}
//get current year from slider
function getCurYear() {
    return $("#year-slider").slider("option", "value");
}


//create svg for comparison panel
var margin = {top: 30, right: 30, left: 30, bottom: 40};
var svg_comp;

function initVisComp() {
    var width_comp = $("#tab-comparison").width();
    var height_comp = width_comp*0.8;
    svg_comp = d3.select("#tab-comparison")
        .append("svg")
        .attr("width", width_comp)
        .attr("height", height_comp);
}

//compare panel
var compare = function (event, ui) {
    //remove svg
    $("#comp-svg").remove();

    var data_selected = [];
    var data_other = [];
    var filtered_data = [];
    var other_data = [];
    var full_data = event.data.dataset;
    var states = getSelectedStates();
    var current_tab = getSelectedTab();
    var year = getCurYear();
    console.log(current_tab);

    filtered_data = full_data.filter(function(d) {
        switch (states) {
            case "rep": return d["2016_Votes"] == "Republican";
            case "dem": return d["2016_Votes"] == "Democratic";
            case "shifter": return d["Shift_Flag"] == "Shifter";
            default: return true;
        }
    });

    other_data = full_data.filter(function(d) {
        switch (states) {
            case "rep": return d["2016_Votes"] != "Republican";
            case "dem": return d["2016_Votes"] != "Democratic";
            case "shifter": return d["Shift_Flag"] != "Shifter";
            default: return false;
        }
    });

    switch (current_tab) {
        case 0:
            data_selected = getPremium(filtered_data, [year]);
            data_other = getPremium(other_data, [year]);
            break;
        case 1:
            data_selected = getPremiumIncrease(filtered_data, [year]);
            data_other = getPremiumIncrease(other_data, [year]);
            break;
        case 2:
            data_selected = getPremiumIncome(filtered_data, [year]);
            data_other = getPremiumIncome(other_data, [year]);
            break;
        default:
            data_selected = getPremium(filtered_data, [year]);
            data_other = getPremium(other_data, [year]);
    }

    var min_data = d3.min([d3.min(data_selected[0]),d3.min(data_other[0])]);
    var max_data = d3.max([d3.max(data_selected[0]),d3.max(data_other[0])]);
    var width_comp = $("#tab-comparison").width();
    var height_comp = width_comp*0.8;
    var bin_count = 6;

    var x = d3.scaleLinear()
        .domain([min_data, max_data])
        .rangeRound([margin.left, width_comp-margin.right]);

    var bins_selected = d3.histogram()
        .domain(x.domain())
        .thresholds(d3.range(min_data, max_data, (max_data - min_data)/bin_count))
        (data_selected[0]);

    var bins_other = d3.histogram()
        .domain(x.domain())
        .thresholds(d3.range(min_data, max_data, (max_data - min_data)/bin_count))
        (data_other[0]);

    var y_height = d3.max([d3.max(bins_selected, function(d){ return d.length/data_selected[0].length}),d3.max(bins_other, function(d){ return d.length/data_other[0].length})]);

    var y = d3.scaleLinear()
        .domain([0, y_height])
        .range([height_comp-margin.bottom, margin.top]);

    svg_comp = d3.select("#tab-comparison")
        .append("svg")
        .attr("id", "comp-svg")
        .attr("width", width_comp)
        .attr("height", height_comp);

    svg_comp.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0, "+(height_comp-margin.bottom)+")")
        .call(d3.axisBottom(x));

    svg_comp.append("text")
        .attr("class", "axis-label")
        .attr("y", height_comp-5)
        .attr("x", width_comp/2)
        .style("text-anchor", "middle")
        .text(getCurTabTitle());

    var tip_comp_1 = d3.tip()
        .attr("class", "d3-tip")
        .offset([-10, 0])
        .html(function(d) {
            return "<strong>Number of States: </strong>"+d.length+"<br><strong>Percentage: </strong>"+(d.length/data_other[0].length*100).toFixed(2)+"%"+"<br><Strong>Max: </Strong>"+d.x1.toFixed(2)+"<br><Strong>Min: </Strong>"+d.x0.toFixed(2);
        });

    var tip_comp_2 = d3.tip()
        .attr("class", "d3-tip")
        .offset([-10, 0])
        .html(function(d) {
            return "<strong>Number of States: </strong>"+d.length+"<br><strong>Percentage: </strong>"+(d.length/data_selected[0].length*100).toFixed(2)+"%"+"<br><Strong>Max: </Strong>"+d.x1.toFixed(2)+"<br><Strong>Min: </Strong>"+d.x0.toFixed(2);
        });

    svg_comp.call(tip_comp_1);
    svg_comp.call(tip_comp_2);

    //others bar
    if (data_other[0].length != 0) {
        var bar_other = svg_comp.selectAll(".bar-other").data(bins_other);
        bar_other.enter().append("g")
            .attr("class", "bar-other")
            .attr("transform", function(d){return "translate(0,"+y(d.length/data_other[0].length)+")";})
            .append("rect")
            .attr("x", 1)
            .attr("width", (x(bins_other[0].x1) - x(bins_other[0].x0) - 1))
            .attr("height", function(d) { return height_comp-margin.bottom - y(d.length/data_other[0].length); })
            .attr("fill", function(d) { return "#cccccc"; }) //#286c9b
            .attr("fill-opacity", 0.8)
            .on("mouseover", tip_comp_1.show)
            .on("mouseout", tip_comp_1.hide)
            .transition()
                .duration(500)
                .attr("transform", function(d){return "translate("+x(d.x0)+",0)"; });
    }

    //selected bar
    var bar = svg_comp.selectAll(".bar").data(bins_selected);
    bar.enter().append("g")
        .attr("class", "bar")
        .attr("transform", function(d){return "translate(0,"+y(d.length/data_selected[0].length)+")";})
        .append("rect")
        .attr("x", 1)
        .attr("width", (x(bins_selected[0].x1) - x(bins_selected[0].x0) - 1))
        .attr("height", function(d) { return height_comp-margin.bottom - y(d.length/data_selected[0].length); })
        .attr("fill", function(d) { return "#56a0d3"; })
        .attr("fill-opacity", 0.6)
        .on("mouseover", tip_comp_2.show)
        .on("mouseout", tip_comp_2.hide)
        .transition()
            .duration(500)
            .attr("transform", function(d){return "translate("+x(d.x0)+",0)"; });




};