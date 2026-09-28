document.addEventListener("DOMContentLoaded", () => {
  const search = document.getElementById("moduleSearch");
  const cards = [...document.querySelectorAll(".module-card")];

  if (search) {
    search.addEventListener("input", () => {
      const term = search.value.toLowerCase().trim();
      cards.forEach(card => {
        card.style.display = card.textContent.toLowerCase().includes(term) ? "flex" : "none";
      });
    });
  }
});
