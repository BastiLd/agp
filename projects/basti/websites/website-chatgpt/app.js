// === PAGE SWITCHING ===
const pages = {
    home: document.getElementById("home"),
    create: document.getElementById("create"),
    study: document.getElementById("study")
};

function showPage(page) {
    Object.values(pages).forEach(p => p.classList.add("hidden"));
    pages[page].classList.remove("hidden");
}

// Nav buttons
document.getElementById("btn-home").onclick = () => showPage("home");
document.getElementById("btn-create").onclick = () => showPage("create");
document.getElementById("btn-study").onclick = () => showPage("study");


// === LOCAL STORAGE ===
let sets = JSON.parse(localStorage.getItem("flashSets") || "[]");
let activeSet = null;
let activeCardIndex = 0;


// === HOME: DISPLAY SETS ===
function renderSets() {
    const box = document.getElementById("set-list");
    box.innerHTML = "";

    sets.forEach((s, i) => {
        const div = document.createElement("div");
        div.className = "set-item";
        div.innerHTML = `<h3>${s.title}</h3><p>${s.cards.length} cards</p>`;
        div.onclick = () => startStudy(i);
        box.appendChild(div);
    });
}

renderSets();


// === CREATE SET ===
document.getElementById("add-card").onclick = () => {
    const row = document.createElement("div");
    row.className = "creator-row";
    row.innerHTML = `
        <input class="term" placeholder="Term">
        <input class="definition" placeholder="Definition">
    `;
    document.getElementById("card-creator").appendChild(row);
};

// Save set
document.getElementById("save-set").onclick = () => {
    const title = document.getElementById("set-title").value;
    const rows = document.querySelectorAll(".creator-row");

    const cards = [];
    rows.forEach(r => {
        const term = r.querySelector(".term").value;
        const def = r.querySelector(".definition").value;
        if (term && def) cards.push({ term, def });
    });

    if (!title || cards.length === 0) {
        alert("Enter a title and at least one card!");
        return;
    }

    sets.push({ title, cards });
    localStorage.setItem("flashSets", JSON.stringify(sets));

    alert("Set saved!");
    renderSets();
    showPage("home");
};


// === STUDY MODE ===
const flash = document.getElementById("flashcard");
const front = flash.querySelector(".front");
const back = flash.querySelector(".back");

function startStudy(index) {
    activeSet = sets[index];
    activeCardIndex = 0;

    document.getElementById("study-title").textContent = activeSet.title;
    loadCard();
    showPage("study");
}

function loadCard() {
    const card = activeSet.cards[activeCardIndex];
    front.textContent = card.term;
    back.textContent = card.def;
    flash.classList.remove("flipped");
}

// Flip card
document.getElementById("flip-card").onclick = () =>
    flash.classList.toggle("flipped");

// Next / Prev
document.getElementById("next-card").onclick = () => {
    activeCardIndex = (activeCardIndex + 1) % activeSet.cards.length;
    loadCard();
};

document.getElementById("prev-card").onclick = () => {
    activeCardIndex =
        (activeCardIndex - 1 + activeSet.cards.length) %
        activeSet.cards.length;
    loadCard();
};
