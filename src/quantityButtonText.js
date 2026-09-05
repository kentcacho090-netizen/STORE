function syncQuantityLabels() {
  document.querySelectorAll(".add-btn").forEach((button) => {
    if (button.textContent.includes("Out of stock")) return;
    const card = button.closest("article") || button.parentElement;
    const input = card?.querySelector("input[type=number]");
    if (!input) return;
    const value = Math.max(1, Number(input.value) || 1);
    button.textContent = `+ Add ${value} to order`;
  });
}

document.addEventListener("input", (event) => {
  if (event.target.matches("input[type=number]")) syncQuantityLabels();
});

document.addEventListener("click", (event) => {
  if (event.target.closest(".product-quantity") || event.target.closest(".add-btn")) {
    window.setTimeout(syncQuantityLabels, 0);
  }
});

window.setTimeout(syncQuantityLabels, 0);
