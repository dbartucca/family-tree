// Fetch the data from the data.json file
fetch('data.json')
  .then(response => response.json())
  .then(data => {
    const familyTreeContainer = document.getElementById('family-tree');

    // Iterate through each person in the data
    for (const personId in data) {
      const person = data[personId];

      // Create the family member container
      const personDiv = document.createElement('div');
      personDiv.classList.add('person');

      // Create the image element (this assumes image names are based on person ID)
      const img = document.createElement('img');
      img.src = `images/${personId}.jfif`; // Use .jfif or .png images
      img.alt = `${person.name.first} ${person.name.last}`;

      // Create the person's name
      const name = document.createElement('p');
      name.textContent = `${person.name.first} ${person.name.last}`;

      // Append the image and name to the person container
      personDiv.appendChild(img);
      personDiv.appendChild(name);

      // Display birth info
      const birth = document.createElement('p');
      birth.textContent = `Born: ${person.birth.month}/${person.birth.day}/${person.birth.year} in ${person.birth.city}, ${person.birth.state}, ${person.birth.country}`;
      personDiv.appendChild(birth);

      // Display bio
      const bio = document.createElement('p');
      bio.textContent = person.bio.desc;
      personDiv.appendChild(bio);

      // Display relations (mother, father, spouse)
      const relations = document.createElement('p');
      relations.textContent = `Mother: ${person.relations.mother || 'N/A'}, Father: ${person.relations.father || 'N/A'}, Spouse: ${person.relations.spouse || 'N/A'}`;
      personDiv.appendChild(relations);

      // Append the family member to the family tree container
      familyTreeContainer.appendChild(personDiv);

      // If the person has children, recursively display them
      if (person.relations.mother || person.relations.father) {
        // You could add logic here to show the children under this person
        // For simplicity, let's leave that for future enhancements.
      }
    }
  })
  .catch(error => {
    console.error('Error loading data:', error);
  });
