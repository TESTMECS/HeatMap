// Fetch data from the API
fetch(
  "https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/global-temperature.json"
)
  .then((response) => response.json())
  .then((data) => {
    // Set up chart dimensions
    const margin = { top: 80, right: 40, bottom: 100, left: 60 };
    const width = 1200 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    // Create SVG element
    const svg = d3
      .select("body")
      .append("svg")
      .attr("class", "map")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Create scales
    const xScale = d3
      .scaleBand()
      .range([0, width])
      .domain(data.monthlyVariance.map((d) => d.year))
      .padding(0);

    const yScale = d3
      .scaleBand()
      .rangeRound([0, height])
      .domain([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])
      .padding(0);

    const colorScale = d3
      .scaleSequential(d3.interpolateRdYlBu)
      .domain([
        d3.max(data.monthlyVariance, (d) => d.variance + data.baseTemperature),
        d3.min(data.monthlyVariance, (d) => d.variance + data.baseTemperature),
      ]);

    // Create axes
    const xAxis = d3
      .axisBottom(xScale)
      .tickValues(xScale.domain().filter((year) => year % 10 === 0))
      .tickFormat(d3.format("d"));

    const yAxis = d3
      .axisLeft()
      .scale(yScale)
      .tickValues(yScale.domain())
      .tickFormat((month) => {
        const date = new Date(0);
        date.setUTCMonth(month);
        return d3.utcFormat("%B")(date);
      })
      .tickSize(10, 1);

    svg
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(xAxis)
      .attr("id", "x-axis");

    svg.append("g").call(yAxis).attr("id", "y-axis");

    // Create heatmap cells
    svg
      .selectAll("rect")
      .data(data.monthlyVariance)
      .enter()
      .append("rect")
      .attr("class", "cell")
      .attr("data-month", (d) => d.month - 1)
      .attr("data-year", (d) => d.year)
      .attr("data-temp", (d) => data.baseTemperature + d.variance)
      .attr("x", (d) => xScale(d.year))
      .attr("y", (d) => yScale(d.month - 1))
      .attr("width", xScale.bandwidth())
      .attr("height", yScale.bandwidth())
      .attr("fill", (d) => colorScale(data.baseTemperature + d.variance));

    // Add title
    svg
      .append("text")
      .attr("id", "title")
      .attr("x", width / 2)
      .attr("y", -margin.top / 2)
      .attr("text-anchor", "middle")
      .style("font-size", "24px")
      .text("Monthly Global Land-Surface Temperature");

    // Add description
    svg
      .append("text")
      .attr("id", "description")
      .attr("x", width / 2)
      .attr("y", -margin.top / 4)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .text(
        `${data.monthlyVariance[0].year} - ${
          data.monthlyVariance[data.monthlyVariance.length - 1].year
        }: base temperature ${data.baseTemperature}℃`
      );

    // Add tooltip
    const tooltip = d3
      .select("body")
      .append("div")
      .attr("id", "tooltip")
      .style("opacity", 0);

    svg
      .selectAll("rect")
      .on("mouseover", (event, d) => {
        // make rect border bold when hovered
        d3.select(event.currentTarget)
          .style("stroke", "black")
          .style("stroke-width", "2px");
        const date = new Date(d.year, d.month - 1);
        const temperature = (data.baseTemperature + d.variance).toFixed(1);
        tooltip
          .style("opacity", 0.9)
          .html(
            `${d3.timeFormat("%Y - %B")(
              date
            )}<br>Temperature: ${temperature}℃<br>Variance: ${d.variance.toFixed(
              1
            )}℃`
          )
          .attr("data-year", d.year)
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mouseout", () => {
        tooltip.style("opacity", 0);
        d3.select(event.currentTarget)
          .style("stroke", "none")
          .style("stroke-width", "0px");
      });

    // Add legend
    const legendWidth = 400;
    const legendHeight = 20;
    const legendColors = colorScale.ticks(10).reverse();

    const legend = svg
      .append("g")
      .attr("id", "legend")
      .attr(
        "transform",
        `translate(${(width - legendWidth) / 2}, ${
          height + margin.bottom - 40
        })`
      );

    legend
      .selectAll("rect")
      .data(legendColors)
      .enter()
      .append("rect")
      .attr("x", (d, i) => i * (legendWidth / legendColors.length))
      .attr("y", 0)
      .attr("width", legendWidth / legendColors.length)
      .attr("height", legendHeight)
      .attr("fill", (d) => colorScale(d));

    const legendScale = d3
      .scaleLinear()
      .domain([
        d3.min(data.monthlyVariance, (d) => data.baseTemperature + d.variance),
        d3.max(data.monthlyVariance, (d) => data.baseTemperature + d.variance),
      ])
      .range([0, legendWidth]);

    const legendAxis = d3
      .axisBottom(legendScale)
      .tickFormat(d3.format(".1f"))
      .ticks(10);

    legend
      .append("g")
      .attr("transform", `translate(0, ${legendHeight})`)
      .call(legendAxis);
  });
