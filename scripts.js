const container = document.getElementById('family-tree-container');
let treeData = {};
let maxY = 0;

fetch('data.json')
  .then(response => response.json())
  .then(data => {
    treeData = data;
    renderTree();
  });

function createPerson(id, x, y) {
  const member = treeData[id];
  if (!member) return;

  const card = document.createElement('div');
  card.className = 'person';
  card.style.left = `${x}px`;
  card.style.top = `${y}px`;

  if (y > maxY) maxY = y;

  const fullName = `${member.name.first} ${member.name.middle || ''} ${member.name.last}`;
  const birthDate = `${member.birth.month}/${member.birth.day}/${member.birth.year}`;
  const deathYear = member.death?.year ? ` - ${member.death.year}` : '';

  let imagePath = `images/${id}.png`;
  const jfifPath = `images/${id}.jfif`;

  const img = new Image();
  img.onload = () => {
    card.innerHTML = `
      <img src="${imagePath}" alt="${fullName}">
      <h4>${fullName}</h4>
      <p>${birthDate}${deathYear}</p>
    `;
  };
  img.onerror = () => {
    const fallbackImg = new Image();
    fallbackImg.onload = () => {
      card.innerHTML = `
        <img src="${jfifPath}" alt="${fullName}">
        <h4>${fullName}</h4>
        <p>${birthDate}${deathYear}</p>
      `;
    };
    fallbackImg.onerror = () => {
      card.innerHTML = `
        <h4>${fullName}</h4>
        <p>${birthDate}${deathYear}</p>
      `;
    };
    fallbackImg.src = jfifPath;
  };
  img.src = imagePath;

  container.appendChild(card);
}

function drawLine(x1, y1, x2, y2) {
  const line = document.createElement('div');
  line.className = 'line';

  const deltaX = x2 - x1;
  const deltaY = y2 - y1;
  const length = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

  line.style.width = `${length}px`;
  line.style.left = `${x1}px`;
  line.style.top = `${y1}px`;

  const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
  line.style.transform = `rotate(${angle}deg)`;

  container.appendChild(line);
}

function renderTree() {
  const positions = {};

  const rootId = 1;
  const boxWidth = 180;
  const boxHeight = 160;
  const hSpacing = 100;
  const vSpacing = 200;

  function positionPerson(id, depth, xOffset) {
    const x = xOffset;
    const y = depth * (boxHeight + vSpacing);
    positions[id] = { x, y };
    createPerson(id, x, y);

    const member = treeData[id];
    if (!member) return;

    const children = Object.entries(treeData)
      .filter(([_, m]) => m.relations?.mother === id || m.relations?.father === id)
      .map(([cid]) => parseInt(cid));

    let childX = x - (children.length - 1) * (boxWidth + hSpacing) / 2;

    children.forEach(childId => {
      positionPerson(childId, depth + 1, childX);
      const childPos = positions[childId];
      drawLine(x + boxWidth / 2, y + boxHeight, childPos.x + boxWidth / 2, childPos.y);
      childX += boxWidth + hSpacing;
    });

    const spouseId = member.relations?.spouse;
    if (spouseId && !positions[spouseId]) {
      const spouseX = x + boxWidth + hSpacing / 2;
      const spouseY = y;
      positions[spouseId] = { x: spouseX, y: spouseY };
      createPerson(spouseId, spouseX, spouseY);
      drawLine(x + boxWidth, y + boxHeight / 2, spouseX, spouseY + boxHeight / 2);
    }
  }

  positionPerson(rootId, 0, window.innerWidth / 2 - boxWidth / 2);

  // Dynamically set the container height based on max Y position
  container.style.height = (maxY + boxHeight + 100) + 'px';
}
