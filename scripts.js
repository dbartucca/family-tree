fetch('data.json')
  .then(res => res.json())
  .then(data => {
    const generations = getGenerations(data);
    renderTree(generations);
    drawConnections(data, generations);
  });

// Get the generations from the data
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

// Determine the generation level for a person
function getGenerationForPerson(data, person, level = 0) {
  if (!person.relations.mother && !person.relations.father) return level;

  const mother = person.relations.mother ? data[person.relations.mother] : null;
  const father = person.relations.father ? data[person.relations.father] : null;

  let maxLevel = level;
  if (mother) maxLevel = Math.max(maxLevel, getGenerationForPerson(data, mother, level + 1));
  if (father) maxLevel = Math.max(maxLevel, getGenerationForPerson(data, father, level + 1));

  return maxLevel;
}

// Render the tree with grid layout
function renderTree(generations) {
  const container = document.getElementById('tree-container');

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

// Draw connections between parents and children, and spouses
function drawConnections(data, generations) {
  const svg = document.getElementById('connections');
  
  for (const [id, person] of Object.entries(data)) {
    const from = document.getElementById(`person-${id}`);

    // Draw spouse connection (only draw once)
    if (person.relations.spouse) {
      const to = document.getElementById(`person-${person.relations.spouse}`);
      if (to) drawLine(from, to, svg, 'red');
    }

    // Draw children connections
    person.relations.children.forEach(childId => {
      const to = document.getElementById(`person-${childId}`);
      if (to) drawLine(from, to, svg, 'blue');
    });
  }
}

// Draw a line between two elements
function drawLine(from, to, svg, color) {
  const fromRect = from.getBoundingClientRect();
  const toRect = to.getBoundingClientRect();
  
  const x1 = fromRect.left + fromRect.width / 2;
  const y1 = fromRect.top + fromRect.height / 2;
  const x2 = toRect.left + toRect.width / 2;
  const y2 = toRect.top + toRect.height / 2;
  
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  line.setAttribute('x1', x1);
  line.setAttribute('y1', y1);
  line.setAttribute('x2', x2);
  line.setAttribute('y2', y2);
  line.setAttribute('stroke', color);
  line.setAttribute('stroke-width', 2);
  line.setAttribute('stroke-dasharray', '5,5');
  svg.appendChild(line);
}
