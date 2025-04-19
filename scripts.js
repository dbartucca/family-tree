let data, generations;

fetch('data.json')
  .then(res => res.json())
  .then(fetchedData => {
    data = fetchedData;
    generations = getGenerations(data);
    renderTree(data, generations);
    drawConnections(); // Draw connections after initial rendering
  });

window.addEventListener('resize', drawConnections);

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
  container.innerHTML = ''; // Clear container before re-rendering

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

function drawConnections() {
  const canvas = document.getElementById('connections');
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear previous lines

  // Set line styles
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);

  // Draw lines for all relationships
  Object.entries(data).forEach(([id, person]) => {
    const from = document.getElementById(`person-${id}`);

    // Spouse line
    if (person.relations.spouse) {
      const to = document.getElementById(`person-${person.relations.spouse}`);
      if (to) drawLine(from, to, ctx, 'red');
    }

    // Child lines
    person.relations.children.forEach(childId => {
      const to = document.getElementById(`person-${childId}`);
      if (to) drawLine(from, to, ctx, 'blue');
    });
  });
}

function drawLine(from, to, ctx, color) {
  const fromRect = from.getBoundingClientRect();
  const toRect = to.getBoundingClientRect();

  // Calculate the mid-points of both elements
  const x1 = fromRect.left + fromRect.width / 2;
  const y1 = fromRect.top + fromRect.height / 2;
  const x2 = toRect.left + toRect.width / 2;
  const y2 = toRect.top + toRect.height / 2;

  // Draw the line
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = color;
  ctx.stroke();
}
