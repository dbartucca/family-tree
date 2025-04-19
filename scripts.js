// Fetch and build
fetch('data.json')
  .then(r => r.json())
  .then(data => {
    const container = document.getElementById('family-tree');

    // Function to create a person's block
    function createPerson(id, info, x, y) {
      const d = document.createElement('div');
      d.className = 'person';
      d.style.left = `${x}px`;
      d.style.top = `${y}px`;

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

      container.append(d);
      return d;
    }

    // Create relationship lines
    function drawLine(x1, y1, x2, y2, type) {
      const line = document.createElement('div');
      line.classList.add('line');
      line.classList.add(type);
      if (type === 'line-parent-child') {
        line.style.left = `${x1 + 60}px`; // Center of parent box
        line.style.top = `${y1 + 100}px`; // Just below the parent box
        line.style.width = `${Math.abs(x2 - x1) - 60}px`;
      } else if (type === 'line-spouse') {
        line.style.left = `${x1 + 80}px`; // Adjust for spouse distance
        line.style.top = `${y1 + 45}px`; // Center of the spouse boxes
        line.style.width = `${Math.abs(x2 - x1)}px`;
      }
      container.appendChild(line);
    }

    // Create parent-child relationships (horizontal)
    function createParentChildBranch(parentId, parent, childrenIds, startX, startY) {
      const parentBox = createPerson(parentId, parent, startX, startY);
      let nextX = startX;
      const childBoxes = [];
      childrenIds.forEach((childId, index) => {
        const child = data[childId];
        const childBox = createPerson(childId, child, nextX, startY + 200); // Space children below the parent
        childBoxes.push(childBox);
        nextX += 180; // Increase spacing for the next child
        drawLine(startX + 60, startY + 100, nextX - 60, startY + 200, 'line-parent-child'); // Parent to child line
      });

      return { parentBox, childBoxes };
    }

    // Create spouse relationships (side by side)
    function createSpouseBranch(personId, person, startX, startY) {
      const spouseBox = createPerson(personId, person, startX, startY);
      if (person.relations.spouse) {
        const spouseId = person.relations.spouse;
        const spouse = data[spouseId];
        const spouseBox2 = createPerson(spouseId, spouse, startX + 180, startY); // Place spouse next to the person
        drawLine(startX + 60, startY + 100, startX + 180 + 60, startY + 100, 'line-spouse'); // Spouse line
        return { personBox: spouseBox, spouseBox: spouseBox2 };
      }
      return { personBox: spouseBox };
    }

    // Build family tree
    let xOffset = 0;
    Object.keys(data).forEach(id => {
      const person = data[id];
      const rel = person.relations;

      // Only render top-level blocks (parents have children, or spouse has no parent)
      if (rel.mother || rel.father) return;

      // Handle parents and children
      if (rel.children?.length) {
        const { parentBox, childBoxes } = createParentChildBranch(id, person, rel.children, xOffset, 0);
        xOffset += 180 * (childBoxes.length + 1); // Add space for next set of children
      } else {
        const { personBox, spouseBox } = createSpouseBranch(id, person, xOffset, 0);
        xOffset += 180 * 2; // Account for both spouse and person
      }
    });

  })
  .catch(console.error);
