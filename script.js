async function fetchData() {
  const response = await fetch('data.json');
  return await response.json();
}

function createPersonNode(person, id) {
  const el = document.createElement('div');
  el.className = 'person';
  el.innerHTML = `
    <div class="photo"></div>
    <strong>${person.name.first} ${person.name.middle || ''} ${person.name.last}</strong><br>
    <small>${person.birth.year || ''}</small><br>
    <em>${person.bio.desc}</em>
  `;
  el.id = `person-${id}`;
  return el;
}

function buildFamilyTree(data) {
  const used = new Set();
  const tree = [];

  function buildGen(parents) {
    const generation = [];

    parents.forEach(([id1, id2]) => {
      const parent1 = data[id1];
      const parent2 = id2 ? data[id2] : null;
      if (!parent1) return;

      const familyDiv = document.createElement('div');
      familyDiv.className = 'family';

      const parentsDiv = document.createElement('div');
      parentsDiv.className = 'parents';

      const el1 = createPersonNode(parent1, id1);
      used.add(id1);
      parentsDiv.appendChild(el1);

      if (parent2 && data[parent2]) {
        const el2 = createPersonNode(data[parent2], id2);
        parentsDiv.appendChild(el2);
        used.add(id2);
      }

      familyDiv.appendChild(parentsDiv);

      const children = parent1.relations.children || [];
      const childrenDiv = document.createElement('div');
      childrenDiv.className = 'children';

      const nextGenParents = [];

      children.forEach(cid => {
        if (used.has(cid)) return;
        const child = data[cid];
        if (!child) return;
        const childEl = createPersonNode(child, cid);
        childrenDiv.appendChild(childEl);
        used.add(cid);

        const spouse = child.relations.spouse;
        nextGenParents.push([cid.toString(), spouse ? spouse.toString() : null]);
      });

      if (children.length > 0) {
        familyDiv.appendChild(childrenDiv);
      }

      generation.push(familyDiv);

      if (nextGenParents.length > 0) {
        const childGen = buildGen(nextGenParents);
        if (childGen.length) {
          tree.push(childGen);
        }
      }
    });

    return generation;
  }

  // Start from top-level ancestors (those who are not children)
  const allChildren = new Set();
  for (const person of Object.values(data)) {
    (person.relations.children || []).forEach(cid => allChildren.add(cid.toString()));
  }

  const rootPairs = [];
  for (const [id, person] of Object.entries(data)) {
    const spouse = person.relations.spouse?.toString();
    if (!allChildren.has(id)) {
      rootPairs.push([id, spouse || null]);
    }
  }

  const firstGen = buildGen(rootPairs);
  if (firstGen.length) tree.push(firstGen);

  return tree;
}

window.onload = async () => {
  const data = await fetchData();
  const treeContainer = document.getElementById('tree');
  const generations = buildFamilyTree(data);

  generations.forEach(generation => {
    const genDiv = document.createElement('div');
    genDiv.className = 'generation';
    generation.forEach(family => {
      genDiv.appendChild(family);
    });
    treeContainer.appendChild(genDiv);
  });
};
