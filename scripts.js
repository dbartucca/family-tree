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
      img.alt = `${person.name.first} ${person.name.last}`;

      // Try to load the person's image
      const imageUrl = `images/${personId}.jfif`; // Use .jfif or .png images
      const placeholderImage = 'images/placeholder.png'; // Default placeholder image

      // Create an image element with a fallback
      const imgCheck = new Image();
      imgCheck.src = imageUrl;
      imgCheck.onload = function() {
        img.src = imageUrl; // If the image exists, set the source
      };
      imgCheck.onerror = function() {
        img.src = placeholderImage; // If the image doesn't exist, use the placeholder
      };

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

      // If the
