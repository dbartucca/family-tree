let rawData;
let childrenMap = {};

fetch("family-tree.json")
  .then(res => res.json())
  .then(data => {
    rawData = data;
    childrenMap = buildChildrenMap(data);
    const rootId = findRoot(data);
    renderTree(rootId);
    setupSearch();
  });

function buildChildrenMap(data) {
  const map = {};
  Object.keys(data).forEach(id => {
    const { mother, father } = data[id].relationships;

    [mother, father].forEach(parent => {
      if (!parent) return;
      if (!map[parent]) map[parent] = [];
      map[parent].push(id);
    });
  });
  return map;
}

function findRoot(data) {
  return Object.keys(data).find(id =>
    !data[id].relationships.mother &&
    !data[id].relationships.father
  );
}

function buildHierarchy(id) {
  const person = rawData[id];
  if (!person) return null;

  return {
    id: id,
    name: person.name.first + " " + person.name.last,
    data: person,
    children: (childrenMap[id] || []).map(childId => buildHierarchy(childId))
  };
}

function renderTree(rootId) {
  const width = window.innerWidth;
  const height = window.innerHeight;

  d3.select("#tree").selectAll("*").remove();

  const svg = d3.select("#tree")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .call(d3.zoom().on("zoom", (event) => {
      g.attr("transform", event.transform);
    }));

  const g = svg.append("g");

  const root = d3.hierarchy(buildHierarchy(rootId));
  const treeLayout = d3.tree().size([width - 200, height - 200]);
  treeLayout(root);

  // links
  g.selectAll(".link")
    .data(root.links())
    .enter()
    .append("path")
    .attr("class", "link")
    .attr("d", d3.linkVertical()
      .x(d => d.x)
      .y(d => d.y));

  // nodes
  const node = g.selectAll(".node")
    .data(root.descendants())
    .enter()
    .append("g")
    .attr("class", "node")
    .attr("transform", d => `translate(${d.x},${d.y})`)
    .on("click", (event, d) => showModal(d.data.data));

  node.append("circle")
    .attr("r", 20);

  node.append("text")
    .attr("dy", 40)
    .attr("text-anchor", "middle")
    .text(d => d.data.name);
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

    const match = Object.keys(rawData).find(id => {
      const p = rawData[id];
      return (
        p.name.first.toLowerCase().includes(value) ||
        p.name.last.toLowerCase().includes(value)
      );
    });

    if (match) renderTree(match);
  });
}
