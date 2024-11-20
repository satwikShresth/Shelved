function openModal() {
  const modal = document.getElementById("newShelfModal");
  modal.style.display = "flex";
}

function closeModal() {
  const modal = document.getElementById("newShelfModal");
  modal.style.display = "none";
}

document
  .getElementById("newShelfForm")
  .addEventListener("submit", async (event) => {
    event.preventDefault();
    const shelfName = document.getElementById("shelfName").value;
    const visibility = document.getElementById("visibility").value;

    const response = await fetch("/p/api/shelf/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shelfName, visibility }),
    });

    if (response.ok) {
      alert("Shelf created successfully!");
      closeModal();
      location.reload();
    } else {
      console.error(response.json());
      alert("Failed to create shelf.");
    }
  });
