// Fetch and build
fetch('data.json')
  .then(r => r.json())
  .then(data => {
    const container = document.getElementById('family-tree');

    // Create person card
    function makePerson(id, info) {
      const d = document.createElement('div');
      d.className = 'person';

      // Optional image
      const img = new Image();
      img.src = `images/${id}.jfif`;
      img.onload = () => d.prepend(img);
      img.onerror = () => {
        const imgPng = new Image();
        imgPng.src = `images/${id}.png`;
        imgPng.onload = () => d.prepend(imgPng);
      };

      // Name
      const name = document.createElement('p');
      name.textContent = `${info.name.first} ${info.name.last}`;
      d.append(name);

      // Birth
      const b = info.birth;
      const birth = document.createElement('p');
      birth.textContent = `Born: ${b.month}/${b.day}/${b.year}`;
      d.append(birth);

      // Bio
      const bio = document.createElement('p');
      bio.textContent = info.bio.desc;
      d.append(bio);

      return d;
    }

    // Parent → children branch
    function branch(parentId) {
      const parent = makePerson(parentId, data[parentId]);
      const kids = data[parentId].relations.children || [];
      if (kids.length) {
        const cDiv = document.createElement('div');
        cDiv.className = 'children';
        kids.forEach(cid => cDiv.append(makePerson(cid, data[cid])));
        parent.append(cDiv);
      }
      return parent;
    }

    // Spouse side‐by‐side
    function spousePair(id) {
      const info = data[id];
      if (!info.relations.spouse) return makePerson(id, info);
      const sId = info.relations.spouse;
      const wrap = document.createElement('div');
      wrap.className = 'spouse-container';
      wrap.append(makePerson(id, info), makePerson(sId, data[sId]));
      return wrap;
    }

    // Build everything
    Object.keys(data).forEach(id => {
      const rel = data[id].relations;
      // only render top‐level blocks (parent branches or spouse pairs)
      if (rel.mother || rel.father) return; 
      if (rel.children?.length) {
        container.append(branch(id));
      } else {
        container.append(spousePair(id));
      }
    });

    // Simple search
    document.getElementById('search').addEventListener('input', e => {
      const q = e.target.value.toLowerCase();
      document.querySelectorAll('.person').forEach(p => {
        const txt = p.textContent.toLowerCase();
        p.style.display = txt.includes(q) ? '' : 'none';
      });
    });
  })
  .catch(console.error);
