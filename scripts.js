// Fetch the data from the data.json file
fetch('data.json')
  .then(response => response.json())
  .then(data => {
    const familyTreeContainer = document.getElementById('family-tree');

    // Function to create a family member's block
    function createFamilyMember(personId, person) {
      const personDiv = document.createElement('div');
      personDiv.classList.add('person');

      // Create the image element (handle missing images)
      const img = document.createElement('img');
      const imageUrl = `images/${personId}.jfif`;
      const imgCheck = new Image();
      imgCheck.src = imageUrl;
      imgCheck.onload = function() {
        img.src = imageUrl;
      };
      imgCheck.onerror = function() {
        // No image, leave it empty
        img.src = '';
      };
      img.alt = `${person.name.first} ${person.name.last}`;
      personDiv.appendChild(img);

      // Add the person's name
      const name = document.createElement('p');
      name.textContent = `${person.name.first} ${person.name.last}`;
      personDiv.appendChild(name);

      // Display birth info
      const birth = document.createElement('p');
      birth.textContent = `Born: ${person.birth.month}/${person.birth.day}/${person.birth.year} in ${person.birth.city}, ${person.birth.state}, ${person.birth.country}`;
      personDiv.appendChild(birth);

      // Display bio
      const bio = document.createElement('p');
      bio.textContent = person.bio.desc;
      personDiv.appendChild(bio);

      return personDiv;
    }

    // Function to create parent-child relationships
    function createParentChildBranch(parentId, parent, childrenIds) {
      const parentDiv = createFamilyMember(parentId, parent);
      const childrenDiv = document.createElement('div');
      childrenDiv.classList.add('children');

      // Create child elements
      childrenIds.forEach(childId => {
        const child = data[childId];
        const childDiv = createFamilyMember(childId, child);
        childrenDiv.appendChild(childDiv);
      });

      parentDiv.appendChild(childrenDiv);
      return parentDiv;
    }

    // Function to create spouse relationship
    function createSpouseBranch(personId, person) {
      const personDiv = createFamilyMember(personId, person);
      if (person.relations.spouse) {
        const spouseId = person.relations.spouse;
        const spouse = data[spouseId];
        const spouseDiv = createFamilyMember(spouseId, spouse);
        // Position them side by side as spouses
        const spouseContainer = document.createElement('div');
        spouseContainer.classList.add('spouse-container');
        spouseContainer.appendChild(personDiv);
        spouseContainer.appendChild(spouseDiv);
        return spouseContainer;
      }
      return personDiv;
    }

    // Build the family tree for each person
    for (const personId in data) {
      const person = data[personId];
      let familyMemberDiv;

      // Check if the person has children and create parent-child branch
      if (person.relations.children && person.relations.children.length > 0) {
        familyMemberDiv = createParentChildBranch(personId, person, person.relations.children);
      } else {
        familyMemberDiv = createSpouseBranch(personId, person);
      }

      familyTreeContainer.appendChild(familyMemberDiv);
    }
  })
  .catch(error => {
    console.error('Error loading data:', error);
  });
