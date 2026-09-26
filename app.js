// =========================
// Helpers
// =========================

function $(id) {
    return document.getElementById(id);
}

// =========================
// Globale variabelen
// =========================

let cards = [];
let currentCard = null;

let good = 0;
let bad = 0;

let waitingForNext = false;

const seenWords = new Set();

// =========================
// Donkere modus
// =========================

$("themeBtn").addEventListener("click", () => {
    document.body.classList.toggle("dark");
});

// =========================
// CSV laden
// =========================

$("csvFile").addEventListener("change", loadCSV);

function loadCSV(event) {

    const file = event.target.files[0];

    if (!file) {
        return;
    }

    const reader = new FileReader();

    reader.onload = function (e) {

        cards = parseCSV(e.target.result);

        good = 0;
        bad = 0;

        seenWords.clear();

        updateStats();
        updateCoverage();

        if (cards.length > 0) {
            nextQuestion();
        } else {
            alert("Geen geldige kaarten gevonden.");
        }

    };

    reader.readAsText(file, "UTF-8");
}

// =========================
// CSV parser
// =========================

function parseCSV(text) {

    const lines = text.trim().split(/\r?\n/);

    if (lines.length < 2) {
        return [];
    }

    const separator =
        lines[0].includes(";")
            ? ";"
            : ",";

    const result = [];

    for (let i = 1; i < lines.length; i++) {

        const line = lines[i].trim();

        if (!line) {
            continue;
        }

        const parts = line.split(separator);

        if (parts.length < 2) {
            continue;
        }

        result.push({
            vraag: parts[0].replaceAll('"', '').trim(),
            antwoord: parts.slice(1).join(separator).replaceAll('"', '').trim(),
            correct: 0,
            fout: 0
        });
    }

    return result;
}

// =========================
// Mode wijzigen
// =========================

$("mode").addEventListener("change", () => {

    waitingForNext = false;

    if (cards.length > 0) {
        nextQuestion();
    }

});

// =========================
// Kaart kiezen
// =========================

function chooseCard() {

    if (cards.length === 0) {
        return null;
    }

    const sorted = [...cards].sort((a, b) => {

        const scoreA =
            a.fout - a.correct;

        const scoreB =
            b.fout - b.correct;

        return scoreB - scoreA;

    });

    const maxCards =
        Math.min(
            10,
            sorted.length
        );

    return sorted[
        Math.floor(
            Math.random() * maxCards
        )
        ];
}

// =========================
// Nieuwe vraag
// =========================

function nextQuestion() {

    currentCard = chooseCard();

    if (!currentCard) {
        return;
    }

    waitingForNext = false;

    seenWords.add(
        currentCard.vraag
    );

    updateCoverage();

    renderQuestion();
}

// =========================
// Vraag tonen
// =========================

function renderQuestion() {

    $("answers").innerHTML = "";

    if (
        $("mode").value === "mc"
    ) {

        renderMultipleChoice();

    } else {

        renderTypingQuestion();

    }
}

// =========================
// Meerkeuze
// =========================

function renderMultipleChoice() {

    $("question").textContent =
        currentCard.vraag;

    const options = [
        currentCard.antwoord
    ];

    while (
        options.length < 4 &&
        cards.length > 3
        ) {

        const answer =
            cards[
                Math.floor(
                    Math.random() *
                    cards.length
                )
                ].antwoord;

        if (
            !options.includes(
                answer
            )
        ) {

            options.push(
                answer
            );

        }
    }

    options.sort(
        () => Math.random() - 0.5
    );

    options.forEach(option => {

        const button =
            document.createElement(
                "button"
            );

        button.className =
            "option-btn";

        button.textContent =
            option;

        button.addEventListener(
            "click",
            () => {
                checkAnswer(option);
            }
        );

        $("answers").appendChild(
            button
        );

    });
}

// =========================
// Typvraag
// =========================

function renderTypingQuestion() {

    let expected;

    if (
        Math.random() < 0.5
    ) {

        $("question").textContent =
            currentCard.vraag;

        expected =
            currentCard.antwoord;

    } else {

        $("question").textContent =
            currentCard.antwoord;

        expected =
            currentCard.vraag;
    }

    currentCard.expected =
        expected;

    const input =
        document.createElement(
            "input"
        );

    input.className =
        "answer-input";

    input.placeholder =
        "Typ antwoord";

    input.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Enter"
            ) {

                if (
                    waitingForNext
                ) {

                    nextQuestion();

                } else {

                    checkAnswer(
                        input.value
                    );

                }

            }

        }
    );

    $("answers").appendChild(
        input
    );

    input.focus();
}

// =========================
// Antwoord controleren
// =========================

function checkAnswer(answer) {

    let expected;

    if (
        $("mode").value === "mc"
    ) {

        expected =
            currentCard.antwoord;

    } else {

        expected =
            currentCard.expected;

    }

    let correct = false;

    if (
        $("mode").value === "mc"
    ) {

        correct =
            answer === expected;

    } else {

        if (
            $("caseSensitive").checked
        ) {

            correct =
                (answer || "").trim()
                ===
                (expected || "").trim();

        } else {

            correct =
                (answer || "")
                    .trim()
                    .toLowerCase()
                ===
                (expected || "")
                    .trim()
                    .toLowerCase();

        }

    }

    const feedback =
        $("feedback");

    feedback.classList.remove(
        "hidden"
    );

    if (correct) {

        currentCard.correct++;
        good++;

        feedback.className =
            "feedback correct";

        feedback.innerHTML =
            "✅ Correct";

    } else {

        currentCard.fout++;
        bad++;

        feedback.className =
            "feedback wrong";

        feedback.innerHTML =
            `
            ❌ Fout<br><br>
            Jouw antwoord:
            <b>${answer || ""}</b>
            <br><br>
            Correct antwoord:
            <b>${expected}</b>
            `;
    }

    updateStats();

    waitingForNext = true;

    if (
        $("mode").value === "mc"
    ) {

        setTimeout(
            nextQuestion,
            1200
        );

    }
}

// =========================
// Statistieken
// =========================

function updateStats() {

    $("good").textContent =
        good;

    $("bad").textContent =
        bad;

    const total =
        good + bad;

    $("pct").textContent =
        total === 0
            ? "0%"
            : Math.round(
            (good / total) * 100
        ) + "%";
}

// =========================
// Voortgang
// =========================

function updateCoverage() {

    let percentage = 0;

    if (
        cards.length > 0
    ) {

        percentage =
            (
                seenWords.size /
                cards.length
            ) * 100;

    }

    $("bar").style.width =
        percentage + "%";

    $("coverage").textContent =
        `${seenWords.size} / ${cards.length} woorden gezien`;
}

// =========================
// Moeilijke woorden exporteren
// =========================

$("exportBtn").addEventListener(
    "click",
    exportDifficultWords
);

function exportDifficultWords() {

    const difficultCards =
        cards.filter(card =>
            card.fout >= 2 ||
            card.fout > card.correct
        );

    let csv =
        "vraag,antwoord\n";

    difficultCards.forEach(card => {

        csv +=
            `"${card.vraag}","${card.antwoord}"\n`;

    });

    const blob =
        new Blob(
            [csv],
            {
                type: "text/csv"
            }
        );

    const link =
        document.createElement(
            "a"
        );

    link.href =
        URL.createObjectURL(
            blob
        );

    link.download =
        "moeilijke_woorden.csv";

    link.click();
}