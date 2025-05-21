let data = {};
let idToEl = {};

async function fetchData() {
  const response = await fetch('data.json');
  data = await response.json();
  return data;
}

function createPersonCard(person, id) {
  const div = document.createElement('div');
  div.className = 'person';
  div.id = `person-${id}`;
  div.dataset.id = id;

  const filterBtn = document.createElement('button');
  filterBtn.className = 'filter-icon';
  filterBtn.innerHTML = '👁️';
  filterBtn.onclick = (e) => {
    e.stopPropagation();
    toggleFilter(id, filterBtn);
  };

  div.innerHTML = `
    <div class="photo"></div>
    <strong>${person.name.first} ${person.name.middle || ''} ${person.name.last}</strong><br>
    <small>${person.birth.year || ''}</small><br>
    <em>${person.bio.desc}</em>
  `;
  div.appendChild(filterBtn);

  div.onclick = () => openModal(id);

  return div;
}

function openModal(id) {
  const person = data[id];
  if (!person) return;

  document.getElementById('modal-name').textContent =
    `${person.name.first} ${person.name.middle || ''} ${person.name.last}`;
  document.getElementById('modal-bio').textContent = person.bio.desc || '';
  const birth = person.birth;
  document.getElementById('modal-birth').textContent = birth
    ? `Born: ${birth.month}/${birth.day}/${birth.year} in ${birth.city}, ${birth.state}, ${birth.country}`
    : '';
  const death = person.death;
  document.getElementById('modal-death').textContent = death
    ? `Died: ${death.month}/${death.day}/${death.year} in ${death.city}, ${death.state}, ${death.country}`
    : '';

  document.getElementById('modal').style.display = 'flex';
}

function toggleFilter(newId, clickedBtn) {
  const allBtns = document.querySelectorAll('.filter-icon');
  const isActive = clickedBtn.classList.contains('active');

  allBtns.forEach(btn => btn.classList.remove('active'));
  if (isActive) {
    document.querySelectorAll('.person').forEach(el => el.style.display = '');
    drawAllLines();
    return;
  }

  clickedBtn.classList.add('active');
  const visible = new Set();

  function walk(id) {
    if (!id || visible.has(id)) return;
    visible.add(id);
    const p = data[id];
    p.relations.children?.forEach(cid => walk(cid.toString()));
    if (p.relations.father) walk(p.relations.father.toString());
    if (p.relations.mother) walk(p.relations.mother.toString());
    if (p.relations.spouse) visible.add(p.relations.spouse.toString());
  }

  walk(newId);

  document.querySelectorAll('.person').forEach(el => {
    el.style.display = visible.has(el.dataset.id) ? '' : 'none';
  });

  drawAllLines();
}

function drawLine(svg, fromEl, toEl) {
  const from = fromEl.getBoundingClientRect();
  const to = toEl.getBoundingClientRect();
  const svgBox = svg.getBoundingClientRect();

  const x1 = from.left + from.width / 2 - svgBox.left;
  const y1 = from.bottom - svgBox.top;
  const x2 = to.left + to.width / 2 - svgBox.left;
  const y2 = to.top - svgBox.top;

  const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line.setAttribute("x1", x1);
  line.setAttribute("y1", y1);
  line.setAttribute("x2", x2);
  line.setAttribute("y2", y2);
  line.setAttribute("stroke", "#333");
  line.setAttribute("stroke-width", "2");
  svg.appendChild(line);
}

function assignGenerations(data) {
  const generations = {};
  for (const id in data) generations[id] = 0;

  let changed;
  do {
    changed = false;
    for (const id in data) {
      const p = data[id];
      (p.relations.children || []).forEach(cid => {
        if (generations[id] <= generations[cid]) {
          generations[id] = generations[cid] + 1;
          changed = true;
        }
      });
      const spouse = p.relations.spouse?.toString();
      if (spouse) {
        const maxGen = Math.max(generations[id], generations[spouse]);
        if (generations[id] !== maxGen || generations[spouse] !== maxGen) {
          generations[id] = generations[spouse] = maxGen;
          changed = true;
        }
      }
    }
  } while (changed);

  return generations;
}

function drawAllLines() {
  const svg = document.querySelector("svg.lines");
  svg.innerHTML = "";
  for (const [id, person] of Object.entries(data)) {
    const el = idToEl[id];
    if (!el || el.style.display === 'none') continue;
    (person.relations.children || []).forEach(cid => {
      const childEl = idToEl[cid];
      if (childEl && childEl.style.display !== 'none') {
        drawLine(svg, el, childEl);
      }
    });
  }
}

function renderTree(data) {
  const container = document.getElementById("tree-root");
  const svg = document.querySelector("svg.lines");
  container.innerHTML = "";
  svg.innerHTML = "";

  const generations = assignGenerations(data);
  const levels = {};
  for (const [id, gen] of Object.entries(generations)) {
    if (!levels[gen]) levels[gen] = new Set();
    levels[gen].add(id);
  }

  idToEl = {};
  const sorted = Object.keys(levels).map(Number).sort((a, b) => b - a);
  for (const level of sorted) {
    const row = document.createElement("div");
    row.className = "generation";
    for (const id of levels[level]) {
      const person = data[id];
      const spouseId = person.relations.spouse?.toString();
      const block = document.createElement("div");
      block.className = "family-block";

      if (spouseId && levels[level].has(spouseId)) {
        const pair = document.createElement("div");
        pair.className = "spouse-pair";
        const el1 = createPersonCard(person, id);
        const el2 = createPersonCard(data[spouseId], spouseId);
        pair.appendChild(el1);
        pair.appendChild(el2);
        block.appendChild(pair);
        idToEl[id] = el1;
        idToEl[spouseId] = el2;
      } else {
        const el = createPersonCard(person, id);
        block.appendChild(el);
        idToEl[id] = el;
      }

      row.appendChild(block);
    }
    container.appendChild(row);
  }

  drawAllLines();
  window.addEventListener("resize", drawAllLines);
}

window.onload = async () => {
  await fetchData();
  renderTree(data);

  const panzoomScript = document.createElement('script');
  panzoomScript.src = "https://cdn.jsdelivr.net/npm/@panzoom/panzoom@9.4.0/dist/panzoom.min.js";
  panzoomScript.onload = () => {
    const el = document.querySelector('.tree-container');
    const panzoom = Panzoom(el, { maxScale: 2, minScale: 0.5, contain: 'outside' });
    el.addEventListener('wheel', panzoom.zoomWithWheel);
  };
  document.body.appendChild(panzoomScript);
};
