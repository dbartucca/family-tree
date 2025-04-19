async function loadFamilyTree() {
  const response = await fetch('data.json');
  const data = await response.json();

  // Start with the root node(s) — find people with no parents
  const roots = Object.entries(data).filter(([id, person]) =>
    person.relations.mother === null && person.relations.father === null
  );

  const container = document.getElementById('tree-container');

  for (const [id, person] of roots) {
    const subtree = buildTree(data, parseInt(id));
    container.appendChild(subtree);
  }
}

function buildTree(data, id) {
  const person = data[id];
  const wrapper = document.createElement('div');
  wrapper.classList.add('person');

  wrapper.innerHTML = `
    <strong>${person.name.first} ${person.name.middle || ''} ${person.name.last}</strong><br>
    Born: ${person.birth.year}
  `;

  if (person.relations.spouse) {
    const spouse = data[person.relations.spouse];
    wrapper.innerHTML += `<br>Spouse: ${spouse.name.first}`;
  }

  if (person.relations.children.length > 0) {
    const childContainer = document.createElement('div');
    childContainer.style.display = 'flex';
    childContainer.style.justifyContent = 'center';
    childContainer.style.marginTop = '20px';

    for (const childId of person.relations.children) {
      const childTree = buildTree(data, childId);
      childContainer.appendChild(childTree);
    }

    wrapper.appendChild(childContainer);
  }

  return wrapper;
}

loadFamilyTree();
