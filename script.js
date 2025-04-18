function showInfo(person) {
  const info = {
    grandparent: "👴 Born 1940, loved gardening. Married to Grandma Jo.",
    parentA: "👨 Born 1965, teacher, father of A1 and A2.",
    parentB: "👩 Born 1968, nurse, mother of B1.",
    childA1: "🧑 Born 1990, doctor, lives in Chicago.",
    childA2: "👩 Born 1993, artist, lives in LA.",
    childB1: "👶 Born 1995, student."
  };

  alert(info[person] || "No information available yet.");
}
