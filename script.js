const dropArea = document.getElementById("drop-area");
const fileInput = document.getElementById("fileInput");
const previewBox = document.getElementById("preview-box");

const compressBtn = document.getElementById("compressBtn");
const widthInput = document.getElementById("widthInput");
const heightInput = document.getElementById("heightInput");
const formatSelect = document.getElementById("formatSelect");
const qualitySlider = document.getElementById("qualitySlider");
const qualityValue = document.getElementById("qualityValue");

const clearBtn = document.getElementById("clearBtn");

// Modal
const modal = document.getElementById("imageModal");
const modalImg = document.getElementById("modalImage");
const modalCaption = document.getElementById("modalCaption");
const closeModal = document.querySelector(".close");

// Open file picker
dropArea.addEventListener("click", () => fileInput.click());

// Allow same file reupload
fileInput.addEventListener("change", (e) => {
  handleFiles(e.target.files);
  fileInput.value = ""; // ✅ Important to allow same image re-selection
});

// Drag & drop
dropArea.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropArea.style.borderColor = "#333";
});

dropArea.addEventListener("dragleave", () => {
  dropArea.style.borderColor = "#999";
});

dropArea.addEventListener("drop", (e) => {
  e.preventDefault();
  dropArea.style.borderColor = "#999";
  handleFiles(e.dataTransfer.files);
});

function handleFiles(files) {
  const fileArray = Array.from(files);

  fileArray.forEach((file) => {
    if (!file.type.startsWith("image/")) return;

    const exists = Array.from(previewBox.querySelectorAll("img")).some(
      img => img.dataset.name === file.name && img.dataset.size == file.size
    );
    if (exists) return;

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.src = reader.result;
      img.dataset.name = file.name;
      img.dataset.size = file.size;

      img.onload = () => {
        img.setAttribute("data-width", img.naturalWidth);
        img.setAttribute("data-height", img.naturalHeight);
        previewBox.appendChild(img);

        const total = previewBox.querySelectorAll("img").length;
        if (total === 1) {
          widthInput.value = img.naturalWidth;
          heightInput.value = img.naturalHeight;
        } else {
          widthInput.value = "";
          heightInput.value = "";
        }
      };
    };
    reader.readAsDataURL(file);
  });
}

qualitySlider.addEventListener("input", () => {
  qualityValue.textContent = qualitySlider.value;
});

// COMPRESSION & DOWNLOAD
compressBtn.addEventListener("click", () => {
  const images = previewBox.querySelectorAll("img");
  if (images.length === 0) return;

  const zip = new JSZip();
  let completed = 0;

  images.forEach((img, index) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const tempImage = new Image();
    tempImage.crossOrigin = "anonymous";

    tempImage.onload = () => {
      const width = parseInt(widthInput.value) || tempImage.naturalWidth;
      const height = parseInt(heightInput.value) || tempImage.naturalHeight;

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(tempImage, 0, 0, width, height);

      canvas.toBlob((blob) => {
        const ext = getExtFromType(formatSelect.value);
        const fileName = `compressed-${index + 1}.${ext}`;

        if (images.length === 1) {
          // Single image = direct download
          const a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = fileName;
          a.click();
        } else {
          // Multiple = add to zip
          zip.file(fileName, blob);
          completed++;

          // Wait for all images to be added
          if (completed === images.length) {
            zip.generateAsync({ type: "blob" }).then((zipBlob) => {
              const link = document.createElement("a");
              link.href = URL.createObjectURL(zipBlob);
              link.download = "compressed-images.zip";
              link.click();
            });
          }
        }
      }, formatSelect.value, parseFloat(qualitySlider.value));
    };

    tempImage.src = img.src;
  });
});


function getExtFromType(mimeType) {
  switch (mimeType) {
    case "image/jpeg": return "jpg";
    case "image/png": return "png";
    case "image/webp": return "webp";
    default: return "img";
  }
}

// Clear All
clearBtn.addEventListener("click", () => {
  previewBox.innerHTML = "";
  widthInput.value = "";
  heightInput.value = "";
});

// Modal Preview
previewBox.addEventListener("click", (e) => {
  if (e.target.tagName === "IMG") {
    modal.style.display = "block";
    modalImg.src = e.target.src;
    modalCaption.textContent = `Resolution: ${e.target.dataset.width} x ${e.target.dataset.height}`;
  }
});

closeModal.onclick = () => (modal.style.display = "none");
window.onclick = (e) => {
  if (e.target === modal) modal.style.display = "none";
};
