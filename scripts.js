let rawData;
let simulation;
let svg, g;

fetch("family-tree.json")
  .then(res => res.json())
  .then(data => {
    rawData = data;
    buildGraph();
    setupSearch();
  });

function buildGraph() {

  const nodes = [];
  const links = [];

  Object.keys(rawData).forEach(id => {
    const p = rawData[id];

    nodes.push({
      id: id,
      name: p.name.first + " " + p.name.last,
      data: p
    });

    const rel = p.relationships;

    if (rel.mother)
      links.push({ source: rel.mother, target: id, type: "parent" });

    if (rel.father)
      links.push({ source: rel.father, target: id, type: "parent" });

    if (rel.spouse)
      links.push({ source: id, target: rel.spouse, type: "spouse" });
  });

  const width = window.innerWidth;
  const height = window.innerHeight;

  svg = d3.select("#graph")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .call(d3.zoom().on("zoom", (event) => {
      g.attr("transform", event.transform);
    }));

  g = svg.append("g");

  simulation = d3.forceSimulation(nodes)
    .force("link", d3.forceLink(links)
      .id(d => d.id)
      .distance(d => d.type === "spouse" ? 50 : 120)
    )
    .force("charge", d3.forceManyBody().strength(-300))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("collision", d3.forceCollide().radius(40));

  const link = g.selectAll(".link")
    .data(links)
    .enter()
    .append("line")
    .attr("class", d => d.type === "spouse" ? "link-spouse" : "link-parent");

  const node = g.selectAll(".node")
    .data(nodes)
    .enter()
    .append("g")
    .attr("class", "node")
    .call(d3.drag()
      .on("start", dragStarted)
      .on("drag", dragged)
      .on("end", dragEnded)
    )
    .on("click", (event, d) => showModal(d.data));

  node.append("circle")
    .attr("r", 25);

  node.append("text")
    .attr("text-anchor", "middle")
    .attr("dy", 40)
    .text(d => d.name);

  simulation.on("tick", () => {
    link
      .attr("x1", d => d.source.x)
      .attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x)
      .attr("y2", d => d.target.y);

    node.attr("transform", d => `translate(${d.x},${d.y})`);
  });
}

function dragStarted(event, d) {
  if (!event.active) simulation.alphaTarget(0.3).restart();
  d.fx = d.x;
  d.fy = d.y;
}

function dragged(event, d) {
  d.fx = event.x;
  d.fy = event.y;
}

function dragEnded(event, d) {
  if (!event.active) simulation.alphaTarget(0);
  d.fx = null;
  d.fy = null;
}

function showModal(person) {
  const modal = document.getElementById("modal");
  const content = document.getElementById("modal-content");

  content.innerHTML = `
    <h2>${person.name.first} ${person.name.last}</h2>
    <p><b>Born:</b> ${person.birth.year || "Unknown"}</p>
    <p>${person.bio.desc || ""}</p>
  `;

  modal.classList.remove("hidden");
  modal.onclick = () => modal.classList.add("hidden");
}

function setupSearch() {
  document.getElementById("search").addEventListener("input", e => {
    const value = e.target.value.toLowerCase();

    g.selectAll(".node circle")
      .attr("fill", d =>
        d.name.toLowerCase().includes(value) ? "#ffcc00" : "#ffffff"
      );
  });
}

function resetView() {
  svg.transition().duration(750).call(
    d3.zoom().transform,
    d3.zoomIdentity
  );
}
