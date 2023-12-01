//returns the json of the filepath provided
function getJson(filepath) {
    return fetch(filepath)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .catch(error => {
            console.error(`Error reading ${filepath}:`, error);
        });
}

function createPieChart(mapSvg, data, x, y) {
    // Remove any existing pie charts
    mapSvg.selectAll(".pie-chart").remove();

    let radius = 35; // Radius of the pie chart

    let pie = d3.pie()
        .value(d => d.value);

    let arc = d3.arc()
        .innerRadius(0)
        .outerRadius(radius);

    // Create a group to hold the pie chart
    let pieGroup = mapSvg.append("g")
        .attr("transform", `translate(${x}, ${y})`)
        .attr('class', 'pie-chart');

    pieGroup.selectAll("path")
        .data(pie(data))
        .enter()
        .append("path")
        .attr("d", arc)
        .attr("fill", function(d, i) {
            return i === 0 ? "red" : "snow"; // Blue for state, yellow for US
        })
        .attr("stroke", "black") // Add a black outline
        .attr("stroke-width", .15); // Set the width of the outline
}
//returns state name
function getStateAbbreviation(fullStateName) {
    const stateDictionary = {
        'Alabama': 'AL',
        'Alaska': 'AK',
        'Arizona': 'AZ',
        'Arkansas': 'AR',
        'California': 'CA',
        'Colorado': 'CO',
        'Connecticut': 'CT',
        'Delaware': 'DE',
        'Florida': 'FL',
        'Georgia': 'GA',
        'Hawaii': 'HI',
        'Idaho': 'ID',
        'Illinois': 'IL',
        'Indiana': 'IN',
        'Iowa': 'IA',
        'Kansas': 'KS',
        'Kentucky': 'KY',
        'Louisiana': 'LA',
        'Maine': 'ME',
        'Maryland': 'MD',
        'Massachusetts': 'MA',
        'Michigan': 'MI',
        'Minnesota': 'MN',
        'Mississippi': 'MS',
        'Missouri': 'MO',
        'Montana': 'MT',
        'Nebraska': 'NE',
        'Nevada': 'NV',
        'New Hampshire': 'NH',
        'New Jersey': 'NJ',
        'New Mexico': 'NM',
        'New York': 'NY',
        'North Carolina': 'NC',
        'North Dakota': 'ND',
        'Ohio': 'OH',
        'Oklahoma': 'OK',
        'Oregon': 'OR',
        'Pennsylvania': 'PA',
        'Rhode Island': 'RI',
        'South Carolina': 'SC',
        'South Dakota': 'SD',
        'Tennessee': 'TN',
        'Texas': 'TX',
        'Utah': 'UT',
        'Vermont': 'VT',
        'Virginia': 'VA',
        'Washington': 'WA',
        'West Virginia': 'WV',
        'Wisconsin': 'WI',
        'Wyoming': 'WY'
    };

    return stateDictionary[fullStateName] || 'State not found';
}


