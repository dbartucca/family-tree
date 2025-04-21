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

  function buildGen(ids, level) {
    if (!ids.length) return;
    generations[level] = generations[level] || [];
    generations[level].push(...ids);

    const nextGen = [];
    ids.forEach(id => {
      const children = data[id].relations.children || [];
      nextGen.push(...children.map(String));
    });

    buildGen([...new Set(nextGen)], level + 1);
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

window.onload = async () => {
  const data = await fetchData();
  const container = document.getElementById('tree');
  const svg = container.querySelector('svg');

  const generations = getGenerations(data);
  const idToEl = {};

  generations.forEach((gen, index) => {
    const levelDiv = document.createElement('div');
    levelDiv.className = 'level';
    gen.forEach(id => {
      const el = createPersonElement(data[id], id);
      idToEl[id] = el;
      levelDiv.appendChild(el);
    });
    container.appendChild(levelDiv);
  });

  // Wait for layout
  requestAnimationFrame(() => {
    for (const [id, person] of Object.entries(data)) {
      (person.relations.children || []).forEach(childId => {
        if (idToEl[id] && idToEl[childId]) {
          drawLines(svg, idToEl[id], idToEl[childId]);
        }
      });
  });
  });
});
