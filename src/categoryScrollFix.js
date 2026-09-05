const STYLE_ID = "cacho-category-scroll-fix-style";

function addStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    .cacho-category-scroll-wrap{display:grid;grid-template-columns:34px minmax(0,1fr) 34px;align-items:center;gap:6px;width:89%;max-width:1380px;margin:17px auto 31px}
    .cacho-category-scroll-wrap .category-row{width:auto;max-width:none;margin:0;min-width:0;overflow-x:auto;scroll-behavior:smooth;scrollbar-width:none;padding-bottom:2px}
    .cacho-category-scroll-wrap .category-row::-webkit-scrollbar{display:none}
    .cacho-category-scroll-button{width:34px;height:34px;border:0;border-radius:50%;background:#edf5f2;color:#0d6b62;font-size:20px;font-weight:900;line-height:1;display:grid;place-items:center;cursor:pointer;box-shadow:0 4px 12px rgba(23,53,47,.08);transition:transform .15s ease,background .15s ease}
    .cacho-category-scroll-button:hover{background:#e0efeb;transform:scale(1.04)}
    .cacho-category-scroll-button:active{transform:scale(.97)}
    @media(max-width:1080px){.cacho-category-scroll-wrap{width:92%}}
    @media(max-width:760px){.cacho-category-scroll-wrap{width:94%;margin:12px auto 20px;grid-template-columns:30px minmax(0,1fr) 30px;gap:4px}.cacho-category-scroll-button{width:30px;height:30px;font-size:18px}.cacho-category-scroll-wrap .category-row{padding-bottom:6px}}
  `;
  document.head.appendChild(style);
}

function install() {
  const row = document.querySelector(".category-row");
  if (!row || row.dataset.scrollControlsInstalled === "1") return false;
  row.dataset.scrollControlsInstalled = "1";
  addStyles();

  const wrap = document.createElement("div");
  wrap.className = "cacho-category-scroll-wrap";
  const parent = row.parentElement;
  parent?.insertBefore(wrap, row);
  wrap.appendChild(row);

  const makeButton = (label, direction) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "cacho-category-scroll-button";
    button.setAttribute("aria-label", `Scroll categories ${direction < 0 ? "left" : "right"}`);
    button.textContent = label;
    button.addEventListener("click", () => row.scrollBy({ left: direction * 320, behavior: "smooth" }));
    return button;
  };

  wrap.insertBefore(makeButton("‹", -1), row);
  wrap.appendChild(makeButton("›", 1));
  return true;
}

function boot() {
  if (install()) return;
  const observer = new MutationObserver(() => {
    if (install()) observer.disconnect();
  });
  observer.observe(document.body, { childList: true, subtree: true });
  window.setTimeout(() => observer.disconnect(), 5000);
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
else boot();
