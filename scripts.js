document.addEventListener("DOMContentLoaded", async () => {
  const data = await fetch("data.json").then(r => r.json());
  const canvas = document.getElementById("connection-canvas");
  const nodesContainer = document.getElementById("nodes-container");
  const ctx = canvas.getContext("2d");

  // Layout constants
  const NODE_W = 160, NODE_H = 100;
  const H_SPACING = 300, V_SPACING = 180; // Increased horizontal spacing
  const TOP_OFFSET = 50;

  // 1) Assign people to generations
  const generations = assignGenerations(data);

  // 2) Position every box and record its center
  const positions = {};
  let maxX = 0, maxY = 0;

  // Generation 0: roots spread evenly
  const roots = generations[0] || [];
  const rootTotalW = (roots.length - 1) * H_SPACING;
  let startX = (window.innerWidth - rootTotalW) / 2;
  roots.forEach((id, i) => {
    const x = startX + i * H_SPACING;
    const y = TOP_OFFSET;
    positions[id] = { x, y: y + NODE_H / 2 };
    createBox(id, data[id], x, y);
    maxX = Math.max(maxX, x + NODE_W / 2);
    maxY = Math.max(maxY, y + NODE_H);
  });

  // Generations >0: group by parent(s), then center children under them
  Object.keys(generations)
    .map(n => parseInt(n, 10))
    .filter(n => n > 0)
    .sort((a, b) => a - b)
    .forEach(gen => {
      const ids = generations[gen];
      const groups = {};

      // group siblings by couple or single parent
      ids.forEach(id => {
        const { mother, father } = data[id].relations;
        let key;
        if (mother != null && father != null) {
          const [a, b] = [mother, father].sort((a, b) => a - b);
          key = `c${a}-${b}`;
        } else if (mother != null) {
          key = `p${mother}`;
        } else if (father != null) {
          key = `p${father}`;
        } else {
          key = `solo${id}`;
        }
        (groups[key] = groups[key] || []).push(id);
      });

      // position each group
      Object.entries(groups).forEach(([key, kids]) => {
        let anchorX;
        if (key.startsWith("c")) {
          const [, pair] = key.match(/^c(.+)$/);
          const [a, b] = pair.split("-").map(Number);
          anchorX = (positions[a].x + positions[b].x) / 2;
        } else if (key.startsWith("p")) {
          anchorX = positions[parseInt(key.slice(1))].x;
        } else {
          anchorX = window.innerWidth / 2;
        }
        const totalW = (kids.length - 1) * H_SPACING;
        const sx = anchorX - totalW / 2;
        const y = gen * V_SPACING + TOP_OFFSET;

        // Position each child
        kids.forEach((cid, idx) => {
          const x = sx + idx * H_SPACING;
          positions[cid] = { x, y: y + NODE_H / 2 };
          createBox(cid, data[cid], x, y);
          maxX = Math.max(maxX, x + NODE_W / 2);
          maxY = Math.max(maxY, y + NODE_H);
        });
      });
    });

  // 3) Enforce male-left for every couple
  enforceMaleLeft();

  // 4) Resize canvas & container
  const fullW = Math.max(maxX + 50, window.innerWidth);
  const fullH = Math.max(maxY + 50, window.innerHeight);
  canvas.width = fullW; canvas.height = fullH;
  nodesContainer.style.width = fullW + "px";
  nodesContainer.style.height = fullH + "px";

  // 5) Draw lines
  drawLines(data, positions, ctx);

  // ——— Helpers ———

  function assignGenerations(data) {
    const gens = {}, visited = new Set(), childrenMap = {};

    // map parent → [child...]
    for (const id in data) {
      const rel = data[id].relations || {};
      ["mother", "father"].forEach(r => {
        if (rel[r] != null) {
          (childrenMap[rel[r]] = childrenMap[rel[r]] || []).push(parseInt(id));
        }
      });
    }

    function dfs(id, gen) {
      if (visited.has(id)) return;
      visited.add(id);
      (gens[gen] = gens[gen] || []).push(id);
      (childrenMap[id] || []).forEach(cid => dfs(cid, gen + 1));
      const sp = data[id].relations?.spouse;
      if (sp != null) dfs(sp, gen);
    }

    Object.keys(data).forEach(id => {
      const rel = data[id].relations || {};
      if (rel.mother == null && rel.father == null) dfs(parseInt(id), 0);
    });

    return gens;
  }

  function createBox(id, person, centerX, topY) {
    const div = document.createElement("div");
    div.className = "person";
    div.id = `person-${id}`;
    div.style.left = (centerX - NODE_W / 2) + "px";
    div.style.top = topY + "px";

    // image (PNG then JFIF)
    const img = new Image();
    img.src = `images/${id}.png`;
    img.onload = () => div.prepend(img);
    img.onerror = () => {
      const j = new Image();
      j.src = `images/${id}.jfif`;
      j.onload = () => div.prepend(j);
    };
    img.alt = person.name.first;

    // name
    const full = [person.name.first, person.name.middle, person.name.last]
      .filter(s => s).join(" ");
    const nm = document.createElement("div");
    nm.innerHTML = `<strong>${full}</strong>`;
    div.appendChild(nm);

    nodesContainer.appendChild(div);
  }

  function enforceMaleLeft() {
    // For each couple, if female on left & male on right, swap
    Object.entries(data).forEach(([id, p]) => {
      const sp = p.relations?.spouse;
      if (sp != null && id < sp) { // only once per pair
        const him = p.bio.gender === "M" ? parseInt(id) : parseInt(sp);
        const her = p.bio.gender === "F" ? parseInt(id) : parseInt(sp);
        if (him && her) {
          const bH = document.getElementById(`person-${him}`);
          const bF = document.getElementById(`person-${her}`);
          const posH = parseFloat(bH.style.left), posF = parseFloat(bF.style.left);
          if (posH > posF) {
            // swap positions in both DOM and positions object
            bH.style.left = posF + "px";
            bF.style.left = posH + "px";
            const tmpX = positions[him].x;
            positions[him].x = positions[her].x;
            positions[her].x = tmpX;
          }
        }
      }
    });
  }

  function drawLines(data, pos, ctx) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    const couplesDone = new Set();

    Object.entries(data).forEach(([id, p]) => {
      const from = pos[id];
      if (!from) return;
      const sp = p.relations?.spouse;

      // spouse + shared children
      if (sp != null && pos[sp]) {
        const key = [id, sp].sort().join("-");
        if (!couplesDone.has(key)) {
          couplesDone.add(key);
          const to = pos[sp];

          // dashed line
          ctx.beginPath();
          ctx.moveTo(from.x, from.y);
          ctx.lineTo(to.x, to.y);
          ctx.strokeStyle = "green";
          ctx.lineWidth = 1.5;
          ctx.setLineDash([5, 3]);
          ctx.stroke();
          ctx.setLineDash([]);

          // midpoint
          const midX = (from.x + to.x) / 2, midY = (from.y + to.y) / 2;

          // find children
          const kids = Object.entries(data)
            .filter(([cid, c]) => {
              const m = c.relations?.mother, f = c.relations?.father;
              return (m == id && f == sp) || (f == id && m == sp);
            }).map(([cid]) => parseInt(cid));

          if (kids.length) {
            const pts = kids.map(cid => pos[cid]).filter(Boolean);
            if (pts.length) {
              const childY = Math.min(...pts.map(p => p.y));
              const dxs = pts.map(p => p.x - midX);
              const maxDx = Math.max(...dxs.map(d => Math.abs(d)));
              const leftX = midX - maxDx, rightX = midX + maxDx;

              // vertical drop
              ctx.beginPath();
              ctx.moveTo(midX, midY);
              ctx.lineTo(midX, childY - 40);
              ctx.strokeStyle = "#444";
              ctx.lineWidth = 1.5;
              ctx.stroke();

              // symmetrical horizontal
              ctx.beginPath();
              ctx.moveTo(leftX, childY - 40);
              ctx.lineTo(rightX, childY - 40);
              ctx.stroke();

              // drops
              kids.forEach(cid => {
                const cpos = pos[cid];
                ctx.beginPath();
                ctx.moveTo(cpos.x, childY - 40);
                ctx.lineTo(cpos.x, cpos.y);
                ctx.stroke();
              });
            }
          }
        }
      }

      // solo parent→child
      if (sp == null) {
        Object.entries(data).forEach(([cid, c]) => {
          const m = c.relations?.mother, f = c.relations?.father;
          if ((m == id || f == id) && pos[cid]) {
            const to = pos[cid];
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
