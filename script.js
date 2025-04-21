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
    <small>${person.birth.year || ''}</small><br>
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

function assignGenerationsRecursive(data) {
  const generations = {};
  const visited = new Set();

  function computeGeneration(id) {
    if (generations[id] !== undefined) return generations[id];
    const person = data[id];
    if (!person) return 0;

    const children = person.relations.children || [];
    if (children.length === 0) {
      generations[id] = 0;
    } else {
      let maxChildGen = 0;
      for (const cid of children) {
        const childGen = computeGeneration(cid.toString());
        maxChildGen = Math.max(maxChildGen, childGen);
      }
      generations[id] = maxChildGen + 1;
    }

    // Ensure spouse has same generation
    const spouseId = person.relations.spouse?.toString();
    if (spouseId && data[spouseId]) {
      const spouseGen = generations[spouseId];
      if (spouseGen === undefined || spouseGen < generations[id]) {
        generations[spouseId] = generations[id];
        computeGeneration(spouseId); // recurse to ensure consistency
      }
    }

    return generations[id];
  }

  Object.keys(data).forEach(id => computeGeneration(id));
  return generations;
}

function renderTree(data) {
  const container = document.getElementById("tree-root");
  const svg = document.querySelector("svg.lines");
  container.innerHTML = "";
  svg.innerHTML = "";

  const generations = assignGenerationsRecursive(data);
  const genGroups = {};

  for (const [id, level] of Object.entries(generations)) {
    if (!genGroups[level]) genGroups[level] = new Set();
    genGroups[level].add(id);
  }

  const idToEl = {};

  for (const [level, ids] of Object.entries(genGroups)) {
    const row = document.createElement("div");
    row.className = "generation";

    const rendered = new Set();

    for (const id of ids) {
      if (rendered.has(id)) continue;

      const person = data[id];
      const spouseId = person.relations.spouse?.toString();

      if (spouseId && ids.has(spouseId) && !rendered.has(spouseId)) {
        const pair = document.createElement("div");
        pair.className = "spouse-pair";
        const el1 = createPersonCard(person, id);
        const el2 = createPersonCard(data[spouseId], spouseId);
        pair.appendChild(el1);
        pair.appendChild(el2);
        idToEl[id] = el1;
        idToEl[spouseId] = el2;
        rendered.add(id);
        rendered.add(spouseId);
        row.appendChild(pair);
      } else {
        const el = createPersonCard(person, id);
        idToEl[id] = el;
        rendered.add(id);
        row.appendChild(el);
      }
    }

    container.appendChild(row);
  }

  function drawAllLines() {
    svg.innerHTML = "";
    for (const [id, person] of Object.entries(data)) {
      const parentEl = idToEl[id];
      if (!parentEl) continue;

      (person.relations.children || []).forEach(cid => {
        const childEl = idToEl[cid];
        if (childEl) {
          drawLine(svg, parentEl, childEl);
        }
      });
    }
  }

  requestAnimationFrame(drawAllLines);
  window.addEventListener("resize", drawAllLines);
}

window.onload = async () => {
  const data = await fetchData();
  renderTree(data);
};
