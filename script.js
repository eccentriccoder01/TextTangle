$(document).ready(function () {
    let letterFrequency = {};
    let secretWord = "";
    let maxTries = 0;
    let chancesLeft = 0;
    let guessedWords = [];
    let useSound = true;
    let colorblindMode = false;
    let currentLength = 5;
    let dailyMode = true;
    let hintUsed = false;
    let timer = null;
    let timeLeft = 180;
    let typeFreeMode = false;
    let typedGuess = "";

    const $wordContainer = $("#word-container");
    const $guessForm = $("#guess-form");
    const $guessInput = $("#guess-input");
    const $submitButton = $("#submitButton");
    const $chancesSpan = $("#chances");
    const $lengthSpan = $("#length");
    const $feedbackDiv = $("#feedback");
    const $historyList = $("#history-list");
    const $startsound = $("#startsound")[0];
    const $endsuccesssound = $("#endsuccesssound")[0];
    const $endfailsound = $("#endfailsound")[0];

    const $statsDiv = $("#stats");
    const $quoteDiv = $("#quote");

    const quotes = [
        "Words are the clothing of thoughts.",
        "A good word is like a good tree.",
        "Words are, of course, the most powerful drug.",
        "Better than a thousand hollow words is one that brings peace.",
        "Words may show a man's wit, but actions his meaning."
    ];

    const localWords = {
        4: ["code", "game", "play", "word"],
        5: ["logic", "apple", "guess", "piano"],
        6: ["planet", "rocket", "wizard", "friend"],
        7: ["journey", "freedom", "general", "diamond"]
    };

    function getDailyWord(length) {
        const seed = new Date().toDateString().split("").reduce((a, c) => a + c.charCodeAt(0), 0);
        const list = localWords[length];
        return list[seed % list.length].toUpperCase();
    }

    function updateStats(win = false) {
        let stats = JSON.parse(localStorage.getItem("textangleStats") || "{}");
        stats.total = (stats.total || 0) + 1;
        if (win) {
            stats.win = (stats.win || 0) + 1;
            stats.streak = (stats.streak || 0) + 1;
        } else {
            stats.streak = 0;
        }
        stats.best = Math.max(stats.best || 0, stats.streak || 0);
        localStorage.setItem("textangleStats", JSON.stringify(stats));
        showStats();
    }

    function showStats() {
        const stats = JSON.parse(localStorage.getItem("textangleStats") || "{}");
        const winP = stats.total ? ((stats.win || 0) / stats.total * 100).toFixed(1) : 0;
        let fire = stats.streak >= 3 ? ' <span class="streak-hot">🔥</span>' : '';
        $statsDiv.html(
            `<p>Games: ${stats.total || 0} | Wins: ${stats.win || 0} | Win%: ${winP}% | Streak: ${stats.streak || 0}${fire} | Best: ${stats.best || 0}</p>`
        );
    }

    function showQuote() {
        const index = new Date().getDate() % quotes.length;
        $quoteDiv.text("💡 " + quotes[index]);
    }

    function renderWordContainers() {
        $wordContainer.empty();
        for (let i = 0; i < secretWord.length; i++) {
            $wordContainer.append(`<span class="letter" id="letter-${i}">?</span>`);
        }
    }

    function checkWordle(guess) {
        let feedback = Array(secretWord.length).fill("W");
        let secretUsed = Array(secretWord.length).fill(false);

        for (let i = 0; i < guess.length; i++) {
            if (guess[i] === secretWord[i]) {
                feedback[i] = "C";
                secretUsed[i] = true;
            }
        }

        for (let i = 0; i < guess.length; i++) {
            if (feedback[i] === "C") continue;
            for (let j = 0; j < secretWord.length; j++) {
                if (!secretUsed[j] && guess[i] === secretWord[j]) {
                    feedback[i] = "E";
                    secretUsed[j] = true;
                    break;
                }
            }
        }
        return feedback;
    }

    function showFeedback(feedback) {
        feedback.forEach((val, i) => {
            const $letter = $(`#letter-${i}`);
            $letter.removeClass("correct exists wrong animate");

            setTimeout(() => {
                if (colorblindMode) $letter.text(val);
                $letter.addClass(val === "C" ? "correct" : val === "E" ? "exists" : "wrong");
                $letter.addClass("animate");
            }, i * 200); // stagger delay per letter
        });
    }

    function renderHistory() {
        $historyList.empty();
        guessedWords.forEach((word) => {
            const feedback = checkWordle(word);
            let wordHtml = "";
            word.split("").forEach((letter, i) => {
                const fb = feedback[i];
                const cls = fb === "C" ? "correct" : fb === "E" ? "exists" : "wrong";
                const txt = colorblindMode ? fb : letter;
                wordHtml += `<span class="letter ${cls}">${txt}</span>`;
            });
            $historyList.append(`<li>${wordHtml}</li>`);
        });
    }

    function fetchWord(length, daily = false) {
    const wordList = ["apple", "brave", "crazy", "drink", "eagle", "flame", "glide", "hound", "ivory", "joker"];
    if (daily) {
        const date = new Date().toDateString();
        const seed = date.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
        secretWord = wordList[seed % wordList.length].toUpperCase();
        startGame(); // directly start game
    } else {
        fetch(`https://random-word-api.vercel.app/api?words=1&length=${length}`)
            .then(res => res.json())
            .then(data => {
                secretWord = data[0].toUpperCase();
                startGame();
            })
            .catch(err => {
                console.error("Word fetch failed, fallback to static list.");
                secretWord = wordList[Math.floor(Math.random() * wordList.length)].toUpperCase();
                startGame();
            });
            }
        }
    $("#feedback").html("Colorblind Mode: C = Correct, E = Exists, W = Wrong");

    function initKeyboard() {
        const letters = "QWERTYUIOPASDFGHJKLZXCVBNM".split("");
        letters.forEach(letter => {
            $(`#key-${letter}`).removeClass("correct exists wrong");
        });
    }
    function startGame() {
        initKeyboard(); // Reset keyboard colors
        $("#keyboard").removeClass("disabled");
        maxTries = secretWord.length + 1;
        chancesLeft = maxTries;
        guessedWords = [];
        $guessInput.attr("maxlength", secretWord.length);
        $submitButton.prop("disabled", false);
        $guessInput.prop("disabled", false);
        $chancesSpan.text(chancesLeft);
        $lengthSpan.text(secretWord.length);
        renderWordContainers();
        showStats();
        showQuote();
        if (useSound) $startsound.play();
        hintUsed = false;
        $("#hint-button").prop("disabled", false).text("💡 Hint (1 use)");
        letterFrequency = {}; // reset heatmap data
        $("#heatmap-bars").empty();
        timeLeft = 180;
        $("#timer").text(timeLeft + "s");

        if (timer) clearInterval(timer);

        timer = setInterval(() => {
            timeLeft--;
            $("#timer").text(timeLeft + "s");
            if (timeLeft <= 0) {
                clearInterval(timer);
                $guessInput.prop("disabled", true);
                $submitButton.prop("disabled", true);
                updateStats(false);
                $feedbackDiv.html(`<p class="result-message">⌛ Time's up! Word was ${secretWord}</p>`);
                endGame();
            }
        }, 1000);
    }

    $("#custom-word-mode").click(function () {
        $("#custom-word-modal").show();
    });

    $("#custom-word-submit").click(function () {
        const word = $("#custom-word-input").val().toUpperCase();
        if (!/^[A-Z]{4,7}$/.test(word)) return alert("Enter a valid 4–7 letter word.");
        secretWord = word;
        currentLength = word.length;
        $("#custom-word-modal").hide();
        startGame();
    });

    $("#custom-word-cancel").click(function () {
        $("#custom-word-input").val("");
        $("#custom-word-modal").hide();
    });

    $("#toggle-typefree").click(function () {
        typeFreeMode = !typeFreeMode;
        $(this).text(`Type-Free Mode: ${typeFreeMode ? "ON" : "OFF"}`);
        if (typeFreeMode) {
            $guessInput.prop("disabled", true);
        } else {
            $guessInput.prop("disabled", false);
            $guessInput.val("");
        }
        typedGuess = "";
    });
    $(document).on("click", ".key", function () {
        const key = $(this).text();

        if (typeFreeMode) {
            if (key === "↩️") {
                $guessInput.val(typedGuess);
                $guessForm.submit();
            } else if (key === "←") {
                typedGuess = typedGuess.slice(0, -1);
            } else if (typedGuess.length < secretWord.length) {
                typedGuess += key.toUpperCase();
            }
            $guessInput.val(typedGuess);
        } else {
            let currentVal = $guessInput.val();
            if (key === "↩️") {
                $guessForm.submit();
            } else if (key === "←") {
                $guessInput.val(currentVal.slice(0, -1));
            } else if (currentVal.length < secretWord.length) {
                $guessInput.val(currentVal + key.toUpperCase());
            }
        }
    });

    $guessInput.focus();

    function updateKeyboardColors(guess, feedback) {
        guess.split("").forEach((letter, i) => {
            const fb = feedback[i];
            const $key = $(`#key-${letter}`);
            if (!$key.length) return;

            if (fb === "C") $key.removeClass("exists wrong").addClass("correct");
            else if (fb === "E" && !$key.hasClass("correct")) $key.removeClass("wrong").addClass("exists");
            else if (!$key.hasClass("correct") && !$key.hasClass("exists")) $key.addClass("wrong");
        });
    }

    $("#hint-button").click(function () {
    if (hintUsed) return;
    for (let i = 0; i < secretWord.length; i++) {
        if ($(`#letter-${i}`).text() === "?") {
            $(`#letter-${i}`).text(secretWord[i]).css("background-color", "#ffa502");
            break;
        }
    }
    hintUsed = true;
    $(this).prop("disabled", true).text("✅ Hint Used");
    });

    $("#start-button").click(function () {
        $(this).prop("disabled", true);
        fetchWord(currentLength, dailyMode);
        $("#mode-info").text(`Mode: ${dailyMode ? "Daily Challenge" : "Random Word"}`);
    });

    $guessForm.submit(function (e) {
        e.preventDefault();
        const guess = $guessInput.val().toUpperCase();
        if (guess.length !== secretWord.length) return alert(`Enter ${secretWord.length} letters`);
        const fb = checkWordle(guess);
        guessedWords.push(guess);
        guess.split("").forEach(letter => {
            letterFrequency[letter] = (letterFrequency[letter] || 0) + 1;
        });
        showFeedback(fb);
        renderHistory();
        updateKeyboardColors(guess, fb);
        chancesLeft--;
        $chancesSpan.text(chancesLeft);

        if (fb.every(v => v === "C")) {
            if (useSound) $endsuccesssound.play();
            updateStats(true);
            $feedbackDiv.html(`<p class="result-message">🎉 You got it!</p>`);

            // Confetti Trigger 🎉
            if (typeof confetti === "function") {
                confetti({
                    particleCount: 150,
                    spread: 70,
                    origin: { y: 0.6 }
                });
            }

            endGame();
        } else if (chancesLeft === 0) {
            if (useSound) $endfailsound.play();
            updateStats(false);
            $feedbackDiv.html(`<p class="result-message">❌ Out of tries! Word was ${secretWord}</p>`);
            endGame();
        }

        $guessInput.val("");
    });

    function showHeatmap() {
        const $container = $("#heatmap-bars").empty();
        const letters = Object.keys(letterFrequency).sort();
        const max = Math.max(...Object.values(letterFrequency));

        letters.forEach(letter => {
            const count = letterFrequency[letter];
            let level = "low";
            if (count >= max * 0.6) level = "high";
            else if (count >= max * 0.3) level = "mid";

            $container.append(`<div class="heat-bar ${level}">${letter}<br>${count}</div>`);
        });
    }

    function endGame() {
        $guessInput.prop("disabled", true);
        $submitButton.prop("disabled", true);
        $("#hint-button").prop("disabled", true).text("💡 Hint (Used)");
        fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${secretWord.toLowerCase()}`)
        .then(res => res.json())
        .then(data => {
            const def = data[0]?.meanings?.[0]?.definitions?.[0]?.definition || "Definition not found.";
            $("#definition").html(`<strong>📖 ${secretWord}:</strong> ${def}`);
        })
        .catch(() => {
            $("#definition").html(`<strong>📖 ${secretWord}:</strong> Definition not found.`);
        });
        showHeatmap();
        if (timer) clearInterval(timer);
        $("#keyboard").addClass("disabled");
    }

    $("#reload-button").click(() => location.reload());

    $("#toggle-dark").click(() => $("body").toggleClass("dark"));

    $("#word-length-selector").change(function () {
        currentLength = parseInt($(this).val());
    });

    $("#toggle-sound").click(function () {
        useSound = !useSound;
        $(this).text(useSound ? "🔊" : "🔇");
    });

    $("#toggle-colorblind").click(function () {
        colorblindMode = !colorblindMode;
        $(this).find(".toggle-status").text(colorblindMode ? "ON" : "OFF");
    });

    showStats();

    $("#toggle-daily").click(function () {
        dailyMode = !dailyMode;
        $(this).text(`Daily Mode: ${dailyMode ? "ON" : "OFF"}`);
        });
        const difficultySettings = {
        easy: 4,
        medium: 5,
        hard: 6
    };

    $(".difficulty-btn").click(function () {
        const level = $(this).data("level");
        currentLength = difficultySettings[level];
        $("#word-length-selector").val(currentLength); // sync dropdown
        $(".difficulty-btn").removeClass("active");
        $(this).addClass("active");
    });

    $(document).on("keydown", function (e) {
        if (typeFreeMode) {
            e.preventDefault();
        }
    });

    initKeyboard();

});
