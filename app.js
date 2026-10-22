const ADMIN_PASSWORD = "PTL";

const DEFAULT_KITS = [
  {id:"crystal",name:"Crystal",emoji:"💎",desc:"Timing, Spacing und schnelle Combos."},
  {id:"sword",name:"Sword",emoji:"⚔️",desc:"Movement, Aim und Combo-Management."},
  {id:"axe",name:"Axe",emoji:"🪓",desc:"Crits, Timing und Shield-Play."},
  {id:"nethpot",name:"Netherite Pot",emoji:"🧪",desc:"Healing, Pressure und Inventory-Speed."},
  {id:"uhc",name:"UHC",emoji:"🥇",desc:"Resource-Management und Fights."},
  {id:"smp",name:"SMP",emoji:"🛡️",desc:"Allround-Skills im Survival-PvP."},
  {id:"mace",name:"Mace",emoji:"🔨",desc:"Fall-Damage-Timing und Impact-Hits."},
  {id:"boxing",name:"Boxing",emoji:"🥊",desc:"Aim, W-Tap und konstante Treffer."}
];

function load(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value ?? structuredClone(fallback);
  } catch {
    return structuredClone(fallback);
  }
}

let kits = load("ct_kits", DEFAULT_KITS);
let tests = load("ct_tests", []);
let site = load("ct_site", {discordUrl:""});
let activeKit = "all";
let isAdmin = false;

const $ = id => document.getElementById(id);

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  })[char]);
}

function save() {
  localStorage.setItem("ct_kits", JSON.stringify(kits));
  localStorage.setItem("ct_tests", JSON.stringify(tests));
  localStorage.setItem("ct_site", JSON.stringify(site));
}

function kitFor(id) {
  return kits.find(kit => kit.id === id);
}

function tierColor(tier) {
  const n = Number(tier.replace(/\D/g, "")) || 5;
  return ({1:"#bd8730",2:"#9b4bd0",3:"#347bd7",4:"#27875d",5:"#626979"})[n];
}

function validDiscord(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" &&
      ["discord.gg","discord.com","www.discord.com"].includes(url.hostname)
      ? url.href : "";
  } catch {
    return "";
  }
}

function render() {
  renderFilters();
  renderBoard();
  renderKits();
  renderKitSelect();
  renderAdmin();

  $("playerCount").textContent =
    new Set(tests.map(test => test.name.toLowerCase())).size;
  $("kitCount").textContent = kits.length;

  const discord = validDiscord(site.discordUrl);

  ["discordButton","heroDiscord"].forEach(id => {
    const button = $(id);
    if (discord) {
      button.href = discord;
      button.target = "_blank";
      button.rel = "noreferrer";
    } else {
      button.href = "#community";
      button.removeAttribute("target");
    }
  });
}

function renderFilters() {
  const allKits = [{id:"all",name:"Alle Kits",emoji:"✦"}, ...kits];

  $("kitFilters").innerHTML = allKits.map(kit => `
    <button class="filter ${activeKit === kit.id ? "active" : ""}"
      data-filter="${escapeHTML(kit.id)}">
      ${escapeHTML(kit.emoji)} ${escapeHTML(kit.name)}
    </button>
  `).join("");

  document.querySelectorAll("[data-filter]").forEach(button => {
    button.addEventListener("click", () => {
      activeKit = button.dataset.filter;
      renderFilters();
      renderBoard();
    });
  });
}

