document.addEventListener("DOMContentLoaded", () => {
  let currentParagraphIndex = 0;
  let previousParaEnd = 0;
  let addedParas = "";
  var synth = window.speechSynthesis;
  var utterance = new SpeechSynthesisUtterance();
  document.getElementById("nextButton").addEventListener("click", showNext);
  document
    .getElementById("prevButton")
    .addEventListener("click", showPreviousParagraph);
  document.getElementById("readAloud").addEventListener("click", readText);
  document
    .getElementById("readAloudPause")
    .addEventListener("click", pauseSpeech);
  document
    .getElementById("readAloudResume")
    .addEventListener("click", resumeSpeech);
  function showNext() {
    if (currentParagraphIndex < paragraphs.length - 1) {
      currentParagraphIndex++;
      updateBlackboard();
    }
  }

  function showPreviousParagraph() {
    if (currentParagraphIndex > 0) {
      currentParagraphIndex--;
      updateBlackboard();
    }
  }

  function updateBlackboard() {
    const textContainer = document.getElementById("blackBoard-data");
    textContainer.innerHTML = "";

    const availableHeight = textContainer.clientHeight;
    const lineHeight = parseFloat(getComputedStyle(textContainer).lineHeight);
    const paragraphHeight = lineHeight * 1.4; // assuming a paragraph consists of more than one line
    const maxParagraphs = Math.floor(availableHeight / paragraphHeight);

    const start = Math.max(0, currentParagraphIndex - maxParagraphs + 1);
    const end = Math.min(currentParagraphIndex + 1, paragraphs.length);
    previousParaEnd = end;
    addedParas = "";
    for (let i = start; i < end; i++) {
      addedParas += paragraphs[i];
      const paragraph = document.createElement("p");
      paragraph.textContent = paragraphs[i];
      textContainer.appendChild(paragraph);
    }
  }

  function readText() {
    var text = addedParas;
    if (synth.speaking) {
      synth.cancel();
    }
    utterance.text = text;
    synth.speak(utterance);
  }

  function pauseSpeech() {
    if (synth.speaking && !synth.paused) {
      synth.pause();
    }
  }

  function resumeSpeech() {
    if (synth.paused) {
      synth.resume();
    }
  }
});
