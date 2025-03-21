import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle } from 'lucide-react';

const StopwatchYutGame = () => {
  // Game states
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(0);
  const [displayTime, setDisplayTime] = useState('00:00.00');
  const [fraction, setFraction] = useState({ numerator: 0, denominator: 0 });
  const [result, setResult] = useState('');
  const [currentTeam, setCurrentTeam] = useState(1);
  const [teams, setTeams] = useState([
    { id: 1, name: 'Team 1', pieces: [0, 0, 0, 0] },
    { id: 2, name: 'Team 2', pieces: [0, 0, 0, 0] }
  ]);
  const [selectedPiece, setSelectedPiece] = useState(0);
  const [message, setMessage] = useState('팀 1의 차례입니다. 스톱워치를 시작하세요.');
  const [gameOver, setGameOver] = useState(false);
  const [showRules, setShowRules] = useState(false);
  
  const stopwatchRef = useRef(null);
  const intervalRef = useRef(null);

  // Path definitions
  const boardPath = [
    { x: 50, y: 290 }, // Start
    { x: 130, y: 290 }, // 1
    { x: 210, y: 290 }, // 2
    { x: 290, y: 290 }, // 3
    { x: 370, y: 290 }, // 4
    { x: 450, y: 290 }, // 5
    { x: 450, y: 210 }, // 6
    { x: 450, y: 130 }, // 7
    { x: 450, y: 50 }, // 8
    { x: 370, y: 50 }, // 9
    { x: 290, y: 50 }, // 10
    { x: 210, y: 50 }, // 11
    { x: 130, y: 50 }, // 12
    { x: 50, y: 50 }, // 13
    { x: 50, y: 130 }, // 14
    { x: 50, y: 210 }, // 15
    { x: 50, y: 290 }, // Back to start
    { x: 210, y: 170 }, // Center (goal)
  ];

  // Initialize the stopwatch
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTime(prevTime => {
          const newTime = prevTime + 10;
          const minutes = Math.floor(newTime / 60000);
          const seconds = Math.floor((newTime % 60000) / 1000);
          const milliseconds = Math.floor((newTime % 1000) / 10);
          
          setDisplayTime(
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`
          );
          
          return newTime;
        });
      }, 10);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [isRunning]);

  // Start the stopwatch
  const startStopwatch = () => {
    setIsRunning(true);
    setMessage('스톱워치가 실행 중입니다. 정지 버튼을 눌러주세요.');
  };

  // Check if a number is a recurring decimal
  const isRecurringDecimal = (numerator, denominator) => {
    if (denominator === 0) return false;
    
    // Get the decimal representation
    const decimal = numerator / denominator;
    
    // Convert to string and check for recurring pattern
    const decimalStr = decimal.toString();
    
    // If it's a terminating decimal, it's not recurring
    if (decimalStr.length <= 10) return false;
    
    // For this simple implementation, we'll check if the decimal has more than 10 digits
    // and is not a terminating decimal like 0.5 or 0.25
    return decimalStr.length > 10 && !Number.isInteger(decimal * Math.pow(10, 10));
  };

  // Check if a number is a finite decimal
  const isFiniteDecimal = (numerator, denominator) => {
    if (denominator === 0) return false;
    
    // A finite decimal occurs when the denominator's prime factorization 
    // contains only 2s and 5s
    let d = denominator;
    while (d % 2 === 0) d /= 2;
    while (d % 5 === 0) d /= 5;
    
    return d === 1;
  };

  // Stop the stopwatch and calculate the result
  const stopStopwatch = () => {
    if (!isRunning) return;
    
    setIsRunning(false);
    
    // Extract seconds and milliseconds
    const timeStr = displayTime.split(':')[1];
    const seconds = parseInt(timeStr.split('.')[0]);
    const milliseconds = parseInt(timeStr.split('.')[1]);
    
    // Set the fraction
    setFraction({
      numerator: seconds,
      denominator: milliseconds
    });
    
    // Determine the result
    let moveType = '';
    let moveSpaces = 0;
    
    if (seconds >= 2) {
      moveType = '윷 (Yut)';
      moveSpaces = 4;
    } else if (milliseconds === 0) {
      moveType = '모 (Mo)';
      moveSpaces = 5;
    } else if (isRecurringDecimal(seconds, milliseconds)) {
      moveType = '개 (Gae)';
      moveSpaces = 2;
    } else if (isFiniteDecimal(seconds, milliseconds)) {
      moveType = '걸 (Geol)';
      moveSpaces = 3;
    } else {
      moveType = '도 (Do)';
      moveSpaces = 1;
    }
    
    setResult(`${seconds}/${milliseconds} → ${moveType} (${moveSpaces}칸)`);
    setMessage(`${moveType}! ${moveSpaces}칸 이동할 수 있습니다. 이동할 말을 선택하세요.`);
    
    // Check if player gets another turn
    const getsBonusTurn = seconds >= 2 || milliseconds === 0;
    
    // Update game state
    setTimeout(() => {
      if (!getsBonusTurn) {
        setCurrentTeam(currentTeam === 1 ? 2 : 1);
      }
    }, 2000);
  };

  // Reset the stopwatch
  const resetStopwatch = () => {
    setIsRunning(false);
    setTime(0);
    setDisplayTime('00:00.00');
    setFraction({ numerator: 0, denominator: 0 });
    setResult('');
  };

  // Move a piece
  const movePiece = (teamIndex, pieceIndex) => {
    if (!result) return;
    
    const teamIdx = teamIndex - 1;
    const moveSpaces = result.includes('도') ? 1 : 
                      result.includes('개') ? 2 : 
                      result.includes('걸') ? 3 : 
                      result.includes('윷') ? 4 : 5;
    
    const newTeams = [...teams];
    let currentPosition = newTeams[teamIdx].pieces[pieceIndex];
    let newPosition = currentPosition + moveSpaces;
    
    // Check if the piece has completed the circuit
    if (newPosition >= 16) {
      newPosition = 17; // Goal position
    }
    
    newTeams[teamIdx].pieces[pieceIndex] = newPosition;
    setTeams(newTeams);
    
    // Check if the team has won
    if (newTeams[teamIdx].pieces.every(pos => pos === 17)) {
      setMessage(`${newTeams[teamIdx].name}이(가) 승리했습니다!`);
      setGameOver(true);
    } else {
      setResult('');
      setMessage(`팀 ${currentTeam}의 차례입니다. 스톱워치를 시작하세요.`);
    }
    
    resetStopwatch();
  };

  // Render the game board
  const renderBoard = () => {
    return (
      <svg width="500" height="340" className="bg-blue-50 rounded-lg border border-gray-300">
        {/* Draw the board paths */}
        <path 
          d="M50,290 L450,290 L450,50 L50,50 L50,290 Z" 
          stroke="black" 
          strokeWidth="2" 
          fill="none" 
        />
        
        {/* Diagonal path */}
        <path 
          d="M50,290 L450,50" 
          stroke="black" 
          strokeWidth="2" 
          strokeDasharray="5,5" 
          fill="none" 
        />
        
        {/* Other diagonal path */}
        <path 
          d="M50,50 L450,290" 
          stroke="black" 
          strokeWidth="2" 
          strokeDasharray="5,5" 
          fill="none" 
        />
        
        {/* Center point */}
        <circle cx="250" cy="170" r="30" fill="lightgreen" stroke="black" strokeWidth="1" />
        <text x="250" y="175" textAnchor="middle" fontSize="14">Goal</text>
        
        {/* Draw the position markers */}
        {boardPath.map((pos, index) => (
          <circle 
            key={index} 
            cx={pos.x} 
            cy={pos.y} 
            r={index === 17 ? 30 : 10} 
            fill={index === 0 ? "yellow" : index === 17 ? "lightgreen" : "white"} 
            stroke="black" 
            strokeWidth="1" 
          />
        ))}
        
        {/* Draw the pieces */}
        {teams.map((team, teamIdx) => (
          team.pieces.map((position, pieceIdx) => {
            if (position === 0 || position === 17) return null;
            
            const pos = boardPath[position];
            const offsetX = (pieceIdx % 2) * 15 - 7;
            const offsetY = Math.floor(pieceIdx / 2) * 15 - 7;
            
            return (
              <circle 
                key={`${teamIdx}-${pieceIdx}`} 
                cx={pos.x + offsetX} 
                cy={pos.y + offsetY} 
                r="7" 
                fill={teamIdx === 0 ? "red" : "blue"} 
                stroke="black" 
                strokeWidth="1" 
                onClick={() => {
                  if (currentTeam === team.id && result) {
                    movePiece(team.id, pieceIdx);
                  }
                }}
                style={{ cursor: currentTeam === team.id && result ? 'pointer' : 'default' }}
              />
            );
          })
        ))}
        
        {/* Home base pieces */}
        {teams.map((team, teamIdx) => (
          team.pieces.map((position, pieceIdx) => {
            if (position !== 0) return null;
            
            const baseX = teamIdx === 0 ? 30 : 490;
            const baseY = 320 + pieceIdx * 20;
            
            return (
              <circle 
                key={`home-${teamIdx}-${pieceIdx}`} 
                cx={baseX} 
                cy={baseY} 
                r="7" 
                fill={teamIdx === 0 ? "red" : "blue"} 
                stroke="black" 
                strokeWidth="1" 
                onClick={() => {
                  if (currentTeam === team.id && result) {
                    movePiece(team.id, pieceIdx);
                  }
                }}
                style={{ cursor: currentTeam === team.id && result ? 'pointer' : 'default' }}
              />
            );
          })
        ))}
        
        {/* Goal pieces */}
        {teams.map((team, teamIdx) => (
          team.pieces.map((position, pieceIdx) => {
            if (position !== 17) return null;
            
            const goalX = 250 + (pieceIdx % 2) * 15 - 7;
            const goalY = 170 + Math.floor(pieceIdx / 2) * 15 - 7;
            
            return (
              <circle 
                key={`goal-${teamIdx}-${pieceIdx}`} 
                cx={goalX} 
                cy={goalY} 
                r="7" 
                fill={teamIdx === 0 ? "red" : "blue"} 
                stroke="black" 
                strokeWidth="1" 
              />
            );
          })
        ))}
      </svg>
    );
  };

  return (
    <div className="flex flex-col items-center p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">스톱워치 윷놀이 (Stopwatch Yut Game)</h1>
      
      <div className="flex justify-between w-full mb-4">
        <div className="bg-red-100 p-2 rounded border border-red-300 w-48 text-center">
          <h2 className="font-bold">Team 1 (Red)</h2>
          <div>
            {teams[0].pieces.filter(p => p === 17).length} / 4 pieces in goal
          </div>
        </div>
        
        <div className="bg-blue-100 p-2 rounded border border-blue-300 w-48 text-center">
          <h2 className="font-bold">Team 2 (Blue)</h2>
          <div>
            {teams[1].pieces.filter(p => p === 17).length} / 4 pieces in goal
          </div>
        </div>
      </div>
      
      <div className="mb-4 p-3 bg-yellow-100 rounded-md border border-yellow-300 w-full text-center">
        <p className="font-medium">{message}</p>
      </div>
      
      <div className="flex justify-center mb-4">
        {renderBoard()}
      </div>
      
      <div className="flex flex-col items-center mb-4 bg-gray-100 p-4 rounded-lg w-full max-w-md">
        <div ref={stopwatchRef} className="text-4xl font-mono mb-2">
          {displayTime}
        </div>
        
        <div className="flex space-x-4 mb-4">
          <button
            onClick={startStopwatch}
            disabled={isRunning || gameOver}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          >
            시작 (Start)
          </button>
          
          <button
            onClick={stopStopwatch}
            disabled={!isRunning || gameOver}
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          >
            중지 (Stop)
          </button>
        </div>
        
        {result && (
          <div className="text-lg font-semibold mb-2">
            결과 (Result): {result}
          </div>
        )}
      </div>
      
      <div className="w-full max-w-md">
        <button
          onClick={() => setShowRules(!showRules)}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded mb-2 w-full"
        >
          {showRules ? '게임 규칙 숨기기' : '게임 규칙 보기'} (Game Rules)
        </button>
        
        {showRules && (
          <div className="bg-white p-4 rounded-lg border border-gray-300 mb-4">
            <h3 className="font-bold mb-2">게임 규칙 (Game Rules):</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>각 팀은 4개의 말을 가지고 있습니다.</li>
              <li>차례가 되면 스톱워치를 시작하고 정지합니다.</li>
              <li>스톱워치에서 초 단위의 수를 분자, 초 단위 아래의 수를 분모로 하는 분수를 만듭니다.</li>
              <li>분수의 성질에 따라 다음과 같이 이동합니다:
                <ul className="list-disc pl-5 mt-1">
                  <li>1 (다른 분류에 속하지 않는 경우) - 도 (1칸)</li>
                  <li>순환소수 - 개 (2칸)</li>
                  <li>유한소수 - 걸 (3칸)</li>
                  <li>2 이상의 자연수 - 윷 (4칸)</li>
                  <li>분모가 0인 경우 - 모 (5칸)</li>
                </ul>
              </li>
              <li>윷이나 모가 나오면 한 번 더 던질 수 있습니다.</li>
              <li>모든 말을 목적지에 먼저 도착시키는 팀이 승리합니다.</li>
            </ul>
          </div>
        )}
      </div>
      
      {gameOver && (
        <button
          onClick={() => window.location.reload()}
          className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded mt-4"
        >
          새 게임 시작 (New Game)
        </button>
      )}
    </div>
  );
};

export default StopwatchYutGame;