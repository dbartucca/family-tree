fetch("family-tree.json")
  .then(res => res.json())
  .then(data => buildTree(data));

function buildTree(data) {
  const container = document.getElementById("tree-container");

  Object.keys(data).forEach(id => {
    const person = data[id];

    const card = document.createElement("div");
    card.className = "person";
    card.id = `person-${id}`;

    card.innerHTML = `
      <img src="images/${id}.png" onerror="this.style.display='none'">
      <h3>${person.name.first} ${person.name.last}</h3>
      <p>${formatBirth(person.birth)}</p>
    `;

    card.addEventListener("click", () => showDetails(person));

    container.appendChild(card);
  });
}

function formatBirth(birth) {
  if (!birth.year) return "";
  return `b. ${birth.month || ""}/${birth.day || ""}/${birth.year}`;
}

function showDetails(person) {
  alert(
    `${person.name.first} ${person.name.last}\n` +
    `Born: ${person.birth.year || "Unknown"}`
  );
}
