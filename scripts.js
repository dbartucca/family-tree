let data = {};
const nodeMap = {};

fetch('data.json')
  .then(res => res.json())
  .then(json => {
    data = json;
    renderTree();
    window.addEventListener('resize', drawLines);
  });

function renderTree() {
  const container = document.getElementById('tree-container');
  container.innerHTML = '';

  Object.entries(data).forEach(([id, person]) => {
    const div = document.createElement('div');
    div.className = 'person';
    div.textContent = `${person.name.first} ${person.name.last}`;
    div.id = `person-${id}`;
    div.onclick = () => showInfoCard(id);
    container.appendChild(div);
    nodeMap[id] = div;
  });

  drawLines();
}

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
    const childEl = nodeMap[id];
    if (!childEl) return;
    const childRect = childEl.getBoundingClientRect();

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