async function onPageLoadSetup(covidData) {



    let covidDataJson = await getJson(covidData);


    const width = 900;
    const height = 600;
    const margin = {
        top: 20,
        right: 20,
        bottom: 30,
        left: 50,
    };

    d3.json('us-states.json').then(function (geojson) {

        const totalCasesArray = [];

        for (let i = 0; i < covidDataJson.length; i++) {
            if (covidDataJson[i].State === undefined)
                continue;

            totalCasesArray.push(covidDataJson[i].Total_Cases);
        }


        let min = d3.min(totalCasesArray)
        let max = d3.max(totalCasesArray)
        let colorScale =
        d3.scaleSequential(d3.interpolateRgb("white","red"))
    
        colorScale.domain([min, max])

        
      let mapDiv = d3.select('#map');

      mapDiv.html('');
      
        let mapSvg = d3.select('#map')
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            


            

            

        //Map projection
        const projection = d3.geoAlbersUsa()
            .scale(1000)  //Adjust to make map larger
            .translate([width / 2, height / 2]);

        //Path generator
        const path = d3.geoPath()
            .projection(projection)

        //Draw states
        mapSvg.selectAll('.state')
            .data(geojson.features)
            .enter().append('path')
            .attr('class', 'state')
            .attr('d', path)
            .style('fill', d => {

                // const cases = covidData[d.properties.NAME];
                // console.log(d.properties.NAME,)
                let cases = 0;
                for (let i = 0; i < covidDataJson.length; i++) {

                    if (getStateAbbreviation(d.properties.NAME) === covidDataJson[i].State) {
                        // console.log(covidDataJson[i].State, covidDataJson[i].Total_Cases)
                        cases = covidDataJson[i].Total_Cases
                    }
                }

                return colorScale(cases);
            })
            .style('stroke', 'black')
            .on('mouseover', function (event, d) {
                const [x, y] = d3.pointer(event);
            
                // Remove any existing popups and pie charts
                mapSvg.selectAll(".popup").remove();
                mapSvg.selectAll(".pie-chart").remove();
            
                let stateCases = 0;
                let totalUSCases = 0;
            
                // Calculate state cases and total US cases
                for (let i = 0; i < covidDataJson.length; i++) {
                    totalUSCases += covidDataJson[i].Total_Cases;
                    if (getStateAbbreviation(d.properties.NAME) === covidDataJson[i].State) {
                        stateCases = covidDataJson[i].Total_Cases;
                    }
                }
            
                let pieData = [
                    {name: "State", value: stateCases},
                    {name: "US", value: totalUSCases - stateCases}
                ];
            
                
            
                const text = `${d.properties.NAME}: ${stateCases.toLocaleString()}`;
                const textWidth = text.length * 7;
            
                // Check if user is clicking close to border
                const xOffset = (x + textWidth + 10 > mapSvg.node().getBoundingClientRect().width) ? (-textWidth - 10) : 10;
            
                // Popup rectangle
                mapSvg.append('rect')
                    .attr('x', x + xOffset)
                    .attr('y', y - 15)
                    .attr('width', textWidth)
                    .attr('height', 20)
                    .style('fill', 'white')
                    .style('stroke', 'black')
                    .style('border-radius', '10px')
                    .style('border', '10px')
                    .style('padding', '10px')
                    .attr('class', 'popup');
            
                // Popup text
                mapSvg.append('text')
                    .attr('x', x + xOffset +10)
                    .attr('y', y)
                    .style('fill', 'black')
                    .style('font-size', '12px')
                    .attr('class', 'popup')
                    .text(text);

                // Create pie chart with state and US data
                createPieChart(mapSvg, pieData, x + xOffset +60, y +45);
            })
            

            .on('mouseleave', function (event, d) {
                mapSvg.selectAll(".popup").remove();
                mapSvg.selectAll(".pie-chart").remove();


            });

        //Legend for heatmap


        const legendWidth = 300;
        const legendHeight = 20;
        const legendMargin = { left: 50, top: 10 };

        //clear div before use
        let legendDiv = d3.select('#mapLegend');
        legendDiv.html('');

        let legendGroup = d3.select('#mapLegend')
    .append('svg')
    .append('g')
    .attr('width', legendWidth)
    .attr('height', legendHeight);

// Legend gradient
const gradient = legendGroup.append('defs')
    .append('linearGradient')
    .attr('id', 'gradient')
    .attr('x1', '0%')
    .attr('y1', '0%')
    .attr('x2', '100%')
    .attr('y2', '0%');

// Get color stops based on the color scale domain
const colorStops = colorScale.ticks(10).map((tick, i, arr) => {
    return {
        offset: (i / (arr.length - 1)) * 100 + '%',
        color: colorScale(tick)
    };
});

// Add gradient stops dynamically
colorStops.forEach(stop => {
    gradient.append('stop')
        .attr('offset', stop.offset)
        .style('stop-color', stop.color);
});

legendGroup.append('rect')
    .attr('width', legendWidth)
    .attr('height', legendHeight)
    .style('fill', 'url(#gradient)');

// Legend labels
const legendDomain = colorScale.domain();

legendGroup.append('text')
    .attr('x', 0)
    .attr('y', legendHeight + 15)
    .text(legendDomain[0].toLocaleString());

legendGroup.append('text')
    .attr('x', legendWidth)
    .attr('y', legendHeight + 15)
    .attr('text-anchor', 'end')
    .text(legendDomain[1].toLocaleString());

legendGroup.append('text')
    .attr('x', legendWidth / 2)
    .attr('y', legendHeight + 40)
    .attr('text-anchor', 'middle')
    .text('Total');


        //set total cases
        let totalCases = 0;
        for (let i = 0; i < covidDataJson.length; i++) {

            totalCases += covidDataJson[i].Total_Cases

        }
        //console.log(totalCases);
        d3.select('#total')
            .text(`Total: ${totalCases.toLocaleString()}`);

        //End Legend for heatmap


    });
    
    d3.json('data/CovidHesitancyAveragesByState.json').then(data => {
        const metric = 'Average_Estimated_hesitant';
    
        const width = 1500;
        const height = 700;
    
        const margin = {
            top: 0,
            right: 400,
            bottom: 100,
            left: 200,
        };
    
        let barChartDiv = d3.select('#bar-chart');
        barChartDiv.html('');
    
        let barChartSvg = d3.select('#bar-chart')
            .append('svg')
            .attr('width', width)
            .attr('height', height);
    
        // Y-axis label
        barChartSvg.append("text")
            .attr("class", "y-axis-label")
            .attr("transform", "rotate(-90)")
            .attr("x", -(height / 2))
            .attr("y", margin.left - 125) // Adjust the y position as needed
            .style("text-anchor", "middle")
            .style("font-size", "16px")
            .style("font-weight", "bold")
            .text("US States");
    
        // X-axis label (horizontal)
        barChartSvg.append("text")
            .attr("class", "x-axis-label")
            .attr("x", width / 2)
            .attr("y", height - margin.bottom + 40)
            .style("text-anchor", "middle")
            .style("font-weight", "bold")
            .style("font-size", "16px")
            .text("Average Hesitancy by State Population");
    
        // Y Scale
        const yScale = d3.scaleBand()
            .domain(data.map(d => d.State))
            .range([margin.top, height - margin.bottom])
            .padding(0.1);
    
        // X Scale
        const xScale = d3.scaleLinear()
            .domain([0, d3.max(data, d => d[metric])])
            .range([margin.left, width - margin.right]);
    
        const yAxis = d3.axisLeft(yScale);
    
        barChartSvg.append('g')
            .attr('class', 'y-axis')
            .attr('transform', `translate(${margin.left}, 0)`)
            .call(yAxis);

        
    
            const xAxis = d3.axisBottom(xScale)
            .tickFormat(d3.format(".0%")); // Format as percentage
    
    
        barChartSvg.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0, ${height - margin.bottom})`)
            .call(xAxis);
    
        // Draw the bars
        barChartSvg.selectAll('.bar')
            .data(data)
            .enter()
            .append('rect')
            .attr('class', 'bar')
            .attr('y', d => yScale(d.State))
            .attr('x', margin.left)
            .attr('height', yScale.bandwidth())
            .attr('width', d => xScale(d[metric]) - margin.left)
            .style('fill', 'red') // Make the bars red
            .on('mouseover', function (event, d) {
                // Show state name and number in a box on mouseover
                const stateName = d.State;
                const stateNumber = d3.format(".1%")(d[metric]);
                d3.select(this).style('fill', 'orange'); // Change color on mouseover
                showStateInfoBox(stateName, stateNumber, event.pageX, event.pageY);
            })
            .on('mouseleave', function () {
                // Hide state name and number box on mouseleave
                d3.select(this).style('fill', 'red'); // Restore original color on mouseleave
                hideStateInfoBox();
            });
    
        // Function to show state name and number box
        function showStateInfoBox(stateName, stateNumber, x, y) {
    

            const boxContent = `<div><strong>${stateName}</strong></div><div>${stateNumber}</div>`;
            d3.select('body').append('div')
                .attr('class', 'state-info-box')
                .html(boxContent)
                .style('position', 'absolute')
                .style('left', x + 'px')
                .style('top', y + 'px')
                .style('padding', '8px')
                .style('background-color', 'white')
                .style('border', '1px solid #ccc')
                .style('border-radius', '5px');
        }
    
        // Function to hide state name and number box
        function hideStateInfoBox() {
            d3.select('.state-info-box').remove();
        }
    });
    // end Hesitancy graph
    
    
    //updateChart(data);

    function updateChart(data) {
        xScale.domain(d3.extent(data, d => d.date));
        yScale.domain([0, d3.max(data, d => d.value)]);

        lineChartSvg.select('.x.axis')
            .call(xAxis);

        lineChartSvg.select('.y.axis')
            .call(yAxis);

        path
            .datum(data)
            .transition()
            .attr('d', line);
    }

}


//Event Listeners
document.addEventListener('DOMContentLoaded', onPageLoadSetup('./data/FULL_Covid_Cases_By_State.json'));


let buttonFilter;

let radioButtons = document.querySelectorAll('input[name="filter"]');
// Add event listener to each radio button
radioButtons.forEach(button => {
  button.addEventListener('change', function() {
    // Print the value of the selected radio button
    //console.log('Selected filter:', this.value);

    if (this.value === "Cases") {
        buttonFilter = "Cases";
        onPageLoadSetup('./data/FULL_Covid_Cases_By_State.json')

      } else if (this.value === "Deaths") {
        buttonFilter = "Deaths";
        onPageLoadSetup('./data/json_output_YN_Variables/death_yn_Covid_Cases_By_State.json')

      } else if (this.value === "Exposures") {
        buttonFilter = "Exposures";

        onPageLoadSetup('./data/json_output_YN_Variables/exposure_yn_Covid_Cases_By_State.json')

      } else if (this.value === "Hospitalizations") {
        buttonFilter = "Hospitalizations";

        onPageLoadSetup('./data/json_output_YN_Variables/hosp_yn_Covid_Cases_By_State.json')

      } else if (this.value === "ICU") {
        buttonFilter = "ICU";

        onPageLoadSetup('./data/json_output_YN_Variables/icu_yn_Covid_Cases_By_State.json')

      } else if (this.value === "Underlying_Cond") {
        buttonFilter = "Underlying_Cond";

        onPageLoadSetup('./data/json_output_YN_Variables/underlying_conditions_yn_Covid_Cases_By_State.json')

      }

      else if (this.value === "Month [cases]") {
        buttonFilter = "Month [cases]";
        let dateFilterSelect = document.getElementById('dateFilter');
        let selectedDate = dateFilterSelect.value;
        
        let data = `data/json_output_byMonth/${selectedDate}_Covid_Cases_By_State.json`;
    
        console.log('Selected Month:', data);
        onPageLoadSetup(data);


      }

      console.log('filter', buttonFilter)


  });// end event listener


let dateFilterSelect = document.getElementById('dateFilter');

// Add an event listener for the 'change' event
dateFilterSelect.addEventListener('change', function () {
    // Get the selected value
    const selectedDate = dateFilterSelect.value;

    if(buttonFilter !== "Month [cases]")
    return;

    let data = `data/json_output_byMonth/${selectedDate}_Covid_Cases_By_State.json`;

    onPageLoadSetup(data);

    console.log('Selected Month:', data);
});
});