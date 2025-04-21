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

function drawLine(svg, fromEl, toEl) {
  const fromRect = fromEl.getBoundingClientRect();
  const toRect = toEl.getBoundingClientRect();
  const svgRect = svg.getBoundingClientRect();

  const x1 = fromRect.left + fromRect.width / 2 - svgRect.left;
  const y1 = fromRect.bottom - svgRect.top;
  const x2 = toRect.left + toRect.width / 2 - svgRect.left;
  const y2 = toRect.top - svgRect.top;

  const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line.setAttribute("x1", x1);
  line.setAttribute("y1", y1);
  line.setAttribute("x2", x2);
  line.setAttribute("y2", y2);
  line.setAttribute("stroke", "#333");
  line.setAttribute("stroke-width", "2");
  svg.appendChild(line);
}

function buildFamilyTree(data, svg) {
  const rendered = new Set();
  const idToElement = {};
  const tree = [];

  function buildGen(parents) {
    const generation = [];

    parents.forEach(([id1, id2]) => {
      if (rendered.has(id1) && (!id2 || rendered.has(id2))) return;

      const parent1 = data[id1];
      const parent2 = id2 ? data[id2] : null;
      if (!parent1) return;

      const familyDiv = document.createElement('div');
      familyDiv.className = 'family';

      const parentsDiv = document.createElement('div');
      parentsDiv.className = 'parents';

      const el1 = createPersonNode(parent1, id1);
      idToElement[id1] = el1;
      rendered.add(id1);
      parentsDiv.appendChild(el1);

      if (parent2 && data[parent2]) {
        const el2 = createPersonNode(data[parent2], id2);
        idToElement[id2] = el2;
        rendered.add(id2);
        parentsDiv.appendChild(el2);
      }

      familyDiv.appendChild(parentsDiv);

      const children = parent1.relations.children || [];
      const childrenDiv = document.createElement('div');
      childrenDiv.className = 'children';

      const nextGenParents = [];

      children.forEach(cid => {
        if (rendered.has(cid)) return;
        const child = data[cid];
        if (!child) return;
        const childEl = createPersonNode(child, cid);
        childrenDiv.appendChild(childEl);
        idToElement[cid] = childEl;
        rendered.add(cid);

        const spouse = child.relations.spouse;
        nextGenParents.push([cid.toString(), spouse ? spouse.toString() : null]);
      });

      if (children.length > 0) {
        familyDiv.appendChild(childrenDiv);
      }

      generation.push({ familyDiv, parentIds: [id1, id2], childIds: children });

      if (nextGenParents.length > 0) {
        const childGen = buildGen(nextGenParents);
        if (childGen.length) {
          tree.push(childGen);
        }
      }
    });

    return generation;
  }

  // Find root people (those who are not children)
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

  return { tree, idToElement };
}

window.onload = async () => {
  const data = await fetchData();
  const treeContainer = document.getElementById('tree');
  const svg = document.querySelector('.connector-lines');

  const { tree, idToElement } = buildFamilyTree(data, svg);

  tree.forEach(generation => {
    const genDiv = document.createElement('div');
    genDiv.className = 'generation';
    generation.forEach(fam => {
      genDiv.appendChild(fam.familyDiv);
    });
    treeContainer.appendChild(genDiv);
  });

  // Wait for layout, then draw lines
  requestAnimationFrame(() => {
    tree.forEach(generation => {
      generation.forEach(fam => {
        const [p1, p2] = fam.parentIds;
        fam.childIds.forEach(cid => {
          if (idToElement[p1] && idToElement[cid]) {
            drawLine(svg, idToElement[p1], idToElement[cid]);
          } else if (p2 && idToElement[p2] && idToElement[cid]) {
            drawLine(svg, idToElement[p2], idToElement[cid]);
          }
        });
      });
    });
  });
};
