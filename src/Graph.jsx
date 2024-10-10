import React from "react";
import * as _ from "lodash";
import * as d3 from "d3";

export default class Graph extends React.Component {
  constructor(props) {
    super(props);
    this.vizRef = React.createRef();
  }

  componentDidUpdate() {
    if (this.props.data !== null) {
      this.draw();
    }
  }

  drag = (simulation) => {
    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    return d3
      .drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended);
  };

  linkArc = (d) => {
    const r = Math.hypot(d.target.x - d.source.x, d.target.y - d.source.y);
    return `
      M${d.source.x},${d.source.y}
      A${r},${r} 0 0,1 ${d.target.x},${d.target.y}
    `;
  };

  getGetMaximumUsedIn = () =>
    _.reduce(
      this.props?.data?.nodes ?? [],
      (acc, elem) => _.max([elem?.usedInDeep?.length ?? 0, acc]),
      0
    );
  getNodeR = (node) =>
    4 + ((node?.usedInDeep?.length ?? 0) / this.getGetMaximumUsedIn()) * 30;

  draw = () => {
    this.vizRef.current.innerHTML = null;

    const width = 4000;
    const height = 4000;

    const simulation = d3
      .forceSimulation(this.props.data.nodes)
      .force("x", d3.forceX(width / 2))
      .force("y", d3.forceY(height / 2))
      .force(
        "link",
        d3
          .forceLink()
          .distance(10)
          .id((d) => d.id)
          .links(this.props.data.links)
      )
      .force("charge", d3.forceManyBody().strength(-200))
      .force(
        "collide",
        d3.forceCollide().radius((d) => (this.getNodeR(d) + 1) * 2)
      );

    const svg = d3
      .select("#dataviz")
      .append("svg")
      .attr("viewBox", [0, 0, width, height])
      .attr("width", width)
      .attr("height", height)
      .attr("style", "max-width: 100%; height: auto; font: 12px sans-serif;");

    const tooltip = d3
      .select("#dataviz")
      .append("div")
      .style("opacity", 0)
      .attr("class", "tooltip")
      .style("background-color", "white")
      .style("border", "solid")
      .style("border-width", "2px")
      .style("border-radius", "5px")
      .style("padding", "5px");

    const mouseover = function (d) {
      tooltip.style("opacity", 1);
      // d.style("stroke", "black").style("opacity", 1);
    };
    const mousemove = function (d) {
      tooltip
        .html(d?.caption ?? d.name)
        .style("left", d.x + 70 + "px")
        .style("top", d.y + "px");
    };
    const mouseleave = function (d) {
      tooltip.style("opacity", 0);
      // d.style("stroke", "none").style("opacity", 0.8);
    };

    svg
      .append("defs")
      .append("marker")
      .attr("id", "arrow")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 15)
      .attr("refY", -0.5)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("fill", "#aaa")
      .attr("d", "M0,-5L10,0L0,5");

    const link = svg
      .append("g")
      .attr("fill", "none")
      .attr("stroke-width", 1.5)
      .selectAll("path")
      .data(this.props.data.links)
      .join("path")
      .attr("stroke", "#aaa")
      .attr("marker-end", `url(${new URL(`#arrow`, location)})`);

    const node = svg
      .append("g")
      .on("mouseover", mouseover)
      .on("mousemove", mousemove)
      .on("mouseleave", mouseleave)
      .attr("fill", "currentColor")
      .attr("stroke-linecap", "round")
      .attr("stroke-linejoin", "round")
      .selectAll("g")
      .data(this.props.data.nodes)
      .join("g")
      .call(this.drag(simulation));

    node
      .append("circle")
      .attr("stroke", "white")
      .attr("stroke-width", 1.5)
      .attr("r", this.getNodeR);

    node
      .append("text")
      .attr("x", 8)
      .attr("y", "0.31em")
      .text((d) => d?.caption ?? d.name)
      .clone(true)
      .lower()
      .attr("fill", "none")
      .attr("stroke", "white")
      .attr("stroke-width", 3);

    simulation.on("tick", () => {
      link.attr("d", this.linkArc);
      node.attr("transform", (d) => `translate(${d.x},${d.y})`);
    });
  };

  render() {
    return <div id="dataviz" ref={this.vizRef}></div>;
  }
}
