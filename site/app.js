const listContainer = document.getElementById("list");
const searchInput = document.getElementById("search");
const typeFilter = document.getElementById("typeFilter");
const trustFilter = document.getElementById("trustFilter");
const themeToggle = document.getElementById("themeToggle");

let resources = [];
let categories = [];

const trustLevels = {
    academic: 1,
    traditional: 2,
    community: 3,
    unverified: 4
};

// Theme Toggle Logic
let isDark = false;
themeToggle.addEventListener("click", () => {
    isDark = !isDark;
    if (isDark) {
        document.body.classList.remove("light-mode");
        document.body.classList.add("dark-mode");
        themeToggle.textContent = "Light Mode";
    } else {
        document.body.classList.remove("dark-mode");
        document.body.classList.add("light-mode");
        themeToggle.textContent = "Dark Mode";
    }
});

async function loadData() {
    try {
        const resReq = fetch("../data/resources.json");
        const catReq = fetch("../data/categories.json");

        const [resResp, catResp] = await Promise.all([resReq, catReq]);

        resources = await resResp.json();
        categories = await catResp.json();

        // Sort heavily trusted first
        resources.sort((a, b) => {
            const trustA = trustLevels[a.trust] || 99;
            const trustB = trustLevels[b.trust] || 99;
            return trustA - trustB;
        });

        // Categories no longer need a dropdown, they are grouped in render()
        render(resources);
    } catch (error) {
        listContainer.innerHTML = `<div style="text-align: center; padding: 40px;">Failed to load data. Ensure you are running this via a local server or GitHub Pages.</div>`;
        console.error(error);
    }
}

function render(list) {
    listContainer.innerHTML = "";

    if (list.length === 0) {
        listContainer.innerHTML = `<div style="text-align: center; padding: 40px; color: var(--text-muted);">No resources found matching the criteria.</div>`;
        return;
    }

    // Group items by category
    const grouped = list.reduce((acc, r) => {
        if (!acc[r.category]) {
            acc[r.category] = [];
        }
        acc[r.category].push(r);
        return acc;
    }, {});

    // Render each category block
    Object.keys(grouped).sort().forEach(catName => {
        const catGroup = grouped[catName];

        // Build the section wrapper
        const section = document.createElement("div");
        section.className = "category-section";

        // Build the section header
        const header = document.createElement("h2");
        header.className = "category-header";
        header.textContent = catName;
        section.appendChild(header);

        // Build the items wrapper
        const itemsWrapper = document.createElement("div");
        itemsWrapper.className = "category-items";

        catGroup.forEach(r => {
            const item = document.createElement("div");
            item.className = "list-item";

            const originText = r.origin ? `${r.origin.organization || r.origin.country || ''}` : '';
            const trustClass = `badge badge-${r.trust}`;

            item.innerHTML = `
              <div class="list-header">
                ${r.type ? `<span class="type-label">[${r.type}]</span>` : ''}
                <h3><a href="${r.url}" target="_blank" rel="noopener noreferrer" style="color: inherit; text-decoration: none;">${r.title}</a></h3>
              </div>
              <p>${r.description}</p>
              <div class="list-meta">
                <div class="badges">
                  <span class="${trustClass}">${r.trust || "unknown"}</span>
                </div>
                <div style="display: flex; gap: 15px; align-items: center;">
                    ${originText ? `<span class="origin-text">${originText}</span>` : ''}
                    <a href="${r.url}" class="visit-link" target="_blank" rel="noopener noreferrer">Visit →</a>
                </div>
              </div>
            `;
            itemsWrapper.appendChild(item);
        });

        section.appendChild(itemsWrapper);
        listContainer.appendChild(section);
    });
}

const filterHandler = () => {
    const q = searchInput.value.toLowerCase();
    const type = typeFilter.value;
    const trst = trustFilter.value;

    const filtered = resources.filter(r => {
        const matchSearch =
            r.title.toLowerCase().includes(q) ||
            r.description.toLowerCase().includes(q) ||
            (r.origin && JSON.stringify(r.origin).toLowerCase().includes(q));

        const matchType = type === "all" || r.type === type;
        const matchTrust = trst === "all" || r.trust === trst;

        return matchSearch && matchType && matchTrust;
    });

    render(filtered);
};

searchInput.addEventListener("input", filterHandler);
typeFilter.addEventListener("change", filterHandler);
trustFilter.addEventListener("change", filterHandler);

loadData();
