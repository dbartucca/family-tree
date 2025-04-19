let data, generations;

fetch('data.json')
  .then(res => res.json())
  .then(fetchedData => {
    data = fetchedData;
    generations = getGenerations(data);
    renderTree(data, generations);
    // Draw connections after the page is fully loaded
    requestAnimationFrame(() => drawConnections(data, generations));
  });

// Resize listener to update lines dynamically
window.addEventListener('resize', () => {
  // Use requestAnimationFrame to ensure proper redrawing
  requestAnimationFrame(() => drawConnections(data, generations));
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

function drawConnections(data, generations) {
  const svg = document.getElementById('connections');
  
  // Clear existing connections
  while (svg.firstChild) {
    svg.removeChild(svg.firstChild);
  }

  // Ensure we calculate positions once the DOM is fully laid out
  setTimeout(() => {
    for (const [id, person] of Object.entries(data)) {
      const from = document.getElementById(`person-${id}`);
  
      if (person.relations.spouse) {
        const to = document.getElementById(`person-${person.relations.spouse}`);
        if (to) drawLine(from, to, svg, 'red');
      }
  
      person.relations.children.forEach(childId => {
        const to = document.getElementById(`person-${childId}`);
        if (to) drawLine(from, to, svg, 'blue');
      });
    }
  }, 0); // Delay execution to let layout settle
}

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
