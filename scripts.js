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

      // Check if the image exists
      const imageUrl = `images/${personId}.jfif`; // Use .jfif or .png images
      const imgCheck = new Image();
      imgCheck.src = imageUrl;

      // If the image exists, create the img element, otherwise skip it
      imgCheck.onload = function() {
        const img = document.createElement('img');
        img.src = imageUrl;
        img.alt = `${person.name.first} ${person.name.last}`;
        personDiv.appendChild(img); // Append the image to the container
      };

      imgCheck.onerror = function() {
        // Skip adding the image if it doesn't exist
        // Just continue with the rest of the content
      };

      // Create the person's name
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

      // Display relations (mother, father, spouse)
      const relations = document.createElement('p');
      relations.textContent = `Mother: ${person.relations.mother || 'N/A'}, Father: ${person.relations.father || 'N/A'}, Spouse: ${person.relations.spouse || 'N/A'}`;
      personDiv.appendChild(relations);

      // Append the family member to the family tree container
      familyTreeContainer.appendChild(personDiv);
    }
  })
  .catch(error => {
    console.error('Error loading data:', error);
  });
