const modal = document.getElementById("image-modal");
const modalImage = document.getElementById("modal-image");
const closeButton = document.querySelector(".close-button");

function openModal(src) {
  modal.style.display = "flex";
  modalImage.src = src;
}

function closeModal() {
  modal.style.display = "none";
  modalImage.src = "";
}

closeButton.addEventListener("click", closeModal);

modal.addEventListener("click", function (event) {
  if (event.target === modal) {
    closeModal();
  }
});

const images = document.querySelectorAll(".clickable-image");
images.forEach(function (image) {
  image.addEventListener("click", function () {
    openModal(this.src);
  });
});
