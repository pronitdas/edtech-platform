document.addEventListener("DOMContentLoaded", () => {
  const uploadContainer = document.getElementById("uploadContainer");
  const uploadArea = document.getElementById("uploadArea");
  const fileInput = document.getElementById("fileInput");
  const browseButton = document.getElementById("browseButton");
  const fileOptions = document.getElementById("fileOptions");
  const extractTextButton = document.getElementById("extractTextButton");
  const embedButton = document.getElementById("embedButton");
  const extractTextOptions = document.getElementById("extractTextOptions");
  const blackBoardButton = document.getElementById("blackBoardButton");
  const createAvatarButton = document.getElementById("createAvatarButton");
  const exerciseButton = document.getElementById("exerciseButton");
  const backButton = document.getElementById("backButton");
  const blackBoard = document.getElementById("blackBoard");
  const blackScreen = document.getElementById("blackScreen");
  const backButtonFromblackboard = document.getElementById(
    "backButtonFromblackboard"
  );

  browseButton.addEventListener("click", () => {
    fileInput.click();
  });

  fileInput.addEventListener("change", (event) => {
    handleFileUpload(event.target.files);
  });

  uploadArea.addEventListener("dragover", (event) => {
    event.preventDefault();
    uploadArea.classList.add("dragover");
  });

  uploadArea.addEventListener("dragleave", () => {
    uploadArea.classList.remove("dragover");
  });

  uploadArea.addEventListener("drop", (event) => {
    event.preventDefault();
    uploadArea.classList.remove("dragover");
    handleFileUpload(event.dataTransfer.files);
  });

  async function handleFileUpload(files) {
    uploadedFile = files[0];
    uploadContainer.classList.add("hidden");
    fileOptions.classList.remove("hidden");
    const file = files[0];
    if (file) {
      if (file.type === "text/plain") {
        uploadedFileType = "plainText";
        handleTextFile(file);
      } else if (file.type === "application/pdf") {
        uploadedFileType = "pdf";
        await handlePdfFile(file);
      } else if (
        file.type === "application/vnd.ms-powerpoint" ||
        file.type ===
          "application/vnd.openxmlformats-officedocument.presentationml.presentation"
      ) {
        uploadedFileType = "ppt";
        handlePptFile(file);
      } else if (
        file.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        uploadedFileType = "doc";
        await handleDocxFile(file);
      } else if (file.type === "video/mp4") {
        uploadedFileType = "video";
        // handleVideoFile(file);
        loadVideo(file);
      } else {
        alert(
          "Unsupported file type. Please upload a text file (.txt), a PDF file (.pdf), a DOCX file (.docx), a PowerPoint file (.ppt, .pptx), or a video file (.mp4)."
        );
      }
    }
  }
  async function loadVideo(file) {
    let videoURL = URL.createObjectURL(file);
    let videoElement = document.createElement("video");

    let canvas = document.createElement("canvas");
    let context = canvas.getContext("2d");
    videoElement.src = videoURL;
    videoElement.load();

    videoElement.addEventListener("loadedmetadata", () => {
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
    });
    extractText(videoElement, canvas, context);
  }

  async function extractText(videoElement, canvas, context) {
    if (!videoElement.src || videoElement.src === "") {
      alert("Please select a video file first.");
      return;
    }

    context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    let imageData = context.getImageData(0, 0, canvas.width, canvas.height);

    Tesseract.recognize(
      imageData,
      "eng",
      { logger: (m) => console.log(m) } // Optional logger callback
    )
      .then(({ data: { text } }) => {
        textOutput.textContent = text;
      })
      .catch((error) => {
        console.error("Error during OCR:", error);
        textOutput.textContent = "Error extracting text.";
      });
  }
  function handleTextFile(file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      paragraphs = e.target.result.split("\n").filter((p) => p.trim() !== "");
      console.log(paragraphs);
    };
    reader.readAsText(file);
  }

  async function handlePdfFile(file) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    paragraphs = [];

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const textItems = textContent.items.map((item) => item.str);
      const pageText = textItems.join(" ").trim();
      paragraphs.push(pageText);
    }

    console.log(paragraphs);
  }

  async function handleDocxFile(file) {
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    mammoth
      .extractRawText({ arrayBuffer: uint8Array })
      .then(function (result) {
        paragraphs = result.value.split("\n").filter((p) => p.trim() !== "");
        console.log(paragraphs);
      })
      .catch(function (err) {
        console.log(err);
        alert("Error handling DOCX file.");
      });
  }

  async function handlePptFile(file) {
    const arrayBuffer = await file.arrayBuffer();
    const zip = new JSZip();
    const ppt = await zip.loadAsync(arrayBuffer);

    const slideFiles = Object.keys(ppt.files).filter(
      (filename) =>
        filename.startsWith("ppt/slides/slide") && filename.endsWith(".xml")
    );

    slideFiles.sort((a, b) => {
      const numA = parseInt(a.match(/slide(\d+)/)[1]);
      const numB = parseInt(b.match(/slide(\d+)/)[1]);
      return numA - numB;
    });

    paragraphs = [];

    for (const slideFile of slideFiles) {
      const slideXml = await ppt.files[slideFile].async("text");
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(slideXml, "application/xml");
      const texts = Array.from(xmlDoc.getElementsByTagName("a:t")).map(
        (node) => node.textContent
      );
      paragraphs.push(...texts);
    }
    console.log(paragraphs);
  }
});
