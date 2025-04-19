document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("connection-canvas");
  const nodesContainer = document.getElementById("nodes-container");
  const ctx = canvas.getContext("2d");

  fetch("data.json")
    .then((res) => res.json())
    .then((data) => {
      // 1) Determine generations (0 = no parents, 1 = their children, etc.)
      const generations = assignGenerations(data);

      // 2) Position each person box and record its center point
      const positions = {};
      const nodeWidth = 160;
      const nodeHeight = 100;
      const hSpacing = 200;
      const vSpacing = 180;
      let maxX = 0,
        maxY = 0;

      Object.keys(generations)
        .map((g) => parseInt(g, 10))
        .sort((a, b) => a - b)
        .forEach((gen) => {
          const ids = generations[gen];
          const count = ids.length;
          // center the generation row
          const totalWidth = (count - 1) * hSpacing;
          let startX = (window.innerWidth - totalWidth) / 2;

          const y = gen * vSpacing + 50;
          ids.forEach((id, idx) => {
            const x = startX + idx * hSpacing;
            const person = data[id];

            // create and place the box
            const box = createPersonBox(id, person);
            box.style.left = `${x - nodeWidth / 2}px`;
            box.style.top = `${y}px`;
            nodesContainer.appendChild(box);

            // record its center for line drawing
            positions[id] = { x: x, y: y + nodeHeight / 2 };

            maxX = Math.max(maxX, x + nodeWidth / 2);
            maxY = Math.max(maxY, y + nodeHeight);
          });
        });

      // 3) Resize canvas & container
      const fullWidth = Math.max(maxX + 50, window.innerWidth);
      const fullHeight = Math.max(maxY + 50, window.innerHeight);
      canvas.width = fullWidth;
      canvas.height = fullHeight;
      nodesContainer.style.width = `${fullWidth}px`;
      nodesContainer.style.height = `${fullHeight}px`;

      // 4) Draw all relationship lines
      drawLines(data, positions, ctx);
    });

  // ——— Helpers below ———

  function assignGenerations(data) {
    const gens = {};
    const visited = new Set();
    const childrenMap = {};

    // build a map: parentId → [childId, …]
    for (const id in data) {
      const rel = data[id].relations || {};
      ["mother", "father"].forEach((role) => {
        const pid = rel[role];
        if (pid != null) {
          childrenMap[pid] = childrenMap[pid] || [];
          childrenMap[pid].push(id);
        }
      });
    }

    function dfs(id, gen) {
      if (visited.has(id)) return;
      visited.add(id);
      gens[gen] = gens[gen] || [];
      gens[gen].push(id);

      // children go one level down
      (childrenMap[id] || []).forEach((cid) => dfs(cid, gen + 1));

      // spouse stays on same level
      const spouse = data[id].relations?.spouse;
      if (spouse != null) dfs(spouse, gen);
    }

    // start at all people with no parents
    Object.keys(data).forEach((id) => {
      const rel = data[id].relations || {};
      if (rel.mother == null && rel.father == null) {
        dfs(id, 0);
      }
    });

    return gens;
  }

  function createPersonBox(id, person) {
    const div = document.createElement("div");
    div.className = "person";
    div.id = `person-${id}`;

    // try PNG, then JFIF
    const img = new Image();
    img.src = `images/${id}.png`;
    img.onload = () => div.prepend(img);
    img.onerror = () => {
      const imgJFIF = new Image();
      imgJFIF.src = `images/${id}.jfif`;
      imgJFIF.onload = () => div.prepend(imgJFIF);
    };
    img.alt = `${person.name.first} ${person.name.last}`;

    // name line
    const fullName = `${person.name.first} ${person.name.middle || ""} ${person.name.last}`
      .replace(/\s+/g, " ")
      .trim();
    const nameEl = document.createElement("div");
    nameEl.innerHTML = `<strong>${fullName}</strong>`;
    div.appendChild(nameEl);

    return div;
  }

  function drawLines(data, positions, ctx) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    const drawnCouples = new Set();

    Object.entries(data).forEach(([id, person]) => {
      const from = positions[id];
      if (!from) return;

      const spouseId = person.relations?.spouse;
      // — Spouse line & shared child branch —
      if (spouseId != null && positions[spouseId]) {
        const key = [id, spouseId].sort().join("-");
        if (!drawnCouples.has(key)) {
          drawnCouples.add(key);
          const to = positions[spouseId];

          // 1) dashed green between spouses
          ctx.beginPath();
          ctx.moveTo(from.x, from.y);
          ctx.lineTo(to.x, to.y);
          ctx.strokeStyle = "green";
          ctx.lineWidth = 1.5;
          ctx.setLineDash([5, 3]);
          ctx.stroke();
          ctx.setLineDash([]);

          // 2) midpoint
          const midX = (from.x + to.x) / 2;
          const midY = (from.y + to.y) / 2;

          // 3) find children of this couple
          const children = Object.entries(data).filter(([cid, c]) => {
            const m = c.relations?.mother;
            const f = c.relations?.father;
            return (
              (m == id && f == spouseId) ||
              (f == id && m == spouseId)
            );
          });

          if (children.length) {
            // get positions
            const pts = children
              .map(([cid]) => positions[cid])
              .filter((p) => p);
            if (pts.length) {
              const childYs = pts.map((p) => p.y);
              const childXs = pts.map((p) => p.x);
              const childY = Math.min(...childYs);
              const minX = Math.min(...childXs),
                maxX = Math.max(...childXs);

              // 4) vertical down to just above kids
              ctx.beginPath();
              ctx.moveTo(midX, midY);
              ctx.lineTo(midX, childY - 40);
              ctx.strokeStyle = "#444";
              ctx.lineWidth = 1.5;
              ctx.stroke();

              // 5) horizontal across kids
              ctx.beginPath();
              ctx.moveTo(minX, childY - 40);
              ctx.lineTo(maxX, childY - 40);
              ctx.stroke();

              // 6) drop to each child
              children.forEach(([cid]) => {
                const cpos = positions[cid];
                if (!cpos) return;
                ctx.beginPath();
                ctx.moveTo(cpos.x, childY - 40);
                ctx.lineTo(cpos.x, cpos.y);
                ctx.stroke();
              });
            }
          }
        }
      }

      // — Solo parent to child (if no spouse) —
      if (spouseId == null) {
        Object.entries(data).forEach(([cid, c]) => {
          const m = c.relations?.mother,
            f = c.relations?.father;
          if ((m == id || f == id) && positions[cid]) {
            const to = positions[cid];
            ctx.beginPath();
            ctx.moveTo(from.x, from.y);
            ctx.lineTo(to.x, to.y);
            ctx.strokeStyle = "#444";
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }
        });
      }
    });
  }
});
