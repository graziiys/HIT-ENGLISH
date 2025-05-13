import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getDatabase, ref, onValue, set, get } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyA_YbgsZqbJRxd7m3cbeJZzmKywctrGLps",
    authDomain: "ahf-banco-de-dados.firebaseapp.com",
    databaseURL: "https://ahf-banco-de-dados-default-rtdb.firebaseio.com",
    projectId: "ahf-banco-de-dados",
    storageBucket: "ahf-banco-de-dados.appspot.com",
    messagingSenderId: "826655126765",
    appId: "1:826655126765:web:ccf2027c0ee964816f88e4",
    measurementId: "G-01R115DGS7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Get game pin from URL parameters
const urlParams = new URLSearchParams(window.location.search);
const gamePin = urlParams.get('pin');

// Firebase references
const waitingRoomRef = ref(db, `waitingRoom/${gamePin}`);
const quizRef = ref(db, `quizzes/${gamePin}`);

// Global variables
let currentQuestionIndex = 0;
let quizData;
let playerScores = {};
let responses = {};
let totalPlayers = 0;
let timer;
let questionStartTime;

// References for input field and buttons
const playerNameInput = document.getElementById('playerNameInput');
const startButton = document.getElementById('startButton');
const readyButton = document.getElementById('readyButton');

// Track if the player has already joined
let hasJoined = false;

// Handle player joining the waiting room
startButton.onclick = () => {
    const playerName = playerNameInput.value.trim();
    if (!playerName) {
        alert("Player name is required!");
        return;
    }

    if (!hasJoined) {
        // Add player to the waiting room
        set(ref(db, `waitingRoom/${gamePin}/${playerName}`), { name: playerName, ready: false });

        // Update state to indicate the player has joined
        hasJoined = true;

        // Hide input container and show waiting room
        document.getElementById('nameInputContainer').style.display = 'none';
        document.getElementById('waitingRoom').style.display = 'block';
        readyButton.style.display = 'block';
    } else {
        alert("You are already in the room!");
    }
};

// Mark the player as ready
readyButton.onclick = () => {
    const playerName = playerNameInput.value.trim();
    if (playerName) {
        set(ref(db, `waitingRoom/${gamePin}/${playerName}`), { name: playerName, ready: true });
    }
};

// Remove player from the waiting room when leaving
function removePlayerFromWaitingRoom() {
    const playerName = playerNameInput.value.trim();
    if (playerName) {
        set(ref(db, `waitingRoom/${gamePin}/${playerName}`), null);
    }
}

// Listen for changes in the waiting room
onValue(waitingRoomRef, (snapshot) => {
    const players = snapshot.val();
    if (players) {
        totalPlayers = Object.keys(players).length;
        const playerList = Object.keys(players).map(key => {
            const playerName = players[key].name || "Unknown Player"; 
            return `${playerName} - ${players[key].ready ? "Ready" : "Not Ready"}`; 
        }).join('<br>');
        document.getElementById('waitingRoom').innerHTML = `<h3>Waiting for players:</h3>${playerList}`;
        
        const allReady = Object.values(players).every(player => player.ready);
        if (allReady) {
            startQuiz();
        }
    } else {
        document.getElementById('waitingRoom').innerHTML = '<h3>Waiting for players...</h3>';
    }
});

// Start the quiz with a countdown
function startQuiz() {
    document.getElementById('waitingRoom').innerHTML = "<h3>Starting the quiz in 5 seconds...</h3>";
    let countdown = 5;
    const countdownInterval = setInterval(() => {
        countdown--;
        document.getElementById('waitingRoom').innerHTML = `<h3>Starting the quiz in ${countdown} seconds...</h3>`;
        if (countdown <= 0) {
            clearInterval(countdownInterval);
            loadQuizData();
        }
    }, 1000);
}

// Load quiz data
function loadQuizData() {
    onValue(quizRef, (snapshot) => {
        if (snapshot.exists()) {
            quizData = snapshot.val();
            document.getElementById('waitingRoom').innerHTML = ""; 
            document.getElementById('quizTitle').innerText = quizData.title;
            showQuestion(quizData.questions[currentQuestionIndex]);
        } else {
            alert('Quiz not found!');
            window.location.href = 'entrar.html'; // Redirect if quiz is not found
        }
    });
}

