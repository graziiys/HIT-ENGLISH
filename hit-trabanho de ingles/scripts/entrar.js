import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getDatabase, ref, set, get } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";

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

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

document.addEventListener('DOMContentLoaded', () => {
    const gamePinInput = document.getElementById('gamePin');

    document.getElementById('joinGameButton').onclick = () => {
        joinGame(gamePinInput.value);
    };
});

function joinGame(gamePin) {
    if (gamePin) { // Verifica se o campo do PIN está preenchido
        // Referência para a sala no Firebase
        const waitingRoomRef = ref(db, `quizzes/${gamePin}`);

        // Obtem os dados da sala
        get(waitingRoomRef)
            .then((snapshot) => {
                if (snapshot.exists()) {
                            window.location.href = `jogo.html?pin=${gamePin}`; // Redireciona para a página do jogo
                        
                } else {
                    alert('A sala com o PIN fornecido não existe.');
                }
            })
            .catch((error) => {
                alert('Erro ao acessar a sala: ' + error.message);
            });
    } else {
        alert('Por favor, preencha o campo do PIN.');
    }
}
