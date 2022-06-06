/* The code for the chart is wrapped inside a function that automatically resizes the chart */
function makeResponsive() {

    /* if the SVG area isn't empty when the browser loads, remove it and replace it with a resized version of the chart */
    var svgArea = d3.select("body").select("div").select(".chart");
  
    // clear svg is not empty
    if (!svgArea.empty()) {
      svgArea.remove();
    }
  
    /* SVG wrapper dimensions are determined by BOTH the <div> container class 
    AND the current width andheight of the browser window. */
    var svgWidth = d3.select(".container").node().getBoundingClientRect().width;
    var svgHeight = window.innerHeight;
  
    var margin = {
      top: 50,
      bottom: 200,
      right: 60,
      left: 100
    };
  
    var height = svgHeight - margin.top - margin.bottom;
    var width = svgWidth - margin.left - margin.right;
  
    // Append SVG element
    var chart = d3.select("#scatter")
      .append("div")
      .classed("chart", true);

    var svg = chart.append("svg")  
      .attr("height", svgHeight)
      .attr("width", svgWidth);
  
    // Append group element
    var chartGroup = svg.append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Initial parameters
    var chosenXAxis = "poverty";
    var chosenYAxis = "healthcare";

    // Create function used for updating x-scale when the relevant axis label is clicked on
    function xScale(censusData, chosenXAxis) {
        // Define the x linear scale based on min&max of chosen X axis
        var xLinearScale = d3.scaleLinear()
            .domain([d3.min(censusData, d=> d[chosenXAxis]) * 0.8,
                     d3.max(censusData, d=> d[chosenXAxis]) * 1.2])
            .range([0,width]);
        
        // Create the Scale
        return xLinearScale;
    }

    // Create a function used for updating the y-scale when the relevant axis label is clicked on
    function yScale(censusData, chosenYAxis) {
        // Define the Y linear scale baed on min&max of chosen Y axis
        var yLinearScale = d3.scaleLinear()
            .domain([d3.min(censusData, d=> d[chosenYAxis]) *0.8,
                     d3.max(censusData, d=> d[chosenYAxis]) * 1.2])
            .range([height, 0]);
        
        // Create the Y Scale
        return yLinearScale;
    }

    // Create a function to transitionally update the x-axis when relevant axis label is clicked on
    function renderXAxis(newXScale, xAxis) {
        var bottomAxis = d3.axisBottom(newXScale);

        xAxis.transition()
             .duration(2000)
             .call(bottomAxis);
        
        return xAxis;
    }

    // Create a function to transitionally update Y-axis when new axis label is clicked on
    function renderYAxis(newYScale, yAxis) {
        var leftAxis = d3.axisLeft(newYScale);

        yAxis.transition()
            .duration(2000)
            .call(leftAxis);

        return yAxis;
    }

    // Create a function to render data circles and transition to new circles based on axis clicked on
    function renderCircles(circlesGroup, newXScale, chosenXAxis, newYScale, chosenYAxis) {
        circlesGroup.transition()
                    .duration(2000)
                    .attr("cx", d => newXScale(d[chosenXAxis]))
                    .attr("cy", d => newYScale(d[chosenYAxis]));
        
        return circlesGroup;
    }

    // Create a function to render text within each circle\
    // Similar to renderCircles function just with a text group this time
    function renderText(textGroup, newXScale, chosenXAxis, newYScale, chosenYAxis) {

        textGroup.transition()
                 .duration(2000)
                 .attr('x', d => newXScale(d[chosenXAxis]))
                 .attr('y', d => newYScale(d[chosenYAxis]));
    
        return textGroup;
    }

    // Create a function to assign appropriate styling to tooltip values
    function styleXLabels(value, chosenXAxis) {
        // Style value based on variable
        if (chosenXAxis === "poverty") {
            return (`${value}%`);
        }
        else if (chosenXAxis === "income") {
            // Using native JS formatting to format income float to US dollars
            let dollarUS = Intl.NumberFormat('en-US'); 
            return (`$${dollarUS.format(value)}`);
        }
        else {
            return (`${value}`);
        }
    }

    // Create a function to update the circles with new tooltip info
    function updateTooltip(chosenXAxis, chosenYAxis, circlesGroup) {

        // Create a variable to store x-axis tooltip labels
        var xLabel;
        if (chosenXAxis === "poverty") {
            xLabel = "Poverty Rate";
        }
        else if (chosenXAxis === "age") {
            xLabel = "Median Age";
        }
        else {
            xLabel = "Median Household Income";
        }

        //Create a variable to store y-axis tooltip labels
        var yLabel;
        if (chosenYAxis === "healthcare") {
            yLabel="Lacking Healthcare";
        }
        else if (chosenYAxis === "smokes") {
            yLabel = "Smoker Rate";
        }
        else {
            yLabel = "Obesity Rate";
        }

        // Create a tooltip variable using D3
        var tooltip = d3.tip()
            .attr("class", "d3-tip")
            .offset([10,-10])
            // NOTE: using styleXLabels function here
            .html(d => `${d.state}<br>${xLabel}: ${styleXLabels(d[chosenXAxis], chosenXAxis)}<br>${yLabel}: ${d[chosenYAxis]}%`)

        circlesGroup.call(tooltip);

        circlesGroup.on("mouseover", d => tooltip.show(d))
                    .on("mouseout", d => tooltip.hide(d));
        
        return circlesGroup;
    }

    // Retrieve the data from the CSV
    d3.csv("assets/data/data.csv").then(function(censusData, err) {
        if (err) throw err;

        console.log(censusData);

        // Parse the data points as integers
        censusData.forEach(function(d) {
            // X-axis data
            d.poverty = +d.poverty;
            d.age = +d.age;
            d.income = +d.income;
            // Y-axis data
            d.healthcare = +d.healthcare;
            d.smokes = +d.smokes;
            d.obesity = +d.obesity;
        });

        // Call the xScale and yScale functions to generate the initial scales
        var xLinearScale = xScale(censusData, chosenXAxis);
        var yLinearScale = yScale(censusData, chosenYAxis);

        // Create initial axes
        var bottomAxis = d3.axisBottom(xLinearScale);
        var leftAxis = d3.axisLeft(yLinearScale);

        // Append initial X and Y axis to chartGroup
        var xAxis = chartGroup.append("g")
            .attr("transform", `translate(0, ${height})`)
            .call(bottomAxis);

        var yAxis = chartGroup.append("g")
            .call(leftAxis);

        // Append initial circles
        var circlesGroup = chartGroup.selectAll("circle")
            .data(censusData)
            .enter()
            .append("circle")
            .attr("cx", d => xLinearScale(d[chosenXAxis]))
            .attr("cy", d => yLinearScale(d[chosenYAxis]))
            .attr("r", 15)
            .classed("stateCircle", true)
            .attr("opacity", 0.7);

        // // Append initial text group
        var textGroup = chartGroup.selectAll('.stateText')
            .data(censusData)
            .enter()
            .append('text')
            .classed('stateText', true)
            .attr('x', d => xLinearScale(d[chosenXAxis]))
            .attr('y', d => yLinearScale(d[chosenYAxis]))
            .attr('dy', 3)
            .attr('font-size', '10px')
            .text(function(d){return d.abbr});

        // Create a group for three x-axis labels
        var xLabelsGroup = chartGroup.append("g")
            .attr("transform", `translate(${width/2}, ${height + 20})`);

        // Create the three x-axis labels
        var povertyLabel = xLabelsGroup.append("text")
            .classed("aText", true)
            .attr("x", 0)
            .attr("y", 20)
            .attr("value","poverty") // value to grab for event listener
            .classed("active", true)
            .text("Poverty Rate (%)");

        var ageLabel = xLabelsGroup.append("text")
            .classed("aText", true)
            .attr("x", 0)
            .attr("y", 40)
            .attr("value", "age") // value to grab for event listener
            .classed("inactive", true)
            .text("Median Age (years)");
        
        var incomeLabel = xLabelsGroup.append("text")
            .classed("aText", true)
            .attr("x", 0)
            .attr("y", 60)
            .attr("value", "income") // value to grab for event listener
            .classed("inactive", true)
            .text("Median Household Income ($)");

        // --------------------------------------
        // Create a group for three y-axis labels
        var yLabelsGroup = chartGroup.append("g")
            .attr("transform", `translate(0, ${height/2})`);

        // Create the three x-axis labels
        var healthcareLabel = yLabelsGroup.append("text")
            .classed("aText", true)
            .attr("x", 0)
            .attr("y", -45)
            .attr("transform", "rotate(-90)") // Rotate text
            .attr("dy", "1em")
            .attr("value","healthcare") // value to grab for event listener
            .classed("active", true)
            .text("Lacking Healthcare (%)");

        var smokesLabel = yLabelsGroup.append("text")
            .classed("aText", true)
            .attr("x", 0)
            .attr("y", -65)
            .attr("dy", "1em")
            .attr("transform", "rotate(-90)") // Rotate text
            .attr("value", "smokes") // value to grab for event listener
            .classed("inactive", true)
            .text("Smoker Rate (%)");
        
        var obesityLabel = yLabelsGroup.append("text")
            .classed("aText", true)
            .attr("x", 0)
            .attr("y", -85)
            .attr("dy", "1em")
            .attr("transform", "rotate(-90)") // Rotate text
            .attr("value", "obesity") // value to grab for event listener
            .classed("inactive", true)
            .text("Obesity Rate (%)");

        // ---------------------------------------------------------------
        // Update the tooltips using prev function
        var circlesGroup = updateTooltip(chosenXAxis, chosenYAxis, circlesGroup);

        // Create X-axis event listener
        xLabelsGroup.selectAll("text")
            .on("click", function() {
                // Get the value of the selection
                var value = d3.select(this).attr("value");

                // If statements to generate correct axes and values
                if (value !== chosenXAxis) {

                    // Replace the X axis with the new value
                    chosenXAxis = value;

                    console.log(chosenXAxis);

                    // Update the X linear scale with new data using xScale function
                    xLinearScale = xScale(censusData, chosenXAxis);

                    // Update the x-axis with a render transition
                    xAxis = renderXAxis(xLinearScale, xAxis);

                    // Update circles with new X values
                    circlesGroup = renderCircles(circlesGroup, xLinearScale, chosenXAxis, yLinearScale, chosenYAxis);

                    // Update tooltips with new information
                    circlesGroup = updateTooltip(chosenXAxis, chosenYAxis, circlesGroup)

                    // Update text with new X values
                    textGroup = renderText(textGroup, xLinearScale, chosenXAxis, yLinearScale, chosenYAxis);

                    // Change active and inactive axis labels
                    if(chosenXAxis === "poverty") {
                        povertyLabel.classed("active", true).classed("inactive", false);
                        ageLabel.classed("active", false).classed("inactive", true);
                        incomeLabel("active", false).classed("inactive", true);
                    }
                    else if(chosenXAxis === "age") {
                        povertyLabel.classed("active", false).classed("inactive", true);
                        ageLabel.classed("active", true).classed("inactive", false);
                        incomeLabel("active", false).classed("inactive", true);
                    }
                    else {
                        povertyLabel.classed("active", false).classed("inactive", true);
                        ageLabel.classed("active", false).classed("inactive", true);
                        incomeLabel("active", true).classed("inactive", false);
                    }
                }
            });

        // Create a Y-axis event listener
        yLabelsGroup.selectAll("text")
            .on("click", function() {
                // Get value of selection
                var value = d3.select(this).attr("value");

                // If statements to generate correct axes and values
                if (value !== chosenYAxis) {

                    // Replace Y axis with new value
                    chosenYAxis = value;
                    console.log(chosenYAxis);

                    // Update Y linear scale with new data using yScale function
                    yLinearScale = yScale(censusData, chosenYAxis);

                    // Update Y axis with render transition
                    yAxis = renderYAxis(yLinearScale, yAxis);

                    // Update circles with new Y values
                    circlesGroup = renderCircles(circlesGroup, xLinearScale, chosenXAxis, yLinearScale, chosenYAxis);
                    
                    // Update text with new X values
                    textGroup = renderText(textGroup, xLinearScale, chosenXAxis, yLinearScale, chosenYAxis);
                    
                    // Update tooltip
                    circlesGroup = updateTooltip(chosenXAxis, chosenYAxis, circlesGroup);

                    // Change active and inactive axis labels
                    if (chosenYAxis === "healthcare") {
                        healthcareLabel.classed("active", true).classed("inactive", false);
                        smokesLabel.classed("active", false).classed("inactive", true);
                        obesityLabel.classed("active", false).classed("inactive", true);
                    }
                    else if (chosenYAxis === "smokes") {
                        healthcareLabel.classed("active", false).classed("inactive", true);
                        smokesLabel.classed("active", true).classed("inactive", false);
                        obesityLabel.classed("active", false).classed("inactive", true);
                    }
                    else {
                        healthcareLabel.classed("active", false).classed("inactive", true);
                        smokesLabel.classed("active", false).classed("inactive", true);
                        obesityLabel.classed("active", true).classed("inactive", false);
                    }
                }
            });
    });
};

// When browser loads, makeResponsive() function is called
makeResponsive();

// When the browser window is resized, responsify() is called.
d3.select(window).on("resize", makeResponsive);