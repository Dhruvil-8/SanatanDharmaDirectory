const listContainer = document.getElementById("list");
const searchInput = document.getElementById("search");
const typeFilter = document.getElementById("typeFilter");
const trustFilter = document.getElementById("trustFilter");

let resources = [];
let categories = [];

const trustLevels = {
    academic: 1,
    traditional: 2,
    community: 3,
    unverified: 4
};

// Theme Toggle Logic Removed

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
        const errDiv = document.createElement("div");
        errDiv.style.cssText = "text-align: center; padding: 40px;";
        errDiv.textContent = "Failed to load data. Ensure you are running this via a local server or GitHub Pages.";
        listContainer.appendChild(errDiv);
        console.error("Data load error:", error);
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

            // --- Safe DOM construction (no innerHTML with data) ---
            const listHeader = document.createElement("div");
            listHeader.className = "list-header";

            if (r.type) {
                const typeSpan = document.createElement("span");
                typeSpan.className = "type-label";
                typeSpan.textContent = `[${r.type}]`;
                listHeader.appendChild(typeSpan);
            }

            const h3 = document.createElement("h3");
            const titleLink = document.createElement("a");
            titleLink.href = r.url;
            titleLink.target = "_blank";
            titleLink.rel = "noopener noreferrer";
            titleLink.style.cssText = "color: inherit; text-decoration: none;";
            titleLink.textContent = r.title;
            h3.appendChild(titleLink);
            listHeader.appendChild(h3);
            item.appendChild(listHeader);

            const desc = document.createElement("p");
            desc.textContent = r.description;
            item.appendChild(desc);

            const meta = document.createElement("div");
            meta.className = "list-meta";

            const badges = document.createElement("div");
            badges.className = "badges";
            const trustSpan = document.createElement("span");
            const safeTrust = /^[a-z]+$/.test(r.trust || '') ? r.trust : "unknown";
            trustSpan.className = `badge badge-${safeTrust}`;
            trustSpan.textContent = r.trust || "unknown";
            badges.appendChild(trustSpan);
            meta.appendChild(badges);

            const actions = document.createElement("div");
            actions.style.cssText = "display: flex; gap: 15px; align-items: center;";

            const originText = r.origin ? (r.origin.organization || r.origin.country || '') : '';
            if (originText) {
                const originSpan = document.createElement("span");
                originSpan.className = "origin-text";
                originSpan.textContent = originText;
                actions.appendChild(originSpan);
            }

            const visitLink = document.createElement("a");
            visitLink.href = r.url;
            visitLink.className = "visit-link";
            visitLink.target = "_blank";
            visitLink.rel = "noopener noreferrer";
            visitLink.textContent = "Visit →";
            actions.appendChild(visitLink);
            meta.appendChild(actions);
            item.appendChild(meta);

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
