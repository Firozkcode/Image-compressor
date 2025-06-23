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


// Modal Elements
const modal = document.getElementById("imageModal");
const modalImg = document.getElementById("modalImage");
const modalCaption = document.getElementById("modalCaption");
const closeModal = document.querySelector(".close");


const btnText = document.querySelector("#compressBtn .btn-text");
const btnSpinner = document.querySelector("#compressBtn .btn-spinner");

let aspectRatioLocked = false;
let originalAspectRatio = null;

const lockAspectRatioCheckbox = document.getElementById("lockAspectRatio");

lockAspectRatioCheckbox.addEventListener("change", () => {
  aspectRatioLocked = lockAspectRatioCheckbox.checked;

  const firstImg = previewBox.querySelector("div > img");
  if (aspectRatioLocked && firstImg) {
    originalAspectRatio = firstImg.naturalWidth / firstImg.naturalHeight;
  }
});



function clearFile(){
  // Clear file input and preview box
  fileInput.value = "";
  previewBox.innerHTML = "";
  dropArea.style.borderColor = "#999";
  dropArea.textContent = "Drop files here or click to select";
  widthInput.value = "";
  heightInput.value = ""; 
}

clearFile()

function showSpinner() {
  spinner.hidden = false;
}


widthInput.addEventListener("input", () => {
  if (aspectRatioLocked && originalAspectRatio) {
    heightInput.value = Math.round(parseInt(widthInput.value) / originalAspectRatio);
  }
});

heightInput.addEventListener("input", () => {
  if (aspectRatioLocked && originalAspectRatio) {
    widthInput.value = Math.round(parseInt(heightInput.value) * originalAspectRatio);
  }
});



// Click to open file picker
dropArea.addEventListener("click", () => fileInput.click());

// Handle file input selection
fileInput.addEventListener("change", (e) => {
  handleFiles(e.target.files);
});

// Handle drag over and drop
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

    // Check if already exists in preview
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

            // 🆕 Add remove button
            const wrapper = document.createElement("div");
            wrapper.style.position = "relative";
            wrapper.style.display = "inline-block";

            const removeBtn = document.createElement("span");
            removeBtn.textContent = "×";
            removeBtn.style.position = "absolute";
            removeBtn.style.top = "0";
            removeBtn.style.right = "0px";
            removeBtn.style.color = "white";
            removeBtn.style.background = "red";
            removeBtn.style.padding = "0 6px";
            removeBtn.style.cursor = "pointer";
            removeBtn.style.borderRadius = "0 10px 0 5px";
            removeBtn.style.fontWeight = "bold";
            removeBtn.style.userSelect = "none";

            removeBtn.onclick = () => {
                wrapper.remove();

                const remainingImages = previewBox.querySelectorAll("div > img").length;
                if (remainingImages === 1) {
                    const img = previewBox.querySelector("div > img");
                    widthInput.value = img.dataset.width;
                    heightInput.value = img.dataset.height;
                } else {
                    widthInput.value = "";
                    heightInput.value = "";
                }
            };


            wrapper.appendChild(img);
            wrapper.appendChild(removeBtn);
            previewBox.appendChild(wrapper);


            // Autofill width/height if only 1 image present
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
  qualityValue.textContent = `${qualitySlider.value*100}%`;
});

compressBtn.addEventListener("click", () => {
  const images = Array.from(previewBox.querySelectorAll("div > img"));

if (images.length === 0) {
  notificationMessage("error", "Please upload at least one image before compressing.");
  return;
}
  const format = formatSelect.value;
  const quality = parseFloat(qualitySlider.value);
  const width = parseInt(widthInput.value);
  const height = parseInt(heightInput.value);

  const tasks = [];

  images.forEach((img, index) => {
    tasks.push(new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      const finalWidth = width || img.naturalWidth;
      const finalHeight = height || img.naturalHeight;

      canvas.width = finalWidth;
      canvas.height = finalHeight;
      ctx.drawImage(img, 0, 0, finalWidth, finalHeight);

      canvas.toBlob((blob) => {
        if (!blob) {
          console.error("Compression failed for image", index);
          resolve();
          return;
        }

        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `compressed-${index + 1}.${getExtFromType(format)}`;
        a.click();
        resolve();
      }, format, quality);

      // Fallback to avoid hanging
      setTimeout(resolve, 3000);
    }));
    clearFile()
  });

  if (tasks.length === 0) {
    notificationMessage("error", "No valid images to compress.");
    return;
  }

  // ✅ Trigger compression only after confirming tasks exist
  notificationMessage("processing", "Compressing and downloading your image(s)...");

  btnText.textContent = "Compressing...";
  btnSpinner.hidden = false;
  compressBtn.disabled = true;

  Promise.all(tasks).then(() => {
    btnText.textContent = "Compress & Download";
    btnSpinner.hidden = true;
    compressBtn.disabled = false;
    notificationMessage("success", "Image(s) compressed and downloaded successfully!");
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

// Clear button functionality
clearBtn.addEventListener("click", () => {
  previewBox.innerHTML = "";
  widthInput.value = "";
  heightInput.value = "";
});









// Click any preview image to open modal
previewBox.addEventListener("click", (e) => {
  if (e.target.tagName === "IMG") {
    modal.style.display = "block";
    modalImg.src = e.target.src;

    const width = e.target.getAttribute("data-width");
    const height = e.target.getAttribute("data-height");
    modalCaption.textContent = `Resolution: ${width} x ${height}`;
  }
});

// Close modal
closeModal.onclick = () => {
  modal.style.display = "none";
};

window.onclick = (e) => {
  if (e.target === modal) {
    modal.style.display = "none";
  }
};



// Toast notification 
function notificationMessage(type, messageText) {
  const notificationContainer = document.getElementById("notificationContainer");

  // Create the notification element
  const notification = document.createElement("div");
  notification.className = `notification ${type}`; // Add class for styling

  // Add the message
  const message = document.createElement("div");
  message.className = "message";
  message.textContent = messageText;

  // Add a close button
  const closeBtn = document.createElement("button");
  closeBtn.className = "close-btn";
  closeBtn.innerHTML = "&times;";
  closeBtn.addEventListener("click", () => {
      notification.remove();
  });

  // Add the progress bar
  const progressBar = document.createElement("div");
  progressBar.className = "progress-bar";

  // Append elements to the notification
  notification.appendChild(message);
  notification.appendChild(closeBtn);
  notification.appendChild(progressBar);

    // Append the notification to the container
    notificationContainer.appendChild(notification);

    // Remove the notification after 5 seconds
    setTimeout(() => {
        notification.classList.add("slide-out");
        // Wait for the animation to finish (0.4s), then remove
        setTimeout(() => {
            notification.remove();
        }, 400);
    }, 5000);

}

// // Example Usage:
// document.getElementById("notice_text_error").addEventListener("click", () => {
//   notificationMessage("error", "An error occurred. Please try again.");
// });

// //  Trigger a processing notification
// document.getElementById("notice_text_processing").addEventListener("click", () => {
//   notificationMessage("processing", "Your Request is processing, please wait...");
// });

// // Trigger a success notification (you can call it anywhere)
// document.getElementById("notice_text_success").addEventListener("click", () => {
//   notificationMessage("success", "Completed Successfully!");
// });
