const data = {
    "1": {
        "name": {
            "first": "Delia",
            "middle": "Maureen",
            "last": "Bartucca"
        },
        "relations": {
            "mother": 2,
            "father": 3,
            "spouse": null,
            "children": [4]
        },
        "bio": {
            "desc": "Bio of Delia",
            "gender": "F"
        }
    },
    "2": {
        "name": {
            "first": "Caroline",
            "middle": "Theresa",
            "last": "Bartucca"
        },
        "relations": {
            "mother": null,
            "father": null,
            "spouse": 3,
            "children": [1, 4]
        },
        "bio": {
            "desc": "Bio of Caroline",
            "gender": "F"
        }
    },
    "3": {
        "name": {
            "first": "Domenic",
            "middle": "Christopher",
            "last": "Bartucca"
        },
        "relations": {
            "mother": null,
            "father": null,
            "spouse": 2,
            "children": [1, 4]
        },
        "bio": {
            "desc": "Bio of Domenic",
            "gender": "M"
        }
    },
    "4": {
        "name": {
            "first": "Brendan",
            "middle": "Michael",
            "last": "Bartucca"
        },
        "relations": {
            "mother": 2,
            "father": 3,
            "spouse": null,
            "children": []
        },
        "bio": {
            "desc": "Bio of Brendan",
            "gender": "M"
        }
    }
};

let treeContainer = document.getElementById("family-tree");

function createFamilyMemberBox(memberId) {
    const member = data[memberId];
    const memberBox = document.createElement("div");
    memberBox.classList.add("family-member");

    const boxContent = document.createElement("div");
    boxContent.classList.add("family-member-box");
    boxContent.innerHTML = `
        <div class="name">${member.name.first} ${member.name.last}</div>
        <div class="bio">${member.bio.desc}</div>
    `;

    const infoCard = document.createElement("div");
    infoCard.classList.add("info-card");
    infoCard.innerHTML = `
        <div><strong>Bio:</strong> ${member.bio.desc}</div>
        <div><strong>Gender:</strong> ${member.bio.gender}</div>
    `;
    boxContent.appendChild(infoCard);

    memberBox.appendChild(boxContent);

    // Parent buttons
    if (member.relations.mother) {
        const parentButton = document.createElement("button");
        parentButton.textContent = "Mother";
        parentButton.onclick = () => {
            createFamilyMemberBox(member.relations.mother);
        };
        memberBox.appendChild(parentButton);
    }

    if (member.relations.father) {
        const parentButton = document.createElement("button");
        parentButton.textContent = "Father";
        parentButton.onclick = () => {
            createFamilyMemberBox(member.relations.father);
        };
        memberBox.appendChild(parentButton);
    }

    return memberBox;
}

function renderFamilyTree() {
    Object.keys(data).forEach(memberId => {
        const memberBox = createFamilyMemberBox(memberId);
        treeContainer.appendChild(memberBox);
    });
}

renderFamilyTree();
