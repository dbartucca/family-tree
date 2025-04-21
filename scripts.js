fetch('data.json')
  .then(response => response.json())
  .then(rawData => {
    const familyTreeData = Object.entries(rawData).map(([id, person]) => {
      const fullName = `${person.name.first} ${person.name.middle || ''} ${person.name.last}`.trim();
      const birth = person.birth ? `${person.birth.year}` : '';
      const gender = person.bio.gender || 'M';

      const node = {
        id: parseInt(id),
        name: fullName,
        birth: birth,
        bio: person.bio.desc,
        gender: gender,
        img: gender === 'F'
          ? "https://cdn.balkan.app/shared/female.jpg"
          : "https://cdn.balkan.app/shared/male.jpg"
      };

      // Prefer mother as parent node if defined
      if (person.relations.mother) {
        node.pid = person.relations.mother;
      } else if (person.relations.father) {
        node.pid = person.relations.father;
      }

      return node;
    });

    const chart = new OrgChart(document.getElementById("tree"), {
      nodeBinding: {
        field_0: "name",
        field_1: "birth",
        img_0: "img"
      }
    });

    chart.load(familyTreeData);
  });