function renderBoard() {
  const search = $("searchInput").value.trim().toLowerCase();

  const filtered = tests.filter(test =>
    (activeKit === "all" || test.kitId === activeKit) &&
    test.name.toLowerCase().includes(search)
  );

  const tiers = [
    "HT1","LT1","HT2","LT2","HT3",
    "LT3","HT4","LT4","HT5","LT5"
  ];

  $("tierBoard").innerHTML = tiers.map(tier => {
    const players = filtered
      .filter(player => player.tier === tier)
      .sort((a,b) => a.name.localeCompare(b.name));

    if (!players.length) return "";

    return `
      <div class="tier-row">
        <div class="tier-label" style="background:${tierColor(tier)}">
          ${tier}
          <small>${players.length} PLAYERS</small>
        </div>
        <div class="tier-players">
          ${players.map(player => {
            const kit = kitFor(player.kitId);
            return `
              <div class="player-chip">
                <div class="player-avatar">${escapeHTML(kit?.emoji || "⚔️")}</div>
                <div class="player-info">
                  <strong>${escapeHTML(player.name)}</strong>
                  <small>${escapeHTML(kit?.name || "Kit")}${player.note ? " · " + escapeHTML(player.note) : ""}</small>
                </div>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    `;
  }).join("");

  $("emptyState").hidden = filtered.length > 0;
}

function renderKits() {
  $("kitGrid").innerHTML = kits.map(kit => {
    const count = tests.filter(test => test.kitId === kit.id).length;

    return `
      <article class="kit-card">
        <div class="kit-emoji">${escapeHTML(kit.emoji)}</div>
        <h3>${escapeHTML(kit.name)}</h3>
        <p>${escapeHTML(kit.desc || "Minecraft Bedrock PvP mode.")}</p>
        <span class="kit-count">${count} RANKED PLAYERS</span>
      </article>
    `;
  }).join("");
}

function renderKitSelect() {
  $("playerKit").innerHTML = kits.map(kit => `
    <option value="${escapeHTML(kit.id)}">
      ${escapeHTML(kit.emoji)} ${escapeHTML(kit.name)}
    </option>
  `).join("");
}

function renderAdmin() {
  $("adminResults").innerHTML = tests.length
    ? [...tests].sort((a,b) => a.name.localeCompare(b.name)).map(test => {
        const kit = kitFor(test.kitId);
        return `
          <div class="admin-result">
            <div>
              <strong>${escapeHTML(test.name)}</strong>
              <small>${escapeHTML(kit?.name || "Kit")} · ${escapeHTML(test.note || "Kein Kommentar")}</small>
            </div>
            <div class="result-actions">
              <span class="tier-pill">${escapeHTML(test.tier)}</span>
              <button class="delete-button" data-delete-test="${escapeHTML(test.id)}">Löschen</button>
            </div>
          </div>
        `;
      }).join("")
    : "<p>Noch keine Tests eingetragen.</p>";

  $("adminKits").innerHTML = kits.map(kit => `
    <div class="admin-result">
      <div>
        <strong>${escapeHTML(kit.emoji)} ${escapeHTML(kit.name)}</strong>
        <small>${tests.filter(test => test.kitId === kit.id).length} Spieler</small>
      </div>
      ${DEFAULT_KITS.some(defaultKit => defaultKit.id === kit.id)
        ? '<span class="tier-pill">STANDARD</span>'
        : `<button class="delete-button" data-delete-kit="${escapeHTML(kit.id)}">Entfernen</button>`}
    </div>
  `).join("");

  document.querySelectorAll("[data-delete-test]").forEach(button => {
    button.addEventListener("click", () => {
      tests = tests.filter(test => test.id !== button.dataset.deleteTest);
      save();
      render();
    });
  });

  document.querySelectorAll("[data-delete-kit]").forEach(button => {
    button.addEventListener("click", () => {
      const id = button.dataset.deleteKit;
      kits = kits.filter(kit => kit.id !== id);
      save();
      render();
    });
  });
}

function showModal(id) {
  $(id).hidden = false;
  document.body.style.overflow = "hidden";
}

function hideModal(id) {
  $(id).hidden = true;

  if ($("loginModal").hidden && $("adminModal").hidden) {
    document.body.style.overflow = "";
  }
}

$("adminOpen").addEventListener("click", () => {
  if (isAdmin) {
    $("discordUrl").value = site.discordUrl || "";
    showModal("adminModal");
  } else {
    showModal("loginModal");
  }
});

document.querySelectorAll("[data-close]").forEach(button => {
  button.addEventListener("click", () => hideModal(button.dataset.close));
});

document.querySelectorAll(".backdrop").forEach(backdrop => {
  backdrop.addEventListener("click", event => {
    if (event.target === backdrop) hideModal(backdrop.id);
  });
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    hideModal("loginModal");
    hideModal("adminModal");
  }
});

$("loginForm").addEventListener("submit", event => {
  event.preventDefault();

  if ($("adminPassword").value === ADMIN_PASSWORD) {
    isAdmin = true;
    $("loginError").textContent = "";
    $("adminPassword").value = "";
    hideModal("loginModal");
    $("adminOpen").textContent = "♙ Admin Panel";
    $("discordUrl").value = site.discordUrl || "";
    showModal("adminModal");
  } else {
    $("loginError").textContent = "Falsches Passwort.";
  }
});

$("logoutButton").addEventListener("click", () => {
  isAdmin = false;
  hideModal("adminModal");
  $("adminOpen").textContent = "♙ Admin Login";
});

document.querySelectorAll("[data-tab]").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll("[data-tab]").forEach(tab => {
      tab.classList.toggle("active", tab === button);
    });

    document.querySelectorAll(".tab-panel").forEach(panel => {
      panel.hidden = panel.id !== button.dataset.tab;
    });
  });
});

$("testForm").addEventListener("submit", event => {
  event.preventDefault();

  const name = $("playerName").value.trim();
  const kitId = $("playerKit").value;
  const tier = $("playerTier").value;
  const note = $("testNote").value.trim();

  if (!name || !kitFor(kitId)) return;

  const existing = tests.findIndex(test =>
    test.name.toLowerCase() === name.toLowerCase() &&
    test.kitId === kitId
  );

  const result = {
    id: existing >= 0 ? tests[existing].id : String(Date.now()),
    name,
    kitId,
    tier,
    note
  };

  if (existing >= 0) tests[existing] = result;
  else tests.push(result);

  save();
  render();
  $("testForm").reset();
});

$("kitForm").addEventListener("submit", event => {
  event.preventDefault();

  const name = $("newKitName").value.trim();
  const emoji = $("newKitEmoji").value.trim();

  if (!name || !emoji) return;

  if (kits.some(kit => kit.name.toLowerCase() === name.toLowerCase())) {
    alert("Dieses Kit existiert bereits.");
    return;
  }

  const id = "custom_" + Date.now();

  kits.push({
    id,
    name,
    emoji,
    desc: "Community PvP test mode."
  });

  save();
  render();
  $("kitForm").reset();
});

$("siteForm").addEventListener("submit", event => {
  event.preventDefault();

  const value = $("discordUrl").value.trim();

  if (value && !validDiscord(value)) {
    alert("Bitte gib einen gültigen HTTPS-Discord-Invite-Link ein.");
    return;
  }

  site.discordUrl = value;
  save();
  render();
  alert("Startseite aktualisiert.");
});

$("searchInput").addEventListener("input", renderBoard);

render();
