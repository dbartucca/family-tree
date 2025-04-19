async function loadTree() {
  const response = await fetch('data.json');
  const data = await response.json();
  const container = document.getElementById('tree-container');
  const canvas = document.getElementById('connection-lines');
  const ctx = canvas.getContext('2d');

  canvas.width = document.body.scrollWidth;
  canvas.height = document.body.scrollHeight;

  const positions = {};
  let x = 100;
  let y = 100;
  const offsetY = 220;

  Object.keys(data).forEach((id, index) => {
    const person = data[id];
    const div = document.createElement('div');
    div.className = 'person';
    div.id = `person-${id}`;
    div.style.left = `${x}px`;
    div.style.top = `${y}px`;

    const imgPath = `images/${id}.png`;
    const jfifPath = `images/${id}.jfif`;

    const img = new Image();
    img.onload = () => div.appendChild(img);
    img.onerror = () => {}; // no image
    img.src = imgPath;
    img.onerror = () => {
      img.src = jfifPath;
      img.onerror = () => {}; // no image at all
    };

    const name = `${person.name.first} ${person.name.middle} ${person.name.last}`.replace(/\s+/g, ' ').trim();
    const info = document.createElement('div');
    info.innerHTML = `<strong>${name}</strong><br/>Born: ${person.birth.year}`;
    div.appendChild(info);

    container.appendChild(div);
    positions[id] = { x: x + 75, y: y + 40 }; // center of box
    x += 250;
    if (x > window.innerWidth - 200) {
      x = 100;
      y += offsetY;
    }
  });

  // Draw lines
  Object.keys(data).forEach((id) => {
    const person = data[id];
    const from = positions[id];
    if (!from) return;

    ['mother', 'father', 'spouse'].forEach(rel => {
      const relId = person.relations[rel];
      if (relId && positions[relId]) {
        const to = positions[relId];
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.strokeStyle = rel === 'spouse' ? 'green' : 'black';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    });
  });
}

window.onload = loadTree;
