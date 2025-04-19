let data;

fetch('data.json')
  .then(res => res.json())
  .then(json => {
    data = json;
    renderTree(data);
    drawConnections();
    window.addEventListener("resize", () => {
      drawConnections();
    });
  });

function getGenerations(data) {
  const generations = {};
  const visited = new Set();

  function dfs(id, level) {
    if (!generations[level]) generations[level] = [];
    if (visited.has(id)) return;
    visited.add(id);
    generations[level].push(id);

    const person = data[id];
    if (person.relations.children) {
      person.relations.children.forEach(childId => {
        dfs(childId, level + 1);
      });
    }
  }

  // Start from root(s)
  Object.keys(data).forEach(id => {
    const person = data[id];
    if (!person.relations.father && !person.relations.mother) {
      dfs(id, 0);
    }
  });

  return generations;
}

function renderTree(data) {
  const container = document.getElementById("tree-container");
  container.innerHTML = "";
  const generations = getGenerations(data);

  Object.keys(generations).forEach(level => {
    const genDiv = document.createElement("div");
    genDiv.className = "generation";
    genDiv.dataset.generation = level;

    generations[level].forEach(id => {
      const person = data[id];
      const box = document.createElement("div");
      box.className = "person";
      box.id = `person-${id}`;
      box.innerText = `${person.name.first} ${person.name.last}`;
      box.addEventListener("click", () => showInfoCard(person));
      genDiv.appendChild(box);
    });

    container.appendChild(genDiv);
  });
}

function drawConnections() {
  const svg = document.getElementById("connection-lines");
  svg.innerHTML = "";

  Object.entries(data).forEach(([id, person]) => {
    const childEl = document.getElementById(`person-${id}`);
    if (!childEl) return;

    const parents = [person.relations.father, person.relations.mother].filter(Boolean);
    parents.forEach(parentId => {
      const parentEl = document.getElementById(`person-${parentId}`);
      if (!parentEl) return;

      const parentRect = parentEl.getBoundingClientRect();
      const childRect = childEl.getBoundingClientRect();

      const svgRect = svg.getBoundingClientRect();
      const x1 = parentRect.left + parentRect.width / 2 - svgRect.left;
      const y1 = parentRect.bottom - svgRect.top;
      const x2 = childRect.left + childRect.width / 2 - svgRect.left;
      const y2 = childRect.top - svgRect.top;

      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", x1);
      line.setAttribute("y1", y1);
      line.setAttribute("x2", x2);
      line.setAttribute("y2", y2);
      line.setAttribute("stroke", "#000");
      line.setAttribute("stroke-width", "2");
      svg.appendChild(line);
    });
  });
}

// Info card logic
function showInfoCard(member) {
  const card = document.getElementById("info-card");
  const nameEl = document.getElementById("info-name");
  const birthEl = document.getElementById("info-birth");
  const deathEl = document.getElementById("info-death");
  const bioEl = document.getElementById("info-bio");
  const relEl = document.getElementById("info-relations");

  const fullName = `${member.name.first} ${member.name.middle ?? ""} ${member.name.last}`;
  nameEl.textContent = fullName;

  birthEl.textContent = `Born: ${member.birth.month}/${member.birth.day}/${member.birth.year}`;
  deathEl.textContent = member.death
    ? `Died: ${member.death.month}/${member.death.day}/${member.death.year}`
    : "";

  bioEl.textContent = member.bio.desc;

  relEl.innerHTML = "";
  const rels = member.relations;
  for (let key in rels) {
    const val = rels[key];
    if (Array.isArray(val) && val.length > 0) {
      relEl.innerHTML += `<p>${key}: ${val.join(", ")}</p>`;
    } else if (val && typeof val === "number") {
      relEl.innerHTML += `<p>${key}: ${val}</p>`;
    }
  }

  card.classList.remove("hidden");
}

function hideInfoCard() {
  document.getElementById("info-card").classList.add("hidden");
}

document.querySelector(".close-btn").addEventListener("click", hideInfoCard);
window.addEventListener("click", (e) => {
  const card = document.getElementById("info-card");
  if (!card.contains(e.target) && !e.target.classList.contains("person")) {
    hideInfoCard();
  }
});
