const screens = {
  camera: document.querySelector("#cameraScreen"),
  loading: document.querySelector("#loadingScreen"),
  result: document.querySelector("#resultScreen"),
};

const cameraFeed = document.querySelector("#cameraFeed");
const previewImage = document.querySelector("#previewImage");
const emptyState = document.querySelector("#emptyState");
const startCameraButton = document.querySelector("#startCameraButton");
const captureButton = document.querySelector("#captureButton");
const transformButton = document.querySelector("#transformButton");
const uploadButton = document.querySelector("#uploadButton");
const fileInput = document.querySelector("#fileInput");
const resultCanvas = document.querySelector("#resultCanvas");
const retakeButton = document.querySelector("#retakeButton");
const closeResultButton = document.querySelector("#closeResultButton");
const downloadButton = document.querySelector("#downloadButton");
const shareButton = document.querySelector("#shareButton");

let cameraStream = null;
let selectedImage = null;

const pilotPrompt = [
  "Replace every visible person in the image with a realistic domestic cat.",
  "Preserve the original background, lighting, camera angle, and composition.",
  "Each cat must have natural fur only: no clothes, no accessories, no hats, no glasses.",
  "Map fur color from each person's upper clothing color 80% and hair color 20%,",
  "but keep the result within real natural cat fur colors and markings.",
  "The cat does not need to copy the exact human pose, but must sit or stand naturally",
  "in the original person's location with believable scale, shadows, and perspective.",
].join(" ");

function showScreen(name) {
  Object.values(screens).forEach((screen) => screen.classList.remove("is-active"));
  screens[name].classList.add("is-active");
}

function setImageSource(source) {
  selectedImage = source;
  previewImage.src = source;
  previewImage.hidden = false;
  emptyState.hidden = true;
  transformButton.disabled = false;
}

async function startCamera() {
  if (!navigator.mediaDevices?.getUserMedia) {
    alert("이 브라우저에서는 카메라를 사용할 수 없습니다. 사진 업로드를 사용해주세요.");
    return;
  }

  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "environment",
        width: { ideal: 1440 },
        height: { ideal: 1920 },
      },
      audio: false,
    });

    cameraFeed.srcObject = cameraStream;
    previewImage.hidden = true;
    emptyState.hidden = true;
    startCameraButton.textContent = "켜짐";
  } catch (error) {
    alert("카메라 권한을 확인해주세요. 로컬 서버 또는 HTTPS에서 동작합니다.");
  }
}

function capturePhoto() {
  if (!cameraFeed.srcObject) {
    fileInput.click();
    return;
  }

  const width = cameraFeed.videoWidth || 1080;
  const height = cameraFeed.videoHeight || 1440;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  context.drawImage(cameraFeed, 0, 0, width, height);
  setImageSource(canvas.toDataURL("image/jpeg", 0.92));
}

function loadFile(file) {
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => setImageSource(reader.result);
  reader.readAsDataURL(file);
}

function drawPrototypeResult(source) {
  const image = new Image();
  image.onload = () => {
    const maxWidth = 1440;
    const scale = Math.min(1, maxWidth / image.width);
    const width = Math.round(image.width * scale);
    const height = Math.round(image.height * scale);

    resultCanvas.width = width;
    resultCanvas.height = height;

    const context = resultCanvas.getContext("2d");
    context.drawImage(image, 0, 0, width, height);

    const gradient = context.createLinearGradient(0, height * 0.45, 0, height);
    gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0.62)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);

    context.fillStyle = "rgba(240, 179, 90, 0.92)";
    context.beginPath();
    context.roundRect(width * 0.06, height * 0.07, width * 0.24, 42, 21);
    context.fill();

    context.fillStyle = "#211507";
    context.font = "700 18px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
    context.fillText("ANIMI", width * 0.09, height * 0.07 + 27);

    context.fillStyle = "#f5f2ea";
    context.font = "800 34px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
    context.fillText("AI 변환 API 연결 전", width * 0.07, height - 88);

    context.fillStyle = "rgba(245, 242, 234, 0.78)";
    context.font = "500 20px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
    context.fillText("촬영/업로드/로딩/결과 UX 확인용 프로토타입", width * 0.07, height - 54);
  };
  image.src = source;
}

async function transformImage() {
  if (!selectedImage) return;

  showScreen("loading");

  // API integration point:
  // Send selectedImage and pilotPrompt to an image edit endpoint, then render its returned image.
  console.info("ANIMI pilot prompt:", pilotPrompt);

  await new Promise((resolve) => setTimeout(resolve, 1800));
  drawPrototypeResult(selectedImage);
  showScreen("result");
}

function resetToCamera() {
  showScreen("camera");
}

function downloadResult() {
  const link = document.createElement("a");
  link.download = `animi-result-${Date.now()}.png`;
  link.href = resultCanvas.toDataURL("image/png");
  link.click();
}

async function shareResult() {
  if (!navigator.share) {
    downloadResult();
    return;
  }

  resultCanvas.toBlob(async (blob) => {
    const file = new File([blob], "animi-result.png", { type: "image/png" });
    try {
      await navigator.share({
        title: "ANIMI",
        text: "ANIMI 변환 결과",
        files: [file],
      });
    } catch (error) {
      if (error.name !== "AbortError") downloadResult();
    }
  });
}

startCameraButton.addEventListener("click", startCamera);
captureButton.addEventListener("click", capturePhoto);
transformButton.addEventListener("click", transformImage);
uploadButton.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", (event) => loadFile(event.target.files?.[0]));
retakeButton.addEventListener("click", resetToCamera);
closeResultButton.addEventListener("click", resetToCamera);
downloadButton.addEventListener("click", downloadResult);
shareButton.addEventListener("click", shareResult);
