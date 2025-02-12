'use client'

import React, { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const UnderwaterAdventure = ({ questions }) => {
  const [diver, setDiver] = useState({ x: 50, y: 50, width: 100, height: 100 });
  const [obstructions, setObstructions] = useState([
    { x: 225, y: 20, width: 75, height: 100 },
    { x: 520, y: 20, width: 75, height: 100 },
    { x: 830, y: 40, width: 75, height: 100 },
    { x: 580, y: 330, width: 75, height: 100 },
    { x: 900, y: 240, width: 75, height: 100 },
    { x: 1000, y: 470, width: 75, height: 100 },
    { x: 1320, y: 400, width: 75, height: 100 }
  ]);
  const [filteredQues, setFilterQuestions] = useState(questions);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [score, setScore] = useState(0);
  const [tries, setTries] = useState(0);
  const [isGameStarted, setIsGameStarted] = useState(false);

  const videoRef = useRef(null);
  const audioRef = useRef(null);

  const handleKeydown = (e) => {
    if (currentQuestion !== null) return;
    setDiver((prev) => {
      const updatedDiver = { ...prev };
      if (e.key === "ArrowUp") updatedDiver.y -= 10;
      if (e.key === "ArrowDown") updatedDiver.y += 10;
      if (e.key === "ArrowLeft") updatedDiver.x -= 10;
      if (e.key === "ArrowRight") updatedDiver.x += 10;
      checkCollision(updatedDiver);
      return updatedDiver;
    });
  };

  const checkCollision = (updatedDiver) => {
    obstructions.forEach((ob, index) => {
      if (
        updatedDiver.x < ob.x + ob.width &&
        updatedDiver.x + updatedDiver.width > ob.x &&
        updatedDiver.y < ob.y + ob.height &&
        updatedDiver.height + updatedDiver.y > ob.y
      ) {
        setCurrentQuestion(index);
      }
    });
  };

  const answerQuestion = (answer) => {
    const question = filteredQues[currentQuestion];
    setTries((prev) => prev + 1);
    if (answer === question.answer) {
      setScore((prev) => prev + 1);
      setObstructions((prev) =>
        prev.filter((_, index) => index !== currentQuestion)
      );
      setFilterQuestions((prev) =>
        prev.filter((_, index) => index !== currentQuestion)
      );
      setCurrentQuestion(null);
    } else {
      alert("Wrong answer! Try again.");
    }
  };

  useEffect(() => {
    if (isGameStarted) {
      window.addEventListener("keydown", handleKeydown);
      videoRef.current?.play();
      audioRef.current?.play();
    }
    return () => {
      window.removeEventListener("keydown", handleKeydown);
    };
  }, [isGameStarted]);

  return (
    <div className="relative h-full p-10 w-full bg-black text-white overflow-hidden">
      {/* Background Video */}
      <div className="absolute inset-0 z-0">
        <video
          ref={videoRef}
          src="/background.mp4"
          loop
          muted
          className="w-full h-full object-cover"
        />
      </div>

      {/* Background Music */}
      <audio ref={audioRef} loop>
        <source src="/under_the_sea.mp3" type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>

      {/* Game Stats */}
      <div className="absolute top-4 left-4 z-10 text-lg font-semibold">
        <p>Tries: {tries}</p>
        <p>Score: {score}</p>
      </div>

      {/* Start Screen */}
      {!isGameStarted && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center space-y-4 bg-black bg-opacity-50">
          <h1 className="text-4xl font-bold">Underwater Adventure</h1>
          <Button onClick={() => setIsGameStarted(true)} className="px-8 py-4">
            Start Game
          </Button>
        </div>
      )}

      {/* Game Canvas */}
      {isGameStarted && (
        <div>
          {/* Question Card */}
          {currentQuestion !== null ? (
            <Card className="absolute top-1/2 left-1/2 z-20 w-80 p-4 -translate-x-1/2 -translate-y-1/2 text-black">
              <h2 className="mb-4 text-lg font-bold">
                {filteredQues[currentQuestion].question}
              </h2>
              {filteredQues[currentQuestion].options.map((option, index) => (
                <Button
                  key={index}
                  className="w-full mb-2"
                  onClick={() => answerQuestion(option)}
                >
                  {option}
                </Button>
              ))}
            </Card>
          ) : (
            <div className="relative z-10">
              {/* Diver */}
              <img
                className="absolute"
                src={'/diver.png'}
                style={{
                  left: diver.x,
                  top: diver.y,
                  width: diver.width,
                  height: diver.height,
                }}
              ></img>
              {/* Obstructions */}
              {obstructions.map((ob, index) => (
                <img
                  key={index}
                  src={'obstruction.png'}
                  className="absolute"
                  style={{
                    left: ob.x,
                    top: ob.y,
                    width: ob.width,
                    height: ob.height,
                  }}
                ></img>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UnderwaterAdventure;
