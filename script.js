async function fetchData() {
  const response = await fetch('data.json');
  const data = await response.json();
  return data;
}

function createPersonCard(person) {
  const div = document.createElement('div');
  div.className = 'person';
  div.innerHTML = `
    <strong>${person.name.first} ${person.name.middle || ''} ${person.name.last}</strong><br>
    <small>${person.birth.year || ''}</small><br>
    <em>${person.bio.desc}</em>
  `;
  return div;
}

function buildTree(data, rootId, container) {
  const person = data[rootId];
  if (!person) return;

  const personCard = createPersonCard(person);
  container.appendChild(personCard);

  const childrenContainer = document.createElement('div');
  childrenContainer.className = 'children';

  if (person.relations.children && person.relations.children.length > 0) {
    const connector = document.createElement('div');
    connector.className = 'connector';
    container.appendChild(connector);

    container.appendChild(childrenContainer);

    person.relations.children.forEach(childId => {
      const childWrapper = document.createElement('div');
      buildTree(data, childId, childWrapper);
      childrenContainer.appendChild(childWrapper);
    });
  }
}

window.onload = async () => {
  const data = await fetchData();
  const treeContainer = document.getElementById('tree');

  // Find root people (those who are not listed as a child)
  const allChildren = new Set();
  for (const id in data) {
    const person = data[id];
    (person.relations.children || []).forEach(cid => allChildren.add(cid));
  }

  const rootPeople = Object.keys(data).filter(id => !allChildren.has(parseInt(id)));

  rootPeople.forEach(rootId => {
    const rootWrapper = document.createElement('div');
    buildTree(data, rootId, rootWrapper);
    treeContainer.appendChild(rootWrapper);
  });
};
