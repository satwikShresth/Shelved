let selectedContentId = null;
let selectedSource = null;
let selectedMediaType = null;

function showShelfModal(contentId, source, media_type) {
  selectedContentId = contentId;
  selectedSource = source;
  selectedMediaType = media_type;
  document.getElementById("shelfModal").style.display = "flex";
}

function closeShelfModal() {
  selectedContentId = null;
  selectedSource = null;
  selectedMediaType = null;
  document.getElementById("shelfModal").style.display = "none";
}

async function addToShelf(external_id, source, shelf, content_type) {
  try {
    const response = await fetch("/p/api/shelf/content/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ external_id, source, shelf, content_type }),
    });

    if (response.ok) {
      alert("Added to shelf successfully!");
      closeShelfModal();
    } else {
      const result = await response.json();
      alert("Failed to add to shelf: " + result.message);
    }
  } catch (error) {
    console.error("Error adding to shelf:", error);
    alert("An error occurred while adding to shelf.");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  closeShelfModal();
});
