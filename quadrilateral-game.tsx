import React, { useState, useEffect, useRef } from 'react';

const QuadrilateralGame = () => {
  // Game state
  const [playerCards, setPlayerCards] = useState([]);
  const [npcCards, setNpcCards] = useState([]);
  const [currentQuadCard, setCurrentQuadCard] = useState(null);
  const [currentPropertyCard, setCurrentPropertyCard] = useState(null);
  const [playerScore, setPlayerScore] = useState(0);
  const [npcScore, setNpcScore] = useState(0);
  const [gameMessage, setGameMessage] = useState('게임을 시작합니다! 카드가 맞으면 종을 쳐주세요.');
  const [canPlayerRing, setCanPlayerRing] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [npcThinking, setNpcThinking] = useState(false);
  const npcTimeoutRef = useRef(null);
  
  // Card decks
  const quadrilateralCards = [
    { id: 1, name: '사다리꼴', image: '/api/placeholder/150/150', properties: ['한 쌍의 대변이 평행하다.'] },
    { id: 2, name: '등변사다리꼴', image: '/api/placeholder/150/150', properties: ['한 쌍의 대변이 평행하고, 그 길이가 같다.'] },
    { id: 3, name: '직사각형', image: '/api/placeholder/150/150', properties: ['네 내각의 크기가 모두 같다.', '두 대각선의 길이가 같다.'] },
    { id: 4, name: '정사각형', image: '/api/placeholder/150/150', properties: ['네 변의 길이가 모두 같고, 네 내각의 크기도 모두 같다.', '두 대각선이 서로를 수직이등분한다.', '네 변의 길이가 모두 같다.', '네 내각의 크기가 모두 같다.', '두 대각선의 길이가 같다.'] },
    { id: 5, name: '마름모', image: '/api/placeholder/150/150', properties: ['네 변의 길이가 모두 같다.', '두 대각선이 서로를 이등분한다.'] },
    { id: 6, name: '평행사변형', image: '/api/placeholder/150/150', properties: ['두 대각선이 서로를 이등분한다.'] }
  ];
  
  const propertyCards = [
    { id: 1, property: '한 쌍의 대변이 평행하다.' },
    { id: 2, property: '네 내각의 크기가 모두 같다.' },
    { id: 3, property: '두 대각선의 길이가 같다.' },
    { id: 4, property: '네 변의 길이가 모두 같다.' },
    { id: 5, property: '두 대각선이 서로를 이등분한다.' },
    { id: 6, property: '두 대각선이 서로를 수직이등분한다.' },
    { id: 7, property: '한 쌍의 대변이 평행하고, 그 길이가 같다.' },
    { id: 8, property: '네 변의 길이가 모두 같고, 네 내각의 크기도 모두 같다.' }
  ];
  
  // Shuffled decks
  const [quadDeck, setQuadDeck] = useState([]);
  const [propertyDeck, setPropertyDeck] = useState([]);
  
  // Initialize game
  const startGame = () => {
    // Shuffle cards
    const shuffledQuads = [...quadrilateralCards].sort(() => Math.random() - 0.5);
    const shuffledProps = [...propertyCards].sort(() => Math.random() - 0.5);
    
    setQuadDeck(shuffledQuads);
    setPropertyDeck(shuffledProps);
    setPlayerCards([]);
    setNpcCards([]);
    setPlayerScore(0);
    setNpcScore(0);
    setCurrentQuadCard(null);
    setCurrentPropertyCard(null);
    setGameMessage('게임을 시작합니다! 카드가 맞으면 종을 쳐주세요.');
    setCanPlayerRing(true);
    setGameStarted(true);
    setGameEnded(false);
    
    // Draw first cards
    drawCards();
  };
  
  // Draw new cards
  const drawCards = () => {
    if (quadDeck.length === 0 || propertyDeck.length === 0) {
      endGame();
      return;
    }
    
    // Draw new cards
    const newQuadCard = quadDeck[0];
    const newPropertyCard = propertyDeck[0];
    
    // Remove drawn cards from decks
    setQuadDeck(quadDeck.slice(1));
    setPropertyDeck(propertyDeck.slice(1));
    
    // Set current cards
    setCurrentQuadCard(newQuadCard);
    setCurrentPropertyCard(newPropertyCard);
    
    // NPC thinking
    setNpcThinking(true);
    
    // Clear any existing timeout
    if (npcTimeoutRef.current) {
      clearTimeout(npcTimeoutRef.current);
    }
    
    // Set new timeout for NPC to respond
    const isMatch = isCardMatch(newQuadCard, newPropertyCard);
    const npcDelay = Math.random() * (isMatch ? 2000 : 5000) + 1000; // NPC responds faster if it's a match
    
    npcTimeoutRef.current = setTimeout(() => {
      if (isMatch && canPlayerRing) {
        npcRingBell();
      }
      setNpcThinking(false);
    }, npcDelay);
  };
  
  // Check if cards match
  const isCardMatch = (quadCard, propertyCard) => {
    if (!quadCard || !propertyCard) return false;
    return quadCard.properties.includes(propertyCard.property);
  };
  
  // Player rings the bell
  const playerRingBell = () => {
    if (!canPlayerRing || !gameStarted || gameEnded) return;
    
    // Clear NPC timeout
    if (npcTimeoutRef.current) {
      clearTimeout(npcTimeoutRef.current);
      npcTimeoutRef.current = null;
    }
    
    const isMatch = isCardMatch(currentQuadCard, currentPropertyCard);
    
    if (isMatch) {
      // Correct match
      const updatedPlayerCards = [...playerCards, currentQuadCard, currentPropertyCard];
      setPlayerCards(updatedPlayerCards);
      setPlayerScore(playerScore + 2);
      setGameMessage('정답입니다! 카드를 가져갑니다.');
      
      // Draw new cards after a short delay
      setTimeout(drawCards, 1500);
    } else {
      // Incorrect match
      setGameMessage('오답입니다! 다음 차례에는 종을 칠 수 없습니다.');
      setCanPlayerRing(false);
      
      // Player can ring again after the next round
      setTimeout(() => {
        setCanPlayerRing(true);
        setGameMessage('다시 종을 칠 수 있습니다.');
      }, 3000);
    }
  };
  
  // NPC rings the bell
  const npcRingBell = () => {
    if (gameEnded) return;
    
    const isMatch = isCardMatch(currentQuadCard, currentPropertyCard);
    
    if (isMatch) {
      // Correct match
      const updatedNpcCards = [...npcCards, currentQuadCard, currentPropertyCard];
      setNpcCards(updatedNpcCards);
      setNpcScore(npcScore + 2);
      setGameMessage('NPC가 종을 쳤습니다! NPC가 카드를 가져갑니다.');
      
      // Draw new cards after a short delay
      setTimeout(drawCards, 1500);
    }
  };
  
  // Skip current cards if no one rings the bell
  const skipCards = () => {
    if (gameEnded) return;
    setGameMessage('아무도 종을 치지 않았습니다. 다음 카드로 넘어갑니다.');
    drawCards();
  };
  
  // End the game
  const endGame = () => {
    setGameEnded(true);
    setGameStarted(false);
    
    if (playerScore > npcScore) {
      setGameMessage(`게임 종료! 당신이 ${playerScore}점으로 NPC(${npcScore}점)를 이겼습니다!`);
    } else if (npcScore > playerScore) {
      setGameMessage(`게임 종료! NPC가 ${npcScore}점으로 당신(${playerScore}점)을 이겼습니다.`);
    } else {
      setGameMessage(`게임 종료! ${playerScore}점으로 비겼습니다!`);
    }
    
    // Clear any existing timeout
    if (npcTimeoutRef.current) {
      clearTimeout(npcTimeoutRef.current);
      npcTimeoutRef.current = null;
    }
  };
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (npcTimeoutRef.current) {
        clearTimeout(npcTimeoutRef.current);
      }
    };
  }, []);
  
  return (
    <div className="flex flex-col items-center p-4 bg-blue-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-4 text-center">사각형 카드 놀이</h1>
      
      {/* Game Info */}
      <div className="bg-white rounded-lg p-4 mb-6 w-full max-w-2xl shadow-md">
        <p className="text-lg mb-2 font-medium text-center">{gameMessage}</p>
        <div className="flex justify-between items-center">
          <div className="text-lg">
            <span className="font-bold">나: </span>
            <span className="text-blue-600 font-bold">{playerScore}점</span>
            <span className="text-sm ml-2">({playerCards.length / 2} 쌍)</span>
          </div>
          <div className="text-lg">
            <span className="font-bold">NPC: </span>
            <span className="text-red-600 font-bold">{npcScore}점</span>
            <span className="text-sm ml-2">({npcCards.length / 2} 쌍)</span>
          </div>
        </div>
        
        {npcThinking && gameStarted && !gameEnded && (
          <div className="mt-2 text-center text-sm text-gray-500">
            NPC가 생각 중입니다...
          </div>
        )}
      </div>
      
      {/* Game Area */}
      {gameStarted && !gameEnded ? (
        <div className="w-full max-w-2xl">
          {/* Cards */}
          <div className="flex justify-center gap-8 mb-8">
            {currentQuadCard && (
              <div className="bg-white rounded-lg shadow-lg p-4 w-48 h-64 flex flex-col items-center justify-center">
                <div className="text-center font-bold mb-2">{currentQuadCard.name}</div>
                <div className="w-32 h-32 bg-gray-200 flex items-center justify-center rounded">
                  {currentQuadCard.name}
                </div>
              </div>
            )}
            
            {currentPropertyCard && (
              <div className="bg-white rounded-lg shadow-lg p-4 w-48 h-64 flex flex-col items-center justify-center">
                <div className="text-center font-bold mb-2">속성 카드</div>
                <div className="text-center p-2">
                  {currentPropertyCard.property}
                </div>
              </div>
            )}
          </div>
          
          {/* Controls */}
          <div className="flex flex-col items-center gap-4">
            <button
              onClick={playerRingBell}
              disabled={!canPlayerRing}
              className={`rounded-full w-24 h-24 text-xl font-bold ${
                canPlayerRing 
                  ? 'bg-red-500 hover:bg-red-600 active:bg-red-700 text-white' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              } shadow-lg transition-transform transform active:scale-95`}
            >
              종 치기
            </button>
            
            <button
              onClick={skipCards}
              className="mt-4 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded"
            >
              넘어가기
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <button
            onClick={startGame}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-lg font-medium shadow-md"
          >
            {gameEnded ? '다시 시작하기' : '게임 시작하기'}
          </button>
        </div>
      )}
      
      {/* Game Rules */}
      <div className="mt-8 bg-white rounded-lg p-4 w-full max-w-2xl shadow-md">
        <h2 className="text-xl font-bold mb-2">게임 방법</h2>
        <ol className="list-decimal pl-5 space-y-2">
          <li>한 명은 사각형 카드, 다른 한 명은 성질 카드를 가진다.</li>
          <li>뒷면이 보이게 쌓아 둔 카드에서 각자 한 장씩 뽑아 앞면이 보이게 뒤집는다.</li>
          <li>사각형과 성질이 바르게 짝 지어졌을 때 먼저 종을 친 사람이 앞면이 보이게 뒤집은 카드를 모두 가져간다.</li>
          <li>사각형과 성질이 잘못 짝 지어졌을 때 종을 치면 카드를 가져가지 못하고, 다음 차례에는 종을 칠 수 없다.</li>
          <li>아무도 종을 치지 않았다면 카드를 그대로 두고, 놀이를 이어 간다.</li>
          <li>카드를 모두 뒤집었을 때, 가지고 있는 카드가 더 많은 사람이 이긴다.</li>
        </ol>
      </div>
    </div>
  );
};

export default QuadrilateralGame;
