async function fetchData() {
  const response = await fetch('data.json');
  return await response.json();
}

function createPersonCard(person, id) {
  const div = document.createElement('div');
  div.className = 'person';
  div.id = `person-${id}`;
  div.innerHTML = `
    <div class="photo"></div>
    <strong>${person.name.first} ${person.name.middle || ''} ${person.name.last}</strong><br>
    <small>${person.birth.year}</small><br>
    <em>${person.bio.desc}</em>
  `;
  return div;
}

function drawLine(svg, fromEl, toEl) {
  const from = fromEl.getBoundingClientRect();
  const to = toEl.getBoundingClientRect();
  const svgBox = svg.getBoundingClientRect();

  const x1 = from.left + from.width / 2 - svgBox.left;
  const y1 = from.bottom - svgBox.top;
  const x2 = to.left + to.width / 2 - svgBox.left;
  const y2 = to.top - svgBox.top;

  const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line.setAttribute("x1", x1);
  line.setAttribute("y1", y1);
  line.setAttribute("x2", x2);
  line.setAttribute("y2", y2);
  line.setAttribute("stroke", "#333");
  line.setAttribute("stroke-width", "2");
  svg.appendChild(line);
}

function renderTree(data) {
  const parentGen = document.getElementById("parent-generation");
  const childGen = document.getElementById("child-generation");
  const svg = document.querySelector("svg.lines");

  svg.innerHTML = ""; // Clear lines
  parentGen.innerHTML = "";
  childGen.innerHTML = "";

  const rendered = new Set();
  const idToElement = {};

  // Identify top-level people (not children)
  const allChildren = new Set();
  for (const person of Object.values(data)) {
    (person.relations.children || []).forEach(cid => allChildren.add(cid.toString()));
  }

  const parents = Object.entries(data).filter(([id]) => !allChildren.has(id));

  // Render parents
  parents.forEach(([id, person]) => {
    const card = createPersonCard(person, id);
    parentGen.appendChild(card);
    idToElement[id] = card;
    rendered.add(id);
  });

  // Render children
  parents.forEach(([id, person]) => {
    (person.relations.children || []).forEach(cid => {
      if (!data[cid] || rendered.has(cid)) return;
      const childCard = createPersonCard(data[cid], cid);
      childGen.appendChild(childCard);
      idToElement[cid] = childCard;
      rendered.add(cid);
    });
  });

  function drawAllLines() {
    svg.innerHTML = "";
    parents.forEach(([id, person]) => {
      (person.relations.children || []).forEach(cid => {
        if (idToElement[id] && idToElement[cid]) {
          drawLine(svg, idToElement[id], idToElement[cid]);
        }
      });
    });
  }

  requestAnimationFrame(drawAllLines);
  window.addEventListener("resize", drawAllLines);
}

window.onload = async () => {
  const data = await fetchData();
  renderTree(data);
};
