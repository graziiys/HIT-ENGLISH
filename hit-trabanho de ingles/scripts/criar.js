import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getDatabase, ref, push, set } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";

const firebaseConfig = {
    apiKey: "API_KEY",
    authDomain: "ahf-banco-de-dados.firebaseapp.com",
    databaseURL: "https://ahf-banco-de-dados-default-rtdb.firebaseio.com",
    projectId: "ahf-banco-de-dados",
    storageBucket: "ahf-banco-de-dados.appspot.com",
    messagingSenderId: "826655126765",
    appId: "1:826655126765:web:ccf2027c0ee964816f88e4",
    measurementId: "G-01R115DGS7"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let questions = [];

document.getElementById('addQuestionButton').addEventListener('click', addQuestion);
document.getElementById('saveQuizButton').addEventListener('click', saveQuiz);

function addQuestion() {
    const questionText = document.getElementById('question').value;
    const options = [
        document.getElementById('option1').value,
        document.getElementById('option2').value,
        document.getElementById('option3').value,
        document.getElementById('option4').value
    ];
    const correctOption = document.querySelector('input[name="correct"]:checked');

    if (!questionText || options.some(opt => !opt) || !correctOption) {
        alert("Por favor, preencha todos os campos e selecione a resposta correta.");
        return;
    }

    const question = {
        question: questionText,
        options,
        correctIndex: parseInt(correctOption.value)
    };

    questions.push(question);
    displayQuestions();

    // Limpar os campos
    document.getElementById('question').value = '';
    options.forEach((_, index) => document.getElementById(`option${index + 1}`).value = '');
    correctOption.checked = false;
}

function displayQuestions() {
    const questionList = document.getElementById('questionsDisplay');
    questionList.innerHTML = '';

    questions.forEach((q, index) => {
        const questionItem = document.createElement('li');
        questionItem.textContent = `Pergunta ${index + 1}: ${q.question}`;
        
        const optionsList = document.createElement('ul');
        q.options.forEach((option, idx) => {
            const optionItem = document.createElement('li');
            optionItem.textContent = `${option} ${idx === q.correctIndex ? "(Correta)" : ""}`;
            optionsList.appendChild(optionItem);
        });

        questionItem.appendChild(optionsList);
        questionList.appendChild(questionItem);
    });
}

function saveQuiz() {
    const title = document.getElementById('title').value;
    const description = document.getElementById('description').value;

    if (!title || !description || questions.length === 0) {
        alert("Por favor, preencha todas as informações do quiz e adicione pelo menos uma pergunta.");
        return;
    }

    const quizData = { title, description, questions };

    const newQuizRef = push(ref(db, 'quizzes'));
    set(newQuizRef, quizData)
        .then(() => {
            alert('Quiz salvo com sucesso! PIN do jogo: ' + newQuizRef.key);
            // Limpar dados do quiz
            document.getElementById('title').value = '';
            document.getElementById('description').value = '';
            questions = [];
            displayQuestions();
        })
        .catch((error) => {
            console.error('Erro ao salvar o quiz: ', error);
            alert('Erro ao salvar o quiz. Tente novamente.');
        });
}
