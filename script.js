async function fetchData() {
  const response = await fetch('data.json');
  return await response.json();
}

function createPersonElement(person, id) {
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

function getGenerations(data) {
  const childToParent = {};
  for (const [id, person] of Object.entries(data)) {
    person.relations.children.forEach(childId => {
      if (!childToParent[childId]) childToParent[childId] = [];
      childToParent[childId].push(id);
    });
  }

  const roots = Object.keys(data).filter(id => !(id in childToParent));
  const generations = [];

  function buildGen(ids, level, visited = new Set()) {
    if (!ids.length) return;
    generations[level] = generations[level] || [];

    const nextGen = new Set();

    ids.forEach(id => {
      if (visited.has(id)) return;

      const person = data[id];
      const spouseId = person.relations.spouse?.toString();

      if (spouseId && data[spouseId] && !visited.has(spouseId)) {
        generations[level].push([id, spouseId]);
        visited.add(id);
        visited.add(spouseId);
      } else {
        generations[level].push([id]);
        visited.add(id);
      }

      person.relations.children.forEach(childId => nextGen.add(childId.toString()));
    });

    buildGen([...nextGen], level + 1, visited);
  }

  buildGen(roots, 0);
  return generations;
}

function drawLines(svg, fromEl, toEl) {
  const fromBox = fromEl.getBoundingClientRect();
  const toBox = toEl.getBoundingClientRect();
  const svgBox = svg.getBoundingClientRect();

  const x1 = fromBox.left + fromBox.width / 2 - svgBox.left;
  const y1 = fromBox.bottom - svgBox.top;
  const x2 = toBox.left + toBox.width / 2 - svgBox.left;
  const y2 = toBox.top - svgBox.top;

  const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line.setAttribute("x1", x1);
  line.setAttribute("y1", y1);
  line.setAttribute("x2", x2);
  line.setAttribute("y2", y2);
  line.setAttribute("stroke", "#333");
  line.setAttribute("stroke-width", "2");
  svg.appendChild(line);
}

function drawSpouseLine(svg, el1, el2) {
  const box1 = el1.getBoundingClientRect();
  const box2 = el2.getBoundingClientRect();
  const svgBox = svg.getBoundingClientRect();

  const y = box1.top + box1.height / 2 - svgBox.top;
  const x1 = box1.right - svgBox.left;
  const x2 = box2.left - svgBox.left;

  const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line.setAttribute("x1", x1);
  line.setAttribute("y1", y);
  line.setAttribute("x2", x2);
  line.setAttribute("y2", y);
  line.setAttribute("stroke", "#666");
  line.setAttribute("stroke-width", "2");
  svg.appendChild(line);
}

function renderConnections(data, idToEl, svg) {
  svg.innerHTML = '';

  // Draw parent -> child lines
  for (const [id, person] of Object.entries(data)) {
    (person.relations.children || []).forEach(childId => {
      if (idToEl[id] && idToEl[childId]) {
        drawLines(svg, idToEl[id], idToEl[childId]);
      }
    });
  }

  // Draw spouse lines
  for (const [id, person] of Object.entries(data)) {
    const spouseId = person.relations.spouse?.toString();
    if (
      spouseId &&
      data[spouseId] &&
      id < spouseId && // Avoid drawing twice
      idToEl[id] && idToEl[spouseId]
    ) {
      drawSpouseLine(svg, idToEl[id], idToEl[spouseId]);
    }
  }
}

window.onload = async () => {
  const data = await fetchData();
  const container = document.getElementById('tree');
  const svg = container.querySelector('svg');

  const generations = getGenerations(data);
  const idToEl = {};

  generations.forEach((group, index) => {
    const levelDiv = document.createElement('div');
    levelDiv.className = 'level';

    group.forEach(pair => {
      const groupDiv = document.createElement('div');
      groupDiv.style.display = 'flex';
      groupDiv.style.alignItems = 'center';
      groupDiv.style.gap = '10px';

      pair.forEach(id => {
        const el = createPersonElement(data[id], id);
        idToEl[id] = el;
        groupDiv.appendChild(el);
      });

      levelDiv.appendChild(groupDiv);
    });

    container.appendChild(levelDiv);
  });

  function updateLines() {
    requestAnimationFrame(() => {
      renderConnections(data, idToEl, svg);
    });
  }

  updateLines();
  window.addEventListener('resize', updateLines);
};
