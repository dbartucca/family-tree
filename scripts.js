async function loadData() {
  const res = await fetch('data.json');
  return await res.json();
}

function createPersonBox(id, person) {
  const div = document.createElement('div');
  div.className = 'person';
  div.id = `person-${id}`;

  const img = new Image();
  img.src = `images/${id}.png`;
  img.onerror = () => {
    img.src = `images/${id}.jfif`;
    img.onerror = null;
  };

  img.alt = `${person.name.first}'s photo`;
  img.onload = () => div.prepend(img);

  const fullName = `${person.name.first} ${person.name.middle} ${person.name.last}`.replace(/\s+/g, ' ').trim();
  const info = document.createElement('div');
  info.innerHTML = `<strong>${fullName}</strong><br><small>Born ${person.birth.year}</small>`;
  div.appendChild(info);

  return div;
}

function assignGenerations(data) {
  const gens = {};
  const levels = {};
  const visited = new Set();

  // Build a child → parent map for top-down traversal
  const childrenMap = {};
  for (const id in data) {
    const { relations } = data[id];
    if (relations?.mother) {
      childrenMap[relations.mother] = childrenMap[relations.mother] || [];
      childrenMap[relations.mother].push(id);
    }
    if (relations?.father) {
      childrenMap[relations.father] = childrenMap[relations.father] || [];
      childrenMap[relations.father].push(id);
    }
  }

  function dfs(id, generation) {
    if (visited.has(id)) return;
    visited.add(id);

    levels[id] = generation;
    if (!gens[generation]) gens[generation] = [];
    gens[generation].push(id);

    const children = childrenMap[id] || [];
    children.forEach(childId => dfs(childId, generation + 1));

    const spouseId = data[id].relations?.spouse;
    if (spouseId && !visited.has(spouseId)) {
      // Keep spouse on same generation
      dfs(spouseId, generation);
    }
  }

  // Start from people with no parents (roots)
  Object.keys(data).forEach(id => {
    const person = data[id];
    if (!person.relations?.mother && !person.relations?.father) {
      dfs(id, 0);
    }
  });

  return gens;
}

function positionPeople(data, generations, container) {
  const positions = {};
  let y = 50;
  const spacingX = 200;
  const spacingY = 180;

  Object.keys(generations).sort((a, b) => a - b).forEach(genLevel => {
    const ids = generations[genLevel];
    let x = 50;
    ids.forEach(id => {
      const person = data[id];
      const box = createPersonBox(id, person);
      box.style.left = `${x}px`;
      box.style.top = `${y}px`;
      container.appendChild(box);
      positions[id] = { x: x + 80, y: y + 40 }; // center of the box
      x += spacingX;
    });
    y += spacingY;
  });

  return positions;
}

function drawLines(data, positions) {
  const canvas = document.getElementById('connection-canvas');
  const ctx = canvas.getContext('2d');

  canvas.width = document.body.scrollWidth;
  canvas.height = document.body.scrollHeight;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  Object.keys(data).forEach(id => {
    const person = data[id];
    const from = positions[id];
    if (!from) return;

    ['mother', 'father'].forEach(role => {
      const parentId = person.relations?.[role];
      if (parentId && positions[parentId]) {
        const to = positions[parentId];
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    });

    const spouseId = person.relations?.spouse;
    if (spouseId && positions[spouseId]) {
      const to = positions[spouseId];
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.strokeStyle = '#00aa00';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  });
}

async function renderTree() {
  const data = await loadData();
  const generations = assignGenerations(data);
  const nodesContainer = document.getElementById('nodes-container');
  const positions = positionPeople(data, generations, nodesContainer);
  drawLines(data, positions);
}

window.onload = renderTree;
