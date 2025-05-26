document.addEventListener('DOMContentLoaded', () => {
    // --- 상수 및 게임 설정 ---
    const HIGH = 'high';
    const LOW = 'low';
    const DOUBLE = 'double';
    const MAX_CARD_VALUE = 10; // 카드는 1부터 10까지
    const NUM_COPIES_PER_CARD = 6; // 각 숫자는 6번 등장 (총 60장)

    // --- DOM 요소 가져오기 ---
    const remainingCardsEl = document.getElementById('remaining-cards');
    const roundNumberEl = document.getElementById('round-number');
    const playerScoreEl = document.getElementById('player-score');
    const cpuScoreEl = document.getElementById('cpu-score');
    const playerHiddenCardEl = document.getElementById('player-hidden-card');
    const cpuVisibleCardEl = document.getElementById('cpu-visible-card');
    const cpuHiddenCardEl = document.getElementById('cpu-hidden-card');
    const playerVisibleCardForCpuEl = document.getElementById('player-visible-card-for-cpu');
    const playerGuessButtons = document.querySelectorAll('#player-guess-buttons .guess-btn');
    const cpuChoiceDisplayEl = document.getElementById('cpu-choice-display');
    const roundResultMessageEl = document.getElementById('round-result-message');
    const gameOverMessageEl = document.getElementById('game-over-message');
    const startNextButton = document.getElementById('start-next-button');

    // --- 게임 상태 변수 ---
    let deck = [];
    let playerScore = 0;
    let cpuScore = 0;
    let roundNumber = 0;
    let playerOwnHiddenCard = null;
    let cpuOwnHiddenCard = null;
    let gamePhase = 'initial'; // 'initial', 'roundInProgress', 'roundOver', 'gameOver'

    function createNumberDeck() {
        const singleSet = Array.from({ length: MAX_CARD_VALUE }, (_, i) => i + 1);
        let fullDeck = [];
        for (let i = 0; i < NUM_COPIES_PER_CARD; i++) {
            fullDeck.push(...singleSet);
        }
        for (let i = fullDeck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [fullDeck[i], fullDeck[j]] = [fullDeck[j], fullDeck[i]];
        }
        return fullDeck;
    }

    function updateUIDisplay() {
        remainingCardsEl.textContent = deck.length;
        roundNumberEl.textContent = roundNumber;
        playerScoreEl.textContent = playerScore;
        cpuScoreEl.textContent = cpuScore;
    }

    function resetCardVisuals() {
        playerHiddenCardEl.textContent = '?';
        playerHiddenCardEl.style.backgroundColor = '#a0a0a0';
        cpuVisibleCardEl.textContent = '?';
        cpuHiddenCardEl.textContent = '?';
        cpuHiddenCardEl.style.backgroundColor = '#a0a0a0';
        playerVisibleCardForCpuEl.textContent = '?';
        cpuChoiceDisplayEl.textContent = 'CPU 선택: -';
    }
    
    function enableGuessButtons(enable) {
        playerGuessButtons.forEach(button => button.disabled = !enable);
    }

    function startGame() {
        deck = createNumberDeck();
        playerScore = 0;
        cpuScore = 0;
        roundNumber = 0; // nextRound에서 1로 시작됨
        gameOverMessageEl.textContent = '';
        roundResultMessageEl.textContent = '';
        // gamePhase는 nextRound에서 설정됨
        nextRound(); // 첫 라운드 시작
    }

    function nextRound() {
        if (deck.length <= 2) {
            endGame();
            return;
        }

        roundNumber++;
        gamePhase = 'roundInProgress';
        playerOwnHiddenCard = deck.pop();
        cpuOwnHiddenCard = deck.pop();

        updateUIDisplay();
        resetCardVisuals();
        
        cpuVisibleCardEl.textContent = cpuOwnHiddenCard;
        playerVisibleCardForCpuEl.textContent = playerOwnHiddenCard;

        roundResultMessageEl.textContent = '카드가 배분되었습니다. 예측하세요!';
        enableGuessButtons(true);
        startNextButton.disabled = true; // 라운드 진행 중에는 비활성화
        // startNextButton의 텍스트는 revealAndScore 또는 endGame에서 업데이트됨
    }

    function handlePlayerGuess(event) {
        if (gamePhase !== 'roundInProgress') return;

        const playerGuess = event.target.dataset.guess;
        enableGuessButtons(false);

        const cpuGuess = getCpuGuess(playerOwnHiddenCard);
        cpuChoiceDisplayEl.textContent = `CPU 선택: ${cpuGuess.toUpperCase()}`;

        setTimeout(() => {
            revealAndScore(playerGuess, cpuGuess);
        }, 1000);
    }

    function getCpuGuess(playerVisibleCard) {
        const thresholdLow = Math.floor(MAX_CARD_VALUE / 3);
        const thresholdHigh = Math.floor(MAX_CARD_VALUE * 2 / 3) + 1;
        let choices;

        if (playerVisibleCard <= thresholdLow) {
            choices = [HIGH, HIGH, HIGH, LOW, DOUBLE, DOUBLE];
        } else if (playerVisibleCard >= thresholdHigh) {
            choices = [LOW, LOW, LOW, HIGH, DOUBLE, DOUBLE];
        } else {
            choices = [HIGH, LOW, DOUBLE, DOUBLE, HIGH, LOW];
        }
        return choices[Math.floor(Math.random() * choices.length)];
    }

    function determineActualRelationship(cardOwn, cardOpponent) {
        if (cardOwn > cardOpponent) return HIGH;
        if (cardOwn < cardOpponent) return LOW;
        return DOUBLE;
    }

    function revealAndScore(playerGuess, cpuGuess) {
        gamePhase = 'roundOver';

        playerHiddenCardEl.textContent = playerOwnHiddenCard;
        playerHiddenCardEl.style.backgroundColor = '#fff';
        cpuHiddenCardEl.textContent = cpuOwnHiddenCard;
        cpuHiddenCardEl.style.backgroundColor = '#fff';

        let roundMsg = "";
        const playerActualRelation = determineActualRelationship(playerOwnHiddenCard, cpuOwnHiddenCard);
        if (playerGuess === playerActualRelation) {
            const points = (playerGuess === DOUBLE) ? 2 : 1;
            playerScore += points;
            roundMsg += `Player 정답! (+${points}점) `;
        } else {
            roundMsg += `Player 실패. `;
        }

        const cpuActualRelation = determineActualRelationship(cpuOwnHiddenCard, playerOwnHiddenCard);
        if (cpuGuess === cpuActualRelation) {
            const points = (cpuGuess === DOUBLE) ? 2 : 1;
            cpuScore += points;
            roundMsg += `CPU 정답! (+${points}점) `;
        } else {
            roundMsg += `CPU 실패. `;
        }

        roundResultMessageEl.textContent = roundMsg.trim();
        updateUIDisplay();

        if (deck.length <= 2) {
            startNextButton.textContent = '게임 결과 보기';
        } else {
            startNextButton.textContent = '다음 라운드';
        }
        startNextButton.disabled = false;
    }

    function endGame() {
        gamePhase = 'gameOver';
        enableGuessButtons(false);
        startNextButton.textContent = '다시 시작?';
        startNextButton.disabled = false;

        roundResultMessageEl.textContent = "게임 종료!";
        if (playerScore > cpuScore) {
            gameOverMessageEl.textContent = `축하합니다! Player 승리! (Player ${playerScore} : ${cpuScore} CPU)`;
        } else if (cpuScore > playerScore) {
            gameOverMessageEl.textContent = `CPU 승리! (Player ${playerScore} : ${cpuScore} CPU)`;
        } else {
            gameOverMessageEl.textContent = `무승부! (Player ${playerScore} : ${cpuScore} CPU)`;
        }
        
        // 최종 카드 상태가 null일 수 있으므로, null 체크 후 표시
        playerHiddenCardEl.textContent = playerOwnHiddenCard !== null ? playerOwnHiddenCard : '?';
        if(playerOwnHiddenCard !== null) playerHiddenCardEl.style.backgroundColor = '#fff';
        
        cpuHiddenCardEl.textContent = cpuOwnHiddenCard !== null ? cpuOwnHiddenCard : '?';
        if(cpuOwnHiddenCard !== null) cpuHiddenCardEl.style.backgroundColor = '#fff';
    }

    // --- 메인 이벤트 리스너 ---
    startNextButton.addEventListener('click', () => {
        if (gamePhase === 'initial' || gamePhase === 'gameOver') {
            startGame();
        } else if (gamePhase === 'roundOver') {
            if (deck.length <= 2) { // 다음 상태가 게임 종료인지 확인
                endGame();
            } else {
                nextRound();
            }
        }
        // 'roundInProgress' 상태에서는 버튼이 비활성화되어 클릭 이벤트가 발생하지 않음
    });

    playerGuessButtons.forEach(button => {
        button.addEventListener('click', handlePlayerGuess);
    });

    // --- 초기화 ---
    function initializeGameUI() {
        enableGuessButtons(false);
        updateUIDisplay(); // 초기 값 (점수 0, 카드 60 등) 표시
        resetCardVisuals();
        startNextButton.textContent = '게임 시작';
        startNextButton.disabled = false;
        gamePhase = 'initial';
    }

    initializeGameUI(); // 게임 UI 초기 설정
});