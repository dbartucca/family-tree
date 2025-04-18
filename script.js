let familyData = {};

fetch('data.json')
  .then(res => res.json())
  .then(data => {
    familyData = data;
    buildTree(); // build the UI after loading data
  });

function buildTree() {
  const treeContainer = document.getElementById('tree');
  const ul = document.createElement('ul');

  for (const id in familyData) {
    const person = familyData[id];
    const fullName = `${person.name.first} ${person.name.middle || ''} ${person.name.last}`.trim();

    const li = document.createElement('li');
    const div = document.createElement('div');
    div.textContent = fullName;
    div.setAttribute('onclick', `showInfo(${id})`);

    li.appendChild(div);
    ul.appendChild(li);
  }

  treeContainer.appendChild(ul);
}
