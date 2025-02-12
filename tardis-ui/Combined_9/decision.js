document.addEventListener("DOMContentLoaded", () => {
  let previousScreen = "";
  let notes = "";
  let summary = "";
  let paraBackup = "";

  let includeOptionsImgs = false;
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
  const extractTextButtons = document.getElementById("extract-text-buttons");
  const videoControl = document.getElementById("video-control");
  const exerciseBoard = document.getElementById("exerciseBoard");
  const qnaContainer = document.querySelector(".qna-container");
  const resultsSection = document.getElementById("qna-results");
  const summaryButton = document.getElementById("summaryButton");
  const notesButton = document.getElementById("notesButton");

  const exerciseOptionBackButton = document.getElementById(
    "exerciseOptionBackButton"
  );
  const exerciseButtonOptionButtons = document.getElementById(
    "exerciseButtonOptionButtons"
  );
  const exerciseButtonMCQ = document.getElementById("exerciseButtonMCQ");
  const exerciseButtonMCQOptions = document.getElementById(
    "exerciseButtonMCQOptions"
  );
  const exerciseButtonDiscriptive = document.getElementById(
    "exerciseButtonDiscriptive"
  );
  const backButtonExtractText = document.getElementById(
    "backButtonExtractText"
  );
  const blackBoard = document.getElementById("blackBoard");
  const blackBoardData = document.getElementById("blackBoard-data");
  const backButtonFileOptions = document.getElementById(
    "backButtonFileOptions"
  );

  const backButtonFromblackboard = document.getElementById(
    "backButtonFromblackboard"
  );

  const backButtonFromexerciseBoard = document.getElementById(
    "backButtonFromexerciseBoard"
  );

  notesButton.addEventListener("click", async () => {
    showLoader();
    let prompt = `Create detailed notes from the following text. Your notes should include:
  - Key points and main ideas
  - Additional important details
  - Examples if applicable
  - Subheadings for different sections

  The text to summarize is as follows: `;
    let notes = await fetchDataFromOpenAI(paragraphs?.join(", "), prompt);
    console.log(notes);
    generatePDFFromText(notes);
    blackBoard.classList.remove("hidden");
    extractTextOptions.classList.add("hidden");
    previousScreen = "extractText";
    hideLoader();
  });
  summaryButton.addEventListener("click", async () => {
    showLoader();
    let prompt = "Summarize the following text into concise points";
    let notes = await fetchDataFromOpenAI(paragraphs?.join(", "), prompt);
    console.log(notes);
    generatePDFFromText(notes);
    blackBoard.classList.remove("hidden");
    extractTextOptions.classList.add("hidden");
    previousScreen = "extractText";
    hideLoader();
  });
  exerciseOptionBackButton.addEventListener("click", () => {
    extractTextOptions.classList.remove("hidden");
    // exerciseBoard.classList.remove("hidden");
    exerciseButtonOptionButtons.classList.add("hidden");
  });
  backButtonFileOptions.addEventListener("click", () => {
    fileOptions.classList.add("hidden");
    uploadContainer.classList.remove("hidden");
  });

  exerciseButtonDiscriptive.addEventListener("click", () => {
    exerciseBoard.classList.remove("hidden");
    exerciseButtonOptionButtons.classList.add("hidden");
    discriptiveQuestion();
    previousScreen = "exerciseOptions";
    console.log(questions);
  });
  exerciseButtonMCQ.addEventListener("click", async () => {
    exerciseBoard.classList.remove("hidden");
    exerciseButtonOptionButtons.classList.add("hidden");
    await mcqQuestion();
    console.log(questions);
  });
  exerciseButtonMCQOptions.addEventListener("click", async () => {
    exerciseBoard.classList.remove("hidden");
    exerciseButtonOptionButtons.classList.add("hidden");
    includeOptionsImgs = true;
    await mcqQuestion();
    console.log(questions);
  });

  extractTextButton.addEventListener("click", () => {
    fileOptions.classList.add("hidden");
    extractTextOptions.classList.remove("hidden");
    extractTextBottonClickHandler();
    previousScreen = "fileOptions";
  });

  embedButton.addEventListener("click", () => {
    fileOptions.classList.add("hidden");
    blackBoard.classList.remove("hidden");
    blackBoardData.classList.remove("hidden");
    previousScreen = "fileOptions";
    embedFile(uploadedFile);
  });

  function extractTextBottonClickHandler() {
    if (uploadedFile) {
      if (uploadedFile.type === "text/plain") {
      } else if (uploadedFile.type === "application/pdf") {
      } else if (
        uploadedFile.type === "application/vnd.ms-powerpoint" ||
        uploadedFile.type ===
        "application/vnd.openxmlformats-officedocument.presentationml.presentation"
      ) {
      } else if (
        uploadedFile.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
      } else if (uploadedFile.type === "video/mp4") {
      }
    }
  }
  function embedFile(file) {
    let embedHTML = "";

    const reader = new FileReader();
    reader.onload = () => {
      const fileURL = URL.createObjectURL(file);

      if (file.type.startsWith("image/")) {
        embedHTML = `<img src="${fileURL}" alt="${file.name}" style="max-width: 100%;">`;
      } else if (file.type.startsWith("video/")) {
        videoControl?.classList?.toggle("hidden");
        embedHTML = `<video id="embeded-video-on-blackboard" controls style="max-width: 100%;"><source src="${fileURL}" type="${file.type}"></video>`;
      } else if (file.type.startsWith("audio/")) {
        embedHTML = `<audio controls><source src="${fileURL}" type="${file.type}"></audio>`;
      } else if (
        file.type ===
        "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
        file.type === "application/vnd.ms-powerpoint"
      ) {
        // Use a placeholder URL for demonstration purposes
        const placeholderURL =
          "https://example.com/path/to/your/uploaded/presentation.pptx";
        embedHTML = `<iframe src="https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(
          placeholderURL
        )}" frameborder="0" style="width:100%; height:600px;"></iframe>`;
      } else {
        embedHTML = `<a href="${fileURL}" target="_blank">${file.name}</a>`;
      }

      blackBoardData.innerHTML = embedHTML;
    };
    reader.readAsDataURL(file);
  }

  blackBoardButton.addEventListener("click", () => {
    extractTextOptions.classList.add("hidden");
    // blackScreen.classList.remove("hidden");
    extractTextButtons.classList.remove("hidden");
    blackBoard.classList.remove("hidden");
    blackBoardData.classList.remove("hidden");
    previousScreen = "extractText";
  });

  createAvatarButton.addEventListener("click", () => {
    extractTextOptions.classList.add("hidden");
    blackBoard.classList.remove("hidden");
    previousScreen = "extractText";
  });

  exerciseButton.addEventListener("click", async () => {
    extractTextOptions.classList.add("hidden");
    // exerciseBoard.classList.remove("hidden");
    exerciseButtonOptionButtons.classList.remove("hidden");
    // discriptiveQuestion();
    // mcqQuestion();
    // console.log(questions);
    previousScreen = "extractText";
  });

  backButtonExtractText.addEventListener("click", () => {
    extractTextOptions.classList.add("hidden");
    fileOptions.classList.remove("hidden");
  });
  backButtonFromexerciseBoard.addEventListener("click", () => {
    blackBoard.classList.add("hidden");
    blackBoardData.innerHTML = "";
    exerciseBoard.classList.add("hidden");
    qnaContainer.innerHTML = "";
    resultsSection.innerHTML = "";
    if (previousScreen === "fileOptions")
      fileOptions.classList.remove("hidden");
    else if (previousScreen === "extractText") {
      extractTextOptions.classList.remove("hidden");
    } else if (previousScreen === "exerciseOptions") {
      exerciseButtonOptionButtons.classList.remove("hidden");
    }
    extractTextButtons.classList.add("hidden");
    videoControl.classList.add("hidden");
  });
  backButtonFromblackboard.addEventListener("click", () => {
    blackBoard.classList.add("hidden");
    blackBoardData.innerHTML = "";
    exerciseBoard.classList.add("hidden");
    qnaContainer.innerHTML = "";
    resultsSection.innerHTML = "";
    if (previousScreen === "fileOptions")
      fileOptions.classList.remove("hidden");
    else if (previousScreen === "extractText") {
      extractTextOptions.classList.remove("hidden");
    } else if (previousScreen === "exerciseOptions") {
      exerciseButtonOptionButtons.classList.remove("hidden");
    }
    extractTextButtons.classList.add("hidden");
    videoControl.classList.add("hidden");
  });
  const mcqQuestion = async () => {
    questions = await generateMCQQuestions(paragraphs?.join(" "));
    console.log(questions);
    placeGeneratedMCQQuestions();
  };
  const evaluateMCQAnswers = (answerBox, correctAnswer) => {
    const answer = answerBox.innerText.trim();
    if (answer === correctAnswer) {
      answerBox.classList.add("correct");
      answerBox.classList.remove("wrong");
    } else {
      answerBox.classList.add("wrong");
      answerBox.classList.remove("correct");
    }
  };
  const showLoader = () => {
    document.getElementById("loader").classList.remove("hidden");
  };

  const hideLoader = () => {
    document.getElementById("loader").classList.add("hidden");
  };
  const placeGeneratedMCQQuestions = async () => {
    showLoader();

    for (const [index, q] of questions.entries()) {
      const qnaItem = document.createElement("div");
      qnaItem.classList.add("qna-item");

      const questionText = document.createElement("p");
      questionText.classList.add("question-text");
      questionText.innerText = q.question;
      qnaItem.appendChild(questionText);

      const optionsContainer = document.createElement("div");
      optionsContainer.classList.add("options-container");

      for (const [optionIndex, option] of q.options.entries()) {
        const optionContainer = document.createElement("div");
        optionContainer.classList.add("option-container");
        optionContainer.setAttribute("draggable", "true");
        if (includeOptionsImgs) {
          const prompt = `backgound context for image generation : ${q.question}, actual context: ${option}`;
          const optionImage = document.createElement("img");
          optionImage.classList.add("option-image");
          optionImage.src = await generateImageTag(prompt); // Fetch and set the image URL
          optionContainer.appendChild(optionImage);
        }

        const optionText = document.createElement("p");
        optionText.innerText = option;

        optionContainer.appendChild(optionText);
        optionContainer.addEventListener("dragstart", (e) => {
          e.dataTransfer.setData("text/plain", option);
        });

        optionsContainer.appendChild(optionContainer);
      }

      const answerBox = document.createElement("div");
      answerBox.classList.add("answer-box");
      answerBox.addEventListener("dragover", (e) => {
        e.preventDefault();
      });

      answerBox.addEventListener("drop", (e) => {
        e.preventDefault();
        const data = e.dataTransfer.getData("text/plain");
        answerBox.innerText = data;
        evaluateMCQAnswers(answerBox, q.answer);
      });

      qnaItem.appendChild(optionsContainer);
      qnaItem.appendChild(answerBox);
      qnaContainer.appendChild(qnaItem);
    }

    const submitButton = document.createElement("button");
    submitButton.innerText = "Submit";
    submitButton.classList.add("submit-button");
    submitButton.addEventListener("click", () => {
      document.querySelectorAll(".answer-box").forEach((answerBox, index) => {
        evaluateMCQAnswers(answerBox, questions[index].answer);
      });
    });
    qnaContainer.appendChild(submitButton);
    hideLoader();
  };

  const discriptiveQuestion = async () => {
    questions = await generateQuestions(paragraphs?.join(" "));
    placeGeneratedDiscriptiveQuestions();
  };
  const placeGeneratedDiscriptiveQuestions = () => {
    showLoader();
    questions.forEach((q, index) => {
      const qnaItem = document.createElement("div");
      qnaItem.classList.add("qna-item");

      const label = document.createElement("label");
      label.innerText = q;
      label.setAttribute("for", `answer-${index}`);

      const input = document.createElement("input");
      input.setAttribute("type", "text");
      input.setAttribute("id", `answer-${index}`);
      input.classList.add("qna-input");

      qnaItem.appendChild(label);
      qnaItem.appendChild(input);
      qnaContainer.appendChild(qnaItem);
    });
    const submitButton = document.createElement("button");
    submitButton.innerText = "Submit";
    submitButton.classList.add("submit-button");
    submitButton.addEventListener("click", evaluateAnswers);
    qnaContainer.appendChild(submitButton);
    hideLoader();
  };
  async function generateQuestions(text) {
    showLoader();
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant.",
          },
          {
            role: "user",
            content: `Generate 2 random questions based on the following content:\n\n${text}\n\n`,
          },
        ],
        max_tokens: 200,
        temperature: 0.7,
        n: 1,
        stop: ["11."],
      }),
    });
    const data = await response.json();
    const choices = data.choices[0]; // Get the first choice object
    const message = choices.message.content;

    // Extract the JSON objects from the content string
    const questionMatches = message.match(/^\d+\.\s*(.*?)$/gm);
    let questions = [];

    if (questionMatches) {
      questionMatches.forEach((match) => {
        try {
          questions.push(match);
        } catch (e) {
          console.error("Failed to parse JSON response: ", e);
        }
      });
    }
    hideLoader();
    return questions;
  }

  async function evaluateAnswers() {
    showLoader();
    const openaiApiKey = "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";
    const questionsSection = document.getElementById("qna-container");
    const questionDivs = questionsSection.querySelectorAll(".qna-item");
    const answers = [];

    questionDivs.forEach((div, index) => {
      const input = div.querySelector("input");
      const answer = input.value.trim();
      if (answer) {
        answers.push({
          question: div.querySelector("label").textContent,
          answer: answer,
        });
      }
    });

    const evaluations = await Promise.all(
      answers.map(async (item) => {
        const response = await fetch(
          "https://api.openai.com/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${openaiApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "gpt-3.5-turbo",
              messages: [
                {
                  role: "system",
                  content: "You are a helpful assistant.",
                },
                {
                  role: "user",
                  content: `Evaluate the following answer and provide feedback and a score between 1 and 10:\n\nQuestion: ${item.question}\n\nAnswer: ${item.answer}\n\nFeedback and score:`,
                },
              ],
              max_tokens: 150,
              temperature: 0.7,
              n: 1,
              stop: ["\n\n"],
            }),
          }
        );
        const data = await response.json();
        const feedback = data.choices?.[0].message.content.trim();
        const score = parseInt(feedback.match(/\d+/)?.[0]) || 0;
        return { ...item, feedback, score };
      })
    );
    displayEvaluations(evaluations);
    hideLoader();
  }

  function displayEvaluations(evaluations) {
    resultsSection.innerHTML = "";
    evaluations.forEach((evaluation) => {
      const evaluationText = `
    Question: ${evaluation.question}<br/>
    Answer: ${evaluation.answer}<br/>
    Feedback: ${evaluation.feedback}<br/>
    Score: ${evaluation.score}/10<br/><br/>
    `;
      resultsSection.innerHTML += evaluationText + "\n\n";
    });
  }

  async function generateMCQQuestions(text) {
    showLoader();
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant.",
          },
          {
            role: "user",
            content: `Generate 2 random multiple-choice questions based on the following content in this format [{"question":"something", "options": [], "answer":"answer"}] and just give the array nothing else :\n\n${text}\n\n`,
          },
        ],
        max_tokens: 300,
        temperature: 0.7,
        n: 1,
        stop: null,
      }),
    });
    const data = await response.json();
    const questionsText = data.choices[0].message.content.trim();
    let questions;
    try {
      questions = JSON.parse(questionsText);
    } catch (e) {
      console.error("Failed to parse JSON response: ", e);
      questions = [];
    }
    hideLoader();
    return questions;
  }

  async function generateImageTag(prompt) {
    try {
      const response = await fetch(
        "https://api.openai.com/v1/images/generations",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openaiApiKey}`,
          },
          body: JSON.stringify({
            prompt: prompt,
            n: 1,
            size: "1024x1024",
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Network response was not ok " + response.statusText);
      }

      const data = await response.json();
      const imageUrl = data.data[0].url;
      return imageUrl;
    } catch (error) {
      console.error("Error:", error);
      return "https://res.klook.com/images/fl_lossy.progressive,q_65/c_fill,w_1200,h_630/w_80,x_15,y_15,g_south_west,l_Klook_water_br_trans_yhcmh3/activities/tsah7c9evnal289z5fig/IMG%20Worlds%20of%20Adventure%20Admission%20Ticket%20in%20Dubai%20-%20Klook.jpg"; // Placeholder image
    }
  }
  async function fetchDataFromOpenAI(text, prompt) {
    try {
      // Define the prompt for the OpenAI API
      const finalPrompt = `${prompt}:\n\n${text}`;

      // API call to OpenAI
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${openaiApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [
              {
                role: "system",
                content: "You are a notes making assistant.",
              },
              {
                role: "user",
                content: finalPrompt,
              },
            ],
            max_tokens: 150, // Adjust based on how detailed you want the notes
            temperature: 0.7,
            n: 1,
            stop: ["\n\n"],
          }),
        }
      );

      // Parse the response
      const data = await response.json();

      // Extract and return the notes from the response
      return data.choices[0].message.content.trim();
    } catch (error) {
      console.log(error);
    }

  }

  // Event Listeners for Notes and Summary Buttons
  document.getElementById("notesButton").addEventListener("click", async () => {
    displayOnBlackboard("notes");
  });

  document.getElementById("summaryButton").addEventListener("click", async () => {
    displayOnBlackboard("summary");
  });

  // Function to Fetch Notes or Summary from OpenAI and Display on Blackboard
  async function displayOnBlackboard(type) {
    const blackBoardData = document.getElementById("blackBoard-data");
    const apiKey = 'sk-proj-2LmStIR0BgFypBrWpQKkT3BlbkFJY2pA9aaOXtAsf1HGjkSH'; // Ensure your API key is stored in `globalVariables.js`
    const content = type === "notes" ? "Create detailed notes." : "Create a concise summary.";

    try {
      // Extract text from uploaded file
      const text = paragraphs.join("\n");

      // Fetch from OpenAI
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4",
          messages: [
            { role: "system", content: "You are a helpful assistant." },
            { role: "user", content: `${content}\n\nText: ${text}` }
          ],
        }),
      });

      const data = await response.json();
      const resultText = data.choices[0]?.message?.content || "No response.";

      // Display the result on the blackboard
      blackBoardData.innerHTML = `<p>${resultText}</p>`;
      blackBoardData.style.fontFamily = "sans-serif";
      blackBoardData.style.color = "white";
      document.getElementById("blackBoard").classList.remove("hidden");
    } catch (error) {
      console.error("Error fetching data:", error);
      alert(`Failed to fetch ${type}. Please try again.`);
    }
  }


  async function generatePDFFromText(detailedNotes) {
    // Initialize jsPDF
    var doc = new jsPDF();

    // Hardcoded HTML content
    var htmlContent = `
          <html>
          <head>
              <style>
                  body {
                      font-family: Arial, sans-serif;
                  }
                  h1 {
                      color: #333;
                  }
                  p {
                      color: #666;
                  }
              </style>
          </head>
          <body>
              <p>${detailedNotes}</p>
          </body>
          </html>
      `;

    // Specify the position (10, 10) and size (width: 190, height: 280) of the PDF
    // Adjust these values according to your content
    doc.fromHTML(htmlContent, 10, 10, {
      width: 190,
    });

    // Save the PDF
    doc.save("generated.pdf");
  }
});
