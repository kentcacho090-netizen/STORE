function syncQuantityLabels() {
  document.querySelectorAll(".product-buy-row").forEach((row) => {
    const input = row.querySelector(".product-quantity input");
    const button = row.querySelector(".add-btn");
    if (!input || !button) return;
    const value = Math.max(1, Number(input.value) || 1);
    const disabled = button.disabled && !button.textContent.includes("Out of stock");
    if (!button.textContent.includes("Out of stock")) {
      button.textContent = disabled ? `+ Add ${value} to order` : `+ Add ${value} to order`;
    }
  });
}

document.addEventListener("input", (event) => {
  if (event.target.closest(".product-quantity")) syncQuantityLabels();
});

document.addEventListener("click", (event) => {
  if (event.target.closest(".product-quantity") || event.target.closest(".add-btn")) {
    window.setTimeout(syncQuantityLabels, 0);
  }
});

window.setTimeout(syncQuantityLabels, 0);
