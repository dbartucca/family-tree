async function fetchData() {
  const response = await fetch('data.json');
  return await response.json();
}

function createPersonCard(person, id) {
  const div = document.createElement('div');
  div.className = 'person';
  div.id = `person-${id}`;

  const toggle = document.createElement('button');
  toggle.textContent = "−";
  toggle.className = "toggle";
  toggle.onclick = () => {
    const block = div.closest(".family-block");
    if (block) block.classList.toggle("collapsed");
    toggle.textContent = block.classList.contains("collapsed") ? "+" : "−";
  };

  div.innerHTML = `
    <div class="photo"></div>
    <strong>${person.name.first} ${person.name.middle || ''} ${person.name.last}</strong><br>
    <small>${person.birth.year || ''}</small><br>
    <em>${person.bio.desc}</em>
  `;
  div.prepend(toggle);
  return div;
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
  const constraints = [];
  const childToParents = {};

  for (const [id, person] of Object.entries(data)) {
    const children = person.relations.children || [];
    for (const cid of children) {
      constraints.push({ above: id, below: cid.toString() });
      if (!childToParents[cid]) childToParents[cid] = [];
      childToParents[cid].push(id);
    }

    const spouseId = person.relations.spouse?.toString();
    if (spouseId && data[spouseId]) {
      constraints.push({ same: [id, spouseId] });
    }
  }

  const siblingSets = {};
  for (const [childId, parentList] of Object.entries(childToParents)) {
    const key = parentList.sort().join("-");
    siblingSets[key] = siblingSets[key] || [];
    siblingSets[key].push(childId);
  }
  for (const siblings of Object.values(siblingSets)) {
    for (let i = 0; i < siblings.length - 1; i++) {
      constraints.push({ same: [siblings[i], siblings[i + 1]] });
    }
  }

  for (const id of Object.keys(data)) {
    generations[id] = 0;
  }

  let changed;
  do {
    changed = false;
    for (const rule of constraints) {
      if (rule.above && rule.below) {
        const above = rule.above;
        const below = rule.below;
        const newAboveGen = generations[below] + 1;
        if (generations[above] < newAboveGen) {
          generations[above] = newAboveGen;
          changed = true;
        }
      }

      if (rule.same) {
        const [a, b] = rule.same;
        const maxGen = Math.max(generations[a], generations[b]);
        if (generations[a] !== maxGen || generations[b] !== maxGen) {
          generations[a] = maxGen;
          generations[b] = maxGen;
          changed = true;
        }
      }
    }
  } while (changed);

  return generations;
}

function renderTree(data) {
  const container = document.getElementById("tree-root");
  const svg = document.querySelector("svg.lines");
  container.innerHTML = "";
  svg.innerHTML = "";

  const generations = assignGenerations(data);
  const genGroups = {};

  for (const [id, level] of Object.entries(generations)) {
    if (!genGroups[level]) genGroups[level] = new Set();
    genGroups[level].add(id);
  }

  const idToEl = {};
  const sortedLevels = Object.keys(genGroups).map(Number).sort((a, b) => b - a); // eldest to youngest

  for (const level of sortedLevels) {
    const ids = genGroups[level];
    const row = document.createElement("div");
    row.className = "generation";

    const rendered = new Set();

    for (const id of ids) {
      if (rendered.has(id)) continue;

      const person = data[id];
      const spouseId = person.relations.spouse?.toString();

      const wrapper = document.createElement("div");
      wrapper.className = "family-block";

      if (spouseId && ids.has(spouseId) && !rendered.has(spouseId)) {
        const pair = document.createElement("div");
        pair.className = "spouse-pair";
        const el1 = createPersonCard(person, id);
        const el2 = createPersonCard(data[spouseId], spouseId);
        pair.appendChild(el1);
        pair.appendChild(el2);
        idToEl[id] = el1;
        idToEl[spouseId] = el2;
        rendered.add(id);
        rendered.add(spouseId);
        wrapper.appendChild(pair);
      } else {
        const el = createPersonCard(person, id);
        idToEl[id] = el;
        rendered.add(id);
        wrapper.appendChild(el);
      }

      row.appendChild(wrapper);
    }

    container.appendChild(row);
  }

  function drawAllLines() {
    svg.innerHTML = "";
    for (const [id, person] of Object.entries(data)) {
      const parentEl = idToEl[id];
      if (!parentEl) continue;

      (person.relations.children || []).forEach(cid => {
        const childEl = idToEl[cid];
        if (childEl) {
          drawLine(svg, parentEl, childEl);
        }
      });
    }
  }

  requestAnimationFrame(drawAllLines);
  window.addEventListener("resize", drawAllLines);
}

window.onload = async () => {
  const data = await fetchData();
  renderTree(data);

  // Enable Panzoom
  const panzoomScript = document.createElement('script');
  panzoomScript.src = "https://cdn.jsdelivr.net/npm/@panzoom/panzoom@9.4.0/dist/panzoom.min.js";
  panzoomScript.onload = () => {
    const el = document.querySelector('.tree-container');
    Panzoom(el, {
      maxScale: 2,
      minScale: 0.5,
      contain: 'outside'
    });
  };
  document.body.appendChild(panzoomScript);
};
