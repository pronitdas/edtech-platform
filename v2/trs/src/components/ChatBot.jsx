import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import useAuthState from "@/hooks/useAuthState";
import { OpenAIClient } from "@/services/openAi";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mic, MicOff, Volume2, VolumeX, Send, Loader2 } from 'lucide-react';



const ChatBot = ({ topic, language }) => {
  const [userResponse, setUserResponse] = useState("");
  const { oAiKey } = useAuthState();
  const [apiClient, setApiClient] = useState < OpenAIClient | null > (null);
  const [mentorText, setMentorText] = useState(
    language === 'en'
      ? "Hello, I'm AI-Mentor! Let's start your journey. What would you like to know about this topic?"
      : "¡Hola, soy AI-Mentor! Comencemos tu viaje. ¿Qué te gustaría saber sobre este tema?"
  );
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [conversation, setConversation] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState < string | null > (null);
  const [narrator, setNarrator] = useState < SpeechSynthesisVoice | null > (null);

  const recognitionRef = useRef < SpeechRecognition | null > (null);

  useEffect(() => {
    if (!apiClient && oAiKey) {
      setApiClient(new OpenAIClient(oAiKey));
    }
  }, [oAiKey, apiClient]);

  useEffect(() => {
    if ('speechSynthesis' in window) {
      const voices = window.speechSynthesis.getVoices();
      setNarrator(voices.find(voice => voice.lang === language) || voices[0]);
    }
  }, [language]);

  const handleNext = useCallback(async () => {
    if (!userResponse.trim() || !apiClient) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setConversation(prev => [...prev, { role: 'user', content: userResponse }]);

    try {
      const newMentorText = await apiClient.chat(
        userResponse,
        `You are an AI mentor helping the user understand ${topic}. Respond in ${language} in less than 100 words.`,
        300
      );

      setMentorText(newMentorText);
      setConversation(prev => [...prev, { role: 'assistant', content: newMentorText }]);
      setUserResponse("");

      if ('speechSynthesis' in window && narrator) {
        const utterance = new SpeechSynthesisUtterance(newMentorText);
        utterance.voice = narrator;
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        speechSynthesis.speak(utterance);
      }
    } catch (err) {
      setError("An error occurred while fetching the response. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [userResponse, apiClient, topic, language, narrator]);

  const toggleListening = useCallback(() => {
    if (!isListening) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.lang = language;
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;

        recognitionRef.current.onresult = (event) => {
          const transcript = Array.from(event.results)
            .map(result => result[0].transcript)
            .join('');
          setUserResponse(transcript);
        };

        recognitionRef.current.onerror = (event) => {
          console.error('Speech recognition error', event.error);
          setIsListening(false);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current.start();
        setIsListening(true);
      } else {
        setError('Speech recognition is not supported in your browser.');
      }
    } else {
      recognitionRef.current?.stop();
      setIsListening(false);
    }
  }, [isListening, language]);

  const toggleSpeaking = useCallback(() => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else if (narrator) {
      const utterance = new SpeechSynthesisUtterance(mentorText);
      utterance.voice = narrator;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      speechSynthesis.speak(utterance);
    }
  }, [isSpeaking, mentorText, narrator]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-grow overflow-y-auto p-4 space-y-4">
        {conversation.map((message, index) => (
          <p key={index} className={`text-sm mb-2 ${message.role === 'user' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-800 dark:text-gray-200'}`}>
            <strong>{message.role === 'user' ? (language === 'en' ? 'You: ' : 'Tú: ') : 'AI-Mentor: '}</strong>
            {message.content}
          </p>
        ))}
        {isLoading && (
          <div className="flex items-center text-gray-500 dark:text-gray-400">
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            {language === 'en' ? 'AI is thinking...' : 'La IA está pensando...'}
          </div>
        )}
      </div>
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <Textarea
            className="flex-grow p-2 text-sm text-gray-800 dark:text-gray-200 border rounded-md dark:bg-gray-700 resize-none"
            placeholder={language === 'en' ? "Type your message..." : "Escribe tu mensaje..."}
            value={userResponse}
            onChange={(e) => setUserResponse(e.target.value)}
            rows={2}
          />
          <Button
            onClick={handleNext}
            className="bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
            disabled={isLoading || !userResponse.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex justify-between items-center mt-4">
        <div className="flex items-center space-x-2">
          <Select onValueChange={(value) => setNarrator(speechSynthesis.getVoices().find(voice => voice.name === value) || null)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={language === 'en' ? "Select voice" : "Seleccionar voz"} />
            </SelectTrigger>
            <SelectContent>
              {speechSynthesis.getVoices().map((voice) => (
                <SelectItem key={voice.name} value={voice.name}>
                  {voice.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
      {error && (
        <p className="text-red-500 dark:text-red-400 text-sm mt-4">{error}</p>
      )}
    </div>
  );
};

export default ChatBot;

