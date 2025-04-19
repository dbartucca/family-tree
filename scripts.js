// Declare the data variable to hold family data, and nodeMap to store references to each person's element
let data = {};
const nodeMap = {};

fetch('data.json')
  .then(res => res.json())
  .then(json => {
    data = json;
    renderTree(); // Start rendering the tree once the data is fetched
    window.addEventListener('resize', drawLines); // Redraw lines when resizing the window
  });

const nodeWidth = 180; // Width of each person's box
const nodeHeight = 100; // Height of each person's box
const verticalSpacing = 200; // Space between generations
const horizontalSpacing = 150; // Space between siblings

// This function is responsible for rendering the family tree
function renderTree() {
  const container = document.getElementById('tree-container');
  container.innerHTML = ''; // Clear the container before rendering the tree
  const root = getRoot(); // Get the root (ancestor) of the tree
  positionTree(root, 0, 0); // Start positioning from the root

  // Draw lines between parents and children
  drawLines();
}

// Get the first generation (root of the tree)
function getRoot() {
  return Object.entries(data).find(([id, person]) => !person.relations.mother && !person.relations.father);
}

// Position individuals dynamically based on their parent-child relationships
function positionTree(person, x, y) {
  const container = document.getElementById('tree-container');
  const div = document.createElement('div');
  div.className = 'person';
  div.id = `person-${person.id}`;
  div.textContent = `${person.name.first} ${person.name.last}`;
  div.onclick = () => showInfoCard(person.id);

  // Set the position of the person
  div.style.position = 'absolute';
  div.style.left = `${x}px`;
  div.style.top = `${y}px`;

  container.appendChild(div);
  nodeMap[person.id] = div;

  // Position children below their parent (in a new row)
  if (person.relations.children.length > 0) {
    let childX = x - (person.relations.children.length - 1) * (nodeWidth + horizontalSpacing) / 2;
    let childY = y + verticalSpacing;

    person.relations.children.forEach(childId => {
      const child = data[childId];
      positionTree(child, childX, childY);
      childX += nodeWidth + horizontalSpacing; // Adjust horizontal spacing between children
    });
  }
}

// Draw lines to connect parents and children
function drawLines() {
  const canvas = document.getElementById('lines');
  const container = document.getElementById('tree-container');
  const rect = container.getBoundingClientRect();
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2;

  Object.entries(data).forEach(([id, person]) => {
    const childEl = nodeMap[person.id];
    if (!childEl) return;
    const childRect = childEl.getBoundingClientRect();

    // Draw lines to the parents (if available)
    ['mother', 'father'].forEach(role => {
      const parentId = person.relations[role];
      if (parentId && nodeMap[parentId]) {
        const parentEl = nodeMap[parentId];
        const parentRect = parentEl.getBoundingClientRect();

        ctx.beginPath();
        ctx.moveTo(parentRect.left + parentRect.width / 2, parentRect.bottom - rect.top);
        ctx.lineTo(childRect.left + childRect.width / 2, childRect.top - rect.top);
        ctx.stroke();
      }
    });
  });
}

// Show info card for a given person
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

// Open the info cards for a person's parents
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
