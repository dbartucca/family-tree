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
    treeContainer.appendChild(rootNode
