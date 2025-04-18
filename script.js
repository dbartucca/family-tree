let familyData = {};

fetch('data.json')
  .then(res => res.json())
  .then(data => {
    familyData = data;
  });

function showInfo(id) {
  const person = familyData[id];
  if (!person) return;

  const { name, birth, death, relations, bio } = person;

  const fullName = `${name.first} ${name.middle || ''} ${name.last}`.trim();
  const birthStr = `${birth.month}/${birth.day}/${birth.year} in ${birth.city}, ${birth.state}, ${birth.country}`;
  const deathStr = death.year
    ? `${death.month}/${death.day}/${death.year} in ${death.city}, ${death.state}, ${death.country}`
    : "Still living";

  const motherName = relations.mother && familyData[relations.mother]
    ? `${familyData[relations.mother].name.first} ${familyData[relations.mother].name.last}`
    : "Unknown";
  const fatherName = relations.father && familyData[relations.father]
    ? `${familyData[relations.father].name.first} ${familyData[relations.father].name.last}`
    : "Unknown";
  const spouseName = relations.spouse && familyData[relations.spouse]
    ? `${familyData[relations.spouse].name.first} ${familyData[relations.spouse].name.last}`
    : "None";

  const bioText = `
    <strong>Full Name:</strong> ${fullName}<br/>
    <strong>Born:</strong> ${birthStr}<br/>
    <strong>Died:</strong> ${deathStr}<br/>
    <strong>Gender:</strong> ${bio.gender}<br/>
    <strong>Military:</strong> ${bio.military || "None"}<br/>
    <strong>Mother:</strong> ${motherName}<br/>
    <strong>Father:</strong> ${fatherName}<br/>
    <strong>Spouse:</strong> ${spouseName}<br/><br/>
    <strong>Bio:</strong> ${bio.desc}
  `;

  document.getElementById('modalName').textContent = fullName;
  document.getElementById('modalBio').innerHTML = bioText;
  document.getElementById('infoModal').style.display = 'block';
}
