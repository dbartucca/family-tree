let data, generations;

fetch('data.json')
  .then(res => res.json())
  .then(fetchedData => {
    data = fetchedData;
    generations = getGenerations(data);
    renderTree(data, generations);
    adjustCanvasSize();
    drawConnections();
  });

window.addEventListener('resize', () => {
  adjustCanvasSize();
  drawConnections();
});

function getGenerations(data) {
  const generations = [];
  for (const [id, person] of Object.entries(data)) {
    const generation = getGenerationForPerson(data, person);
    if (!generations[generation]) {
      generations[generation] = [];
    }
    generations[generation].push(id);
  }
  return generations;
}

function getGenerationForPerson(data, person, level = 0) {
  if (!person.relations.mother && !person.relations.father) return level;

  const mother = person.relations.mother ? data[person.relations.mother] : null;
  const father = person.relations.father ? data[person.relations.father] : null;

  let maxLevel = level;
  if (mother) maxLevel = Math.max(maxLevel, getGenerationForPerson(data, mother, level + 1));
  if (father) maxLevel = Math.max(maxLevel, getGenerationForPerson(data, father, level + 1));

  return maxLevel;
}

function renderTree(data, generations) {
  const container = document.getElementById('tree-container');
  // Remove existing person rows
  const existingRows = container.querySelectorAll('.person-row');
  existingRows.forEach(row => row.remove());

  generations.forEach(generation => {
    const row = document.createElement('div');
    row.classList.add('person-row');

    generation.forEach(id => {
      const person = document.createElement('div');
      person.classList.add('person');
      person.id = `person-${id}`;
      person.innerText = `${data[id].name.first} ${data[id].name.last}`;
      row.appendChild(person);
    });

    container.appendChild(row);
  });
}

function adjustCanvasSize() {
  const container = document.getElementById('tree-container');
  const canvas = document.getElementById('connections');
  canvas.width = container.offsetWidth;
  canvas.height = container.offsetHeight;
}

function drawConnections() {
  const canvas = document.getElementById('connections');
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);

  Object.entries(data).forEach(([id, person]) => {
    const from = document.getElementById(`person-${id}`);
    if (!from) return;

    if (person.relations.spouse) {
      const to = document.getElementById(`person-${person.relations.spouse}`);
      if (to) drawLine(from, to, ctx, 'red');
    }

    person.relations.children.forEach(childId => {
      const to = document.getElementById(`person-${childId}`);
      if (to) drawLine(from, to, ctx, 'blue');
    });
  });
}

function drawLine(from, to, ctx, color) {
  const container = document.getElementById('tree-container');
  const containerRect = container.getBoundingClientRect();
  const fromRect = from.getBoundingClientRect();
  const toRect = to.getBoundingClientRect();

  const x1 = fromRect.left + fromRect.width / 2 - containerRect.left;
  const y1 = fromRect.top + fromRect.height / 2 - containerRect.top;
  const x2 = toRect.left + toRect.width / 2 - containerRect.left;
  const y2 = toRect.top + toRect.height / 2 - containerRect.top;

  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = color;
  ctx.stroke();
}
