import React, { useState, useEffect, useCallback, useRef } from "react";
import useAuthState from "@/hooks/useAuth";
import { OpenAIClient } from "@/services/openAi";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Mic, MicOff, Volume2, VolumeX, Send } from "lucide-react";

const VoiceChatbot = ({ topic, language }) => {
  const [userResponse, setUserResponse] = useState("");
  const { oAiKey } = useAuthState();
  const [apiClient, setApiClient] = useState(null);

  const [mentorText, setMentorText] = useState(
    "Hello, I'm AI-Mentor! Let's start your journey. What would you like to know about Physics, Geography, History, or English grammar?"
  );

  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [conversation, setConversation] = useState([]);

  // We'll store our speech queue in a ref so we can cancel chunked TTS if needed
  const speechQueueRef = useRef([]);

  // 1. Load voices when browser finishes populating them
  useEffect(() => {
    const handleVoicesChanged = () => {
      const voices = window.speechSynthesis.getVoices();
      console.log("Available TTS voices:", voices);
    };

    window.speechSynthesis.addEventListener("voiceschanged", handleVoicesChanged);
    handleVoicesChanged(); // Call once immediately

    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", handleVoicesChanged);
    };
  }, [language]);

  // 2. Initialize OpenAI client
  useEffect(() => {
    if (!apiClient && oAiKey) {
      setApiClient(new OpenAIClient(oAiKey));
    }
  }, [oAiKey, apiClient]);

  // =============== TEXT-TO-SPEECH (TTS) HELPERS ===============
  // Sanitize text to remove special characters like asterisks, etc.
  const sanitizeText = (text) => {
    // Remove all asterisks (**) or any other special chars you want:
    return text.replace(/\*/g, "");
  };

  // Speak text in multiple chunks (sentences) so we don’t get cut off
  const speakTextInChunks = useCallback(
    (rawText, langCode) => {
      // If something was already speaking, cancel it
      window.speechSynthesis.cancel();
      speechQueueRef.current = [];

      // 1) Sanitize the text (remove unwanted symbols)
      const sanitized = sanitizeText(rawText);

      // 2) Split by sentence endings (periods, question marks, exclamation) 
      //    followed by whitespace. Feel free to refine as needed.
      const sentences = sanitized.split(/[.?!]\s+/);

      // 3) We'll create a queue of utterances
      sentences.forEach((sentence, idx) => {
        if (!sentence.trim()) return; // skip empty
        // Add back a period at the end for normal pausing
        const chunk = sentence.trim() + ".";
        // Create utterance
        const utterance = new SpeechSynthesisUtterance(chunk);
        utterance.lang = langCode;

        // (Optional) Find a matching voice by `lang` if desired:
        const allVoices = window.speechSynthesis.getVoices();
        const selectedVoice = allVoices.find((voice) =>
          voice.lang.toLowerCase().startsWith(langCode.toLowerCase())
        );
        if (selectedVoice) utterance.voice = selectedVoice;

        // On start, we note that we’re speaking
        utterance.onstart = () => {
          setIsSpeaking(true);
        };

        // When the utterance finishes, 
        // if there's another chunk, TTS will move on to it automatically
        utterance.onend = () => {
          // If this was the last chunk in the queue, set isSpeaking = false
          if (idx === sentences.length - 1) {
            setIsSpeaking(false);
          }
        };

        speechQueueRef.current.push(utterance);
      });
      console.log(speechQueueRef.current)
      // 4) Start speaking each chunk in order
      speechQueueRef.current.forEach((u) => {
        window.speechSynthesis.speak(u);
      });
    },
    []
  );

  // =============== MAIN LOGIC ===============
  const handleNext = useCallback(async () => {
    if (!userResponse.trim()) {
      alert("Please provide your response.");
      return;
    }
    if (!apiClient) {
      alert("OpenAI client not ready. Check your API key.");
      return;
    }

    // Add user message to conversation
    setConversation((prev) => [...prev, { role: "user", content: userResponse }]);

    // Send to ChatGPT (or your chosen model)
    const newMentorText = await apiClient.chatCompletion(
      [
        {
          role: "system",
          content: `Make me understand this topic, answer my doubts, clarify assumptions, don't dump all the information directly, ask me what I want to know, encourage me to ask precise questions, help me drive towards correct path in ${topic} in ${language} in less than 100 words`,
        },
        { role: "user", content: userResponse },
      ],
      "gpt-4-turbo-2024-04-09",
      300
    );

    setMentorText(newMentorText);
    setConversation((prev) => [...prev, { role: "assistant", content: newMentorText }]);
    setUserResponse("");

    // Speak it (in multiple chunks)
    if ("speechSynthesis" in window) {
      // Map your language to a valid BCP-47 code, if needed:
      let langCode = "en-US";
      if (language.toLowerCase().includes("hindi")) langCode = "hi-IN";
      else if (language.toLowerCase().includes("vietnamese")) langCode = "vi-VN";
      else if (language.toLowerCase().includes("bengali")) langCode = "bn-IN"; // or "bn-BD"
      else if (language.toLowerCase().includes("marathi")) langCode = "mr-IN";

      speakTextInChunks(newMentorText, langCode);
    }
  }, [userResponse, apiClient, topic, language, speakTextInChunks]);

  // =============== SPEECH RECOGNITION ===============
  const toggleListening = useCallback(() => {
    if (!isListening) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert("Speech recognition is not supported in your browser.");
        return;
      }
      const recognition = new SpeechRecognition();
      recognition.lang = language; // e.g. "hi-IN" for Hindi if needed
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0].transcript)
          .join("");
        setUserResponse(transcript);
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
      setIsListening(true);
    } else {
      // Ideally, you'd store `recognition` in a ref to stop it:
      // recognition.stop();
      setIsListening(false);
    }
  }, [isListening, language]);

  // =============== TOGGLE SPEAKING (READ mentorText) ===============
  const toggleSpeaking = useCallback(() => {
    if (isSpeaking) {
      // Stop all utterances, including queued ones
      window.speechSynthesis.cancel();
      speechQueueRef.current = [];
      setIsSpeaking(false);
    } else {
      // Same logic as handleNext’s TTS, but we read the current mentorText
      if ("speechSynthesis" in window) {
        let langCode = "en-US";
        if (language.toLowerCase().includes("hindi")) langCode = "hi-IN";
        else if (language.toLowerCase().includes("vietnamese")) langCode = "vi-VN";
        else if (language.toLowerCase().includes("bengali")) langCode = "bn-IN";
        else if (language.toLowerCase().includes("marathi")) langCode = "mr-IN";

        speakTextInChunks(mentorText, langCode);
      }
    }
  }, [isSpeaking, mentorText, language, speakTextInChunks]);

  // =============== RENDER ===============
  return (
    <div className="bg-white rounded-lg shadow-lg p-4 space-y-4">
      <div className="space-y-4 flex flex-col">
        {/* Conversation Display */}
        <div className="bg-yellow-200 p-4 rounded-lg h-[300px] overflow-y-auto">
          {conversation.map((message, index) => (
            <p
              key={index}
              className={`text-sm mb-2 ${
                message.role === "user" ? "text-blue-600" : "text-gray-800"
              }`}
            >
              <strong>{message.role === "user" ? "You: " : "AI-Mentor: "}</strong>
              {message.content}
            </p>
          ))}
        </div>

        {/* User Input / Mic */}
        <div className="flex items-center space-x-2">
          <Textarea
            className="flex-grow p-2 text-black border rounded-md"
            placeholder="Type or speak your response here..."
            value={userResponse}
            onChange={(e) => setUserResponse(e.target.value)}
          />
          <Button
            onClick={toggleListening}
            variant="outline"
            size="icon"
            aria-label={isListening ? "Stop listening" : "Start listening"}
          >
            {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
        </div>

        {/* Submit / Speaker */}
        <div className="flex justify-between">
          <Button onClick={handleNext} className="bg-indigo-600 text-white hover:bg-indigo-700">
            <Send className="h-4 w-4 mr-2" />
            Submit
          </Button>
          <Button
            onClick={toggleSpeaking}
            variant="outline"
            size="icon"
            aria-label={isSpeaking ? "Stop speaking" : "Start speaking"}
          >
            {isSpeaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VoiceChatbot;
