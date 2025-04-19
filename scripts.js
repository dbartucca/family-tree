// scripts.js

const canvas = document.getElementById('tree-canvas');
const ctx = canvas.getContext('2d');
canvas.width = 5000;
canvas.height = 5000;

let members = {};
let positions = {}; // Store { id: {x, y} }
let drawn = new Set();

const boxWidth = 140;
const boxHeight = 100;
const hSpacing = 50;
const vSpacing = 150;
const generationSpacing = 250;

async function fetchData() {
  const res = await fetch('data.json');
  members = await res.json();
}

function drawBox(id, x, y) {
  const person = members[id];
  if (!person) return;

  const name = `${person.name.first} ${person.name.middle || ''} ${person.name.last}`.trim();
  const birthYear = person.birth?.year || '';
  const gender = person.bio?.gender || '';

  ctx.strokeStyle = 'black';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, boxWidth, boxHeight);

  ctx.font = '14px sans-serif';
  ctx.fillStyle = 'black';
  ctx.fillText(name, x + 5, y + 20);
  ctx.fillText(birthYear, x + 5, y + 40);

  // Draw image if it exists
  const imageFormats = ['.png', '.jfif'];
  for (const ext of imageFormats) {
    const img = new Image();
    img.src = `images/${id}${ext}`;
    img.onload = () => {
      ctx.drawImage(img, x + boxWidth - 45, y + 5, 40, 40);
    };
    img.onerror = () => {};
  }

  positions[id] = { x: x + boxWidth / 2, y: y + boxHeight / 2 };
  drawn.add(id);
}

function drawLine(x1, y1, x2, y2) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function groupGeneration(generation, membersData) {
  const visited = new Set();
  const groups = [];

  for (const id of generation) {
    if (visited.has(id)) continue;

    const member = membersData[id];
    const spouseId = member.relations?.spouse?.toString();

    if (spouseId && generation.includes(spouseId)) {
      // Gender sorting: male left, female right
      const first = member.bio.gender === 'M' ? id : spouseId;
      const second = member.bio.gender === 'F' ? id : spouseId;
      groups.push([first, second]);
      visited.add(id);
      visited.add(spouseId);
    } else {
      groups.push([id]);
      visited.add(id);
    }
  }
  return groups;
}

function layoutGenerations() {
  const levels = {};
  const visited = new Set();

  // BFS for assigning levels
  const queue = [];

  // Start with root ancestors (no parents)
  for (const id in members) {
    const { father, mother } = members[id].relations;
    if (!father && !mother) {
      levels[id] = 0;
      queue.push(id);
    }
  }

  while (queue.length) {
    const id = queue.shift();
    const level = levels[id];
    const children = members[id].relations?.children || [];

    for (const childId of children) {
      if (!(childId in levels)) {
        levels[childId] = level + 1;
        queue.push(childId);
      }
    }
  }

  const generationMap = {};
  for (const id in levels) {
    const level = levels[id];
    if (!generationMap[level]) generationMap[level] = [];
    generationMap[level].push(id);
  }

  let y = 50;
  for (const level of Object.keys(generationMap).sort((a, b) => a - b)) {
    const people = generationMap[level];
    const groups = groupGeneration(people, members);
    let x = 50;

    for (const group of groups) {
      group.forEach((id, i) => {
        drawBox(id, x + i * (boxWidth + hSpacing / 2), y);
      });

      if (group.length === 2) {
        // Spouse line
        const [id1, id2] = group;
        const pos1 = positions[id1];
        const pos2 = positions[id2];
        drawLine(pos1.x, pos1.y, pos2.x, pos2.y);

        // Children connector
        const children = members[id1].relations?.children || [];
        if (children.length) {
          const midX = (pos1.x + pos2.x) / 2;
          const midY = pos1.y + boxHeight / 2;

          // Vertical line down
          drawLine(midX, midY, midX, midY + generationSpacing / 2);

          // Horizontal line to each child
          const childY = midY + generationSpacing / 2;
          const childXs = children.map(c => positions[c]?.x).filter(Boolean);

          if (childXs.length) {
            const minX = Math.min(...childXs);
            const maxX = Math.max(...childXs);
            drawLine(minX, childY, maxX, childY);

            childXs.forEach(cx => {
              drawLine(cx, childY, cx, childY - generationSpacing / 2);
            });
          }
        }
      }
      x += group.length * (boxWidth + hSpacing) + hSpacing;
    }
    y += generationSpacing;
  }
}

async function renderTree() {
  await fetchData();
  layoutGenerations();
}

renderTree();
