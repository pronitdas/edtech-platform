import React, { useState } from 'react';

const boardSize = 10;
const cellSize = 50; // Adjust this to change the size of each cell

const snakes = {
  14: 4,
  31: 9,
  38: 20,
  84: 28,
  93: 53,
  95: 73,
  97: 78,
};

const ladders = {
  3: 22,
  5: 8,
  11: 26,
  20: 29,
  39: 60,
  51: 67,
  63: 81,
  72: 91,
  88: 100,
};

// Helper to create the board layout
const createBoard = () => {
  const cells = [];
  for (let row = boardSize; row > 0; row--) {
    for (let col = 1; col <= boardSize; col++) {
      const cellNumber = row % 2 === 0 ? (row - 1) * boardSize + col : row * boardSize - col + 1;
      cells.push(cellNumber);
    }
  }
  return cells;
};

// Helper to calculate x, y coordinates for a cell number
const getCellCoordinates = (cellNumber) => {
  const row = Math.floor((cellNumber - 1) / boardSize);
  const col = (cellNumber - 1) % boardSize;
  return {
    x: col * cellSize + cellSize / 2,
    y: (boardSize - 1 - row) * cellSize + cellSize / 2,
  };
};

const SnakeLadder = ({ questions }) => {
  const [playerPosition, setPlayerPosition] = useState(1);
  const [diceRoll, setDiceRoll] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [diceAnimation, setDiceAnimation] = useState({ x: 0, y: 0 });

  const board = createBoard();
  const rollDice = () => {
    const roll = Math.floor(Math.random() * 6) + 1;

    // Randomize dice rotation
    const randomX = Math.floor(Math.random() * 4) + 1; // Random faces for animation
    const randomY = Math.floor(Math.random() * 4) + 1;

    setDiceAnimation({
      x: randomX * 90,
      y: randomY * 90,
    });

    setTimeout(() => {
      setDiceRoll(roll);
      movePlayer(roll);
    }, 2000); // Wait for dice animation
  };


  const movePlayer = (steps) => {
    let newPosition = playerPosition + steps;

    if (newPosition >= boardSize * boardSize) {
      setPlayerPosition(boardSize * boardSize);
      setStatusMessage('Congratulations! You win!');
      return;
    }

    if (snakes[newPosition]) {
      setStatusMessage(`Oh no, you got bitten by a snake! Moving to ${snakes[newPosition]}`);
      newPosition = snakes[newPosition];
    } else if (ladders[newPosition]) {
      setStatusMessage(`Yay! You climbed a ladder to ${ladders[newPosition]}`);
      newPosition = ladders[newPosition];
    }

    setPlayerPosition(newPosition);
  };

  return (
    <div className="flex flex-col items-center bg-gray-800 h-screen p-4">
      <div
        className="relative"
        style={{
          width: `${cellSize * boardSize}px`,
          height: `${cellSize * boardSize}px`,
          backgroundColor: '#eef',
          display: 'grid',
          gridTemplateColumns: `repeat(${boardSize}, ${cellSize}px)`,
          gridTemplateRows: `repeat(${boardSize}, ${cellSize}px)`,
        }}
      >
        {board.map((cellNumber) => (
          <div
            key={cellNumber}
            className="border flex justify-center text-black items-center text-sm relative"
            style={{ width: `${cellSize}px`, height: `${cellSize}px` }}
          >
            {cellNumber}
            {playerPosition === cellNumber && (
              <div className="absolute w-4 h-4 bg-red-500 rounded-full"></div>
            )}
          </div>
        ))}

        {/* Render snakes */}
        {Object.entries(snakes).map(([start, end]) => {
          const startCoords = getCellCoordinates(parseInt(start));
          const endCoords = getCellCoordinates(parseInt(end));
          return (
            <svg
              key={start}
              className="absolute pointer-events-none"
              style={{
                width: `${cellSize * boardSize}px`,
                height: `${cellSize * boardSize}px`,
              }}
            >
              <path
                d={`M${startCoords.x},${startCoords.y} Q${(startCoords.x + endCoords.x) / 2},${startCoords.y - 100
                  } ${endCoords.x},${endCoords.y}`}
                stroke="red"
                fill="none"
                strokeWidth="2"
              />
            </svg>
          );
        })}

        {/* Render ladders */}
        {Object.entries(ladders).map(([start, end]) => {
          const startCoords = getCellCoordinates(parseInt(start));
          const endCoords = getCellCoordinates(parseInt(end));
          return (
            <svg
              key={start}
              className="absolute pointer-events-none"
              style={{
                width: `${cellSize * boardSize}px`,
                height: `${cellSize * boardSize}px`,
              }}
            >
              <line
                x1={startCoords.x}
                y1={startCoords.y}
                x2={endCoords.x}
                y2={endCoords.y}
                stroke="brown"
                strokeWidth="4"
              />
              {[...Array(5)].map((_, index) => {
                const fraction = index / 4;
                const rungX1 =
                  startCoords.x + fraction * (endCoords.x - startCoords.x) - 10;
                const rungY1 =
                  startCoords.y + fraction * (endCoords.y - startCoords.y);
                const rungX2 =
                  startCoords.x + fraction * (endCoords.x - startCoords.x) + 10;
                const rungY2 =
                  startCoords.y + fraction * (endCoords.y - startCoords.y);
                return (
                  <line
                    key={index}
                    x1={rungX1}
                    y1={rungY1}
                    x2={rungX2}
                    y2={rungY2}
                    stroke="brown"
                    strokeWidth="2"
                  />
                );
              })}
            </svg>
          );
        })}
      </div>

      <div className="relative mt-8">
        <div
          className="dice"
          style={{
            transform: `rotateX(${diceAnimation.x}deg) rotateY(${diceAnimation.y}deg)`,
          }}
        >
          <div className="face one">1</div>
          <div className="face two">2</div>
          <div className="face three">3</div>
          <div className="face four">4</div>
          <div className="face five">5</div>
          <div className="face six">6</div>
        </div>
      </div>
      <div className="mt-4 flex flex-col items-center">
        <button
          onClick={rollDice}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Roll Dice
        </button>
        {diceRoll && <p className="mt-2 text-white-700">You rolled: {diceRoll}</p>}
        <p className="mt-2 text-green-700">{statusMessage}</p>
      </div>
    </div>
  );
};

export default SnakeLadder;
