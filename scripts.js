let data = {};
const nodeMap = {};

fetch('data.json')
  .then(res => res.json())
  .then(json => {
    data = json;
    renderTree(); // Start rendering the tree once the data is fetched
    window.addEventListener('resize', drawLines); // Redraw lines when resizing the window
  });

const nodeWidth = 180;
const nodeHeight = 100;
const verticalSpacing = 200;
const horizontalSpacing = 150;

const treeContainer = document.getElementById('tree-container');
const canvas = document.getElementById('lines');
const ctx = canvas.getContext('2d');

treeContainer.style.position = 'relative'; 

function renderTree() {
  const container = document.getElementById('tree-container');
  container.innerHTML = ''; 
  const root = getRoot(); 
  if (root) {
    positionTree(root, window.innerWidth / 2, 20); 
    drawLines(); 
  } else {
    console.error('No root person found!');
  }
}

function getRoot() {
  return Object.entries(data).find(([id, person]) => !person.relations.mother && !person.relations.father)?.[1];
}

function positionTree(person, x, y) {
  const container = document.getElementById('tree-container');
  const div = document.createElement('div');
  div.className = 'person';
  div.id = `person-${person.id}`;
  div.textContent = `${person.name.first} ${person.name.last}`;
  div.onclick = () => showInfoCard(person.id);

  div.style.position = 'absolute';
  div.style.left = `${x - nodeWidth / 2}px`;
  div.style.top = `${y}px`;

  container.appendChild(div);
  nodeMap[person.id] = div;

  if (person.relations.children.length > 0) {
    let childX = x - (person.relations.children.length - 1) * (nodeWidth + horizontalSpacing) / 2;
    let childY = y + verticalSpacing;

    person.relations.children.forEach(childId => {
      const child = data[childId];
      positionTree(child, childX, childY);
      childX += nodeWidth + horizontalSpacing; 
    });
  }
}

function drawLines() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2;

  Object.entries(data).forEach(([id, person]) => {
    const childEl = nodeMap[person.id];
    if (!childEl) return;
    const childRect = childEl.getBoundingClientRect();

    ['mother', 'father'].forEach(role => {
      const parentId = person.relations[role];
      if (parentId && nodeMap[parentId]) {
        const parentEl = nodeMap[parentId];
        const parentRect = parentEl.getBoundingClientRect();

        ctx.beginPath();
        ctx.moveTo(parentRect.left + parentRect.width / 2, parentRect.bottom);
        ctx.lineTo(childRect.left + childRect.width / 2, childRect.top);
        ctx.stroke();
      }
    });
  });
}

function showInfoCard(id) {
  const person = data[id];
  if (!person) return;

  const infoCard = document.createElement('div');
  infoCard.classList.add('info-card');

  infoCard.innerHTML = `
    <button class="up-btn" onclick="openParents(${id})">&#8679;</button>
    <span class="close-btn" onclick="this.parentElement.remove()">&times;</span>
    <h2>${person.name.first} ${person.name.middle ?? ''} ${person.name.last}</h2>
    <p><strong>Born:</strong> ${person.birth.month}/${person.birth.day}/${person.birth.year}</p>
    ${person.death ? `<p><strong>Died:</strong> ${person.death.month}/${person.death.day}/${person.death.year}</p>` : ''}
    <p><strong>Location:</strong> ${person.birth.city}, ${person.birth.state}, ${person.birth.country}</p>
    <p>${person.bio.desc}</p>
  `;

  document.body.appendChild(infoCard);
}

function openParents(id) {
  const person = data[id];
  if (!person) return;

  if (person.relations.mother) {
    showInfoCard(person.relations.mother);
  }
  if (person.relations.father) {
    showInfoCard(person.relations.father);
  }
}
