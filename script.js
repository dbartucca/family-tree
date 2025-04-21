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

function assignGenerations(data) {
  const generations = {};
  const visited = new Set();

  function assign(id, level) {
    if (visited.has(id)) return;
    visited.add(id);
    generations[id] = Math.max(generations[id] || 0, level);

    const person = data[id];
    const spouse = person.relations.spouse?.toString();
    if (spouse && !visited.has(spouse)) {
      generations[spouse] = level;
      visited.add(spouse);
    }

    (person.relations.children || []).forEach(cid => {
      assign(cid.toString(), level + 1);
    });
  }

  const allChildren = new Set();
  Object.values(data).forEach(p =>
    (p.relations.children || []).forEach(c => allChildren.add(c.toString()))
  );

  Object.keys(data).forEach(id => {
    if (!allChildren.has(id)) {
      assign(id, 0);
    }
  });

  return generations;
}

function renderTree(data) {
  const container = document.getElementById("tree-root");
  const svg = document.querySelector("svg.lines");
  container.innerHTML = "";
  svg.innerHTML = "";

  const generations = assignGenerations(data);
  const genGroups = {};

  Object.entries(generations).forEach(([id, level]) => {
    if (!genGroups[level]) genGroups[level] = new Set();
    genGroups[level].add(id);
  });

  const idToEl = {};

  Object.entries(genGroups).forEach(([level, ids]) => {
    const row = document.createElement("div");
    row.className = "generation";

    const rendered = new Set();

    ids.forEach(id => {
      if (rendered.has(id)) return;

      const person = data[id];
      const spouseId = person.relations.spouse?.toString();
      let pair;

      if (spouseId && ids.has(spouseId)) {
        pair = document.createElement("div");
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
    });

    container.appendChild(row);
  });

  function drawAllLines() {
    svg.innerHTML = "";
    Object.entries(data).forEach(([id, person]) => {
      const parentEl = idToEl[id];
      if (!parentEl) return;

      (person.relations.children || []).forEach(cid => {
        const childEl = idToEl[cid];
        if (childEl) {
          drawLine(svg, parentEl, childEl);
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