// Show the current question
function showQuestion(question) {
    document.getElementById('questionDisplay').innerText = question.question;
    const optionsContainer = document.getElementById('optionsContainer');
    optionsContainer.innerHTML = '';

    question.options.forEach((option, index) => {
        const button = document.createElement('button');
        button.innerText = option;
        button.onclick = () => handleResponse(index, question.correctIndex);
        optionsContainer.appendChild(button);
    });

    questionStartTime = Date.now(); 
    startTimer(question); 
}

// Handle player's response
function handleResponse(selectedIndex, correctIndex) {
    const responseTime = Date.now() - questionStartTime; 
    const playerName = playerNameInput.value.trim(); 
    responses[playerName] = selectedIndex; 
    let score = 0;

    if (selectedIndex === correctIndex) { // Score for correct answer
        score += 1; 
    }

    if (responseTime < 5000 && selectedIndex === correctIndex) { // Score for fast response, but only if the answer is correct
        score += 10; 
    }

    playerScores[playerName] = (playerScores[playerName] || 0) + score; 
    updateScoreInFirebase(); 

    // Check if all players have responded
    if (Object.keys(responses).length === totalPlayers) { 
        clearTimeout(timer); 
        checkAnswers(correctIndex); 
    }
}

// Update score in Firebase
function updateScoreInFirebase() {
    const playerName = playerNameInput.value.trim();
    set(ref(db, `scores/${gamePin}/${playerName}`), playerScores[playerName]);
}

// Start timer for the question
function startTimer(question) {
    let timeRemaining = 15; 
    document.getElementById('feedback').innerText = `Time remaining: ${timeRemaining} seconds`;

    timer = setInterval(() => {
        timeRemaining--;

        if (timeRemaining < 0) { 
            clearInterval(timer); 
            checkAnswers(question.correctIndex); 
        } else {
            document.getElementById('feedback').innerText = `Time remaining: ${timeRemaining} seconds`;
        }
    }, 1000);
}

// Check answers and provide feedback
function checkAnswers(correctIndex) {
    let feedbackText = '';
    for (const player in responses) {
        feedbackText += (responses[player] === correctIndex) 
            ? `${player} answered correctly!<br>` 
            : `${player} answered incorrectly. The correct answer was: ${quizData.questions[currentQuestionIndex].options[correctIndex]}<br>`;
    }
    document.getElementById('feedback').innerHTML = feedbackText; 

    currentQuestionIndex++;

    if (currentQuestionIndex < quizData.questions.length) {
        setTimeout(() => {
            responses = {}; 
            showQuestion(quizData.questions[currentQuestionIndex]);
            document.getElementById('feedback').innerText = '';
        }, 2000);
    } else {
        setTimeout(endQuiz, 2000);
    }
}

// Load scores from Firebase and display final scores
function loadScoresFromFirebase() {
    const scoresRef = ref(db, `scores/${gamePin}`);
    get(scoresRef)
        .then(snapshot => {
            if (snapshot.exists()) {
                playerScores = {};
                snapshot.forEach(childSnapshot => {
                    const playerName = childSnapshot.key;
                    const score = childSnapshot.val();
                    playerScores[playerName] = score;
                });
                showFinalScore();
            } else {
                console.log("No scores found.");
            }
        })
        .catch(error => {
            console.error("Error loading scores: ", error);
        });
}

// Display final scores
function showFinalScore() {
    const feedbackContainer = document.getElementById('feedback');
    feedbackContainer.innerHTML = `<h2>Quiz Over!</h2>`;
    document.getElementById('questionDisplay').innerText = '';
    document.getElementById('optionsContainer').innerHTML = '';

    // Sort scores and display them
    const sortedScores = Object.entries(playerScores).sort((a, b) => b[1] - a[1]);
    let scoreDisplay = '<h3>Final Scores:</h3><ul>';
    sortedScores.forEach(([player, score]) => {
        scoreDisplay += `<li>${player} - ${score} points</li>`;
    });
    scoreDisplay += '</ul>';
    feedbackContainer.innerHTML += scoreDisplay;
}



// Clear scores from Firebase
function clearScoresFromFirebase() {
    const scoresRef = ref(db, `scores/${gamePin}`);
    set(scoresRef, null)
        .then(() => {
            console.log("Scores cleared successfully.");
        })
        .catch(error => {
            console.error("Error clearing scores: ", error);
        });
}

// End the quiz and clear scores
function endQuiz() {
    loadScoresFromFirebase(); // Load scores to display final results
    setTimeout(clearScoresFromFirebase, 4000); // Clear scores from the database after 10 seconds
}



// Cleanup when leaving the page
window.onbeforeunload = removePlayerFromWaitingRoom;
