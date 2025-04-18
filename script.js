async function loadFamilyTree() {
  const response = await fetch('data.json');
  const people = await response.json();

  const treeContainer = document.getElementById('tree');

  // Step 1: Identify root people (no one lists them as a parent)
  const isChild = new Set();
  for (const id in people) {
    const rel = people[id].relations;
    if (rel.father) isChild.add(rel.father);
    if (rel.mother) isChild.add(rel.mother);
  }

  const roots = Object.keys(people).filter(id => !isChild.has(parseInt(id)));

  // Step 2: Build tree starting from roots
  roots.forEach(rootId => {
    const rootNode = buildTree(parseInt(rootId), people);
    treeContainer.appendChild(rootNode);
  });
}

function buildTree(id, people) {
  const person = people[id];
  if (!person) return document.createTextNode('Unknown');

  const container = document.createElement('div');
  container.className = 'tree-container';

  const card = document.createElement('div');
  card.className = 'person';

  const img = document.createElement('img');
  img.src = `images/${id}.jfif`;
  img.alt = `${person.name.first}'s photo`;
  img.onerror = () => {
    img.src = 'images/default.jfif'; // fallback
  };

  const name = document.createElement('div');
  name.innerHTML = `<strong>${person.name.first} ${person.name.last}</strong><br>Born: ${person.birth.year}`;

  card.appendChild(img);
  card.appendChild(name);
  container.appendChild(card);

  // Step 3: Build children recursively
  const children = Object.entries(people)
    .filter(([childId, p]) =>
      p.relations.father === id || p.relations.mother === id
    );

  if (children.length > 0) {
    const connector = document.createElement('div');
    connector.className = 'connector';
    container.appendChild(connector);

    const childWrapper = document.createElement('div');
    childWrapper.className = 'child-container';

    children.forEach(([childId]) => {
      const childTree = buildTree(parseInt(childId), people);
      childWrapper.appendChild(childTree);
    });

    container.appendChild(childWrapper);
  }

  return container;
}

loadFamilyTree();
