fetch('data.json')
  .then(res => res.json())
  .then(data => {
    renderTree(data);
    drawConnections(data);
  });

function renderTree(data) {
  const container = document.getElementById('tree');

  for (const [id, person] of Object.entries(data)) {
    const div = document.createElement('div');
    div.classList.add('person');
    div.id = `person-${id}`;
    div.innerText = `${person.name.first} ${person.name.last}`;
    container.appendChild(div);
  }
}

function drawConnections(data) {
  const drawnSpouses = new Set();

  for (const [id, person] of Object.entries(data)) {
    const from = document.getElementById(`person-${id}`);

    // Spouse (only draw once)
    const spouseId = person.relations.spouse;
    const pairKey = [id, spouseId].sort().join('-');

    if (spouseId && !drawnSpouses.has(pairKey)) {
      const to = document.getElementById(`person-${spouseId}`);
      if (to) {
        new LeaderLine(from, to, { color: 'red', dash: true });
        drawnSpouses.add(pairKey);
      }
    }

    // Children
    person.relations.children.forEach(childId => {
      const to = document.getElementById(`person-${childId}`);
      if (to) {
        new LeaderLine(from, to, { color: 'blue' });
      }
    });
  }
}
