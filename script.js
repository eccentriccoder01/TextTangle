$(document).ready(function () {
    let secretWord = "";
    let maxTries = "";
    let chancesLeft = maxTries;
    let guessedWords = [];
  
    const $wordContainer = $("#word-container");
    const $guessForm = $("#guess-form");
    const $guessInput = $("#guess-input");
    const $submitButton = $("#submitButton");
    const $chancesSpan = $("#chances");
    const $lengthSpan = $("#length");
    const $feedbackDiv = $("#feedback");
    const $historyList = $("#history-list");
  
    const $startsound = $("#startsound");
    const $endsuccesssound = $("#endsuccesssound");
    const $endfailsound = $("#endfailsound");
  
    $("#start-button").on("click", function () {
      $(this).prop("disabled", true); // Disable the Start Game button
      $submitButton.prop("disabled", false); // Enable the Submit button
      fetchRandomWord(); // Start the game by fetching the random word
    });
  
    // Calling the API
    function fetchRandomWord() {
      $startsound[0].play();
      fetch("https://random-word-api.vercel.app/api?words=1&length=5", {
        method: "GET",
      })
        .then((response) => response.json())
        .then((data) => {
          console.log(data);
          secretWord = data[0].toUpperCase();
          maxTries = secretWord.length + 1;
          chancesLeft = maxTries;
          $chancesSpan.text(chancesLeft);
          $lengthSpan.text(secretWord.length);
          $guessInput.attr("maxlength", secretWord.length);
          renderWordContainers();
          console.log("Secret Word: ", secretWord);
        })
        .catch((error) => {
          console.error("Error: ", error.message);
        });
    }
  
    function renderWordContainers() {
      $wordContainer.empty();
      for (let i = 0; i < secretWord.length; i++) {
        $wordContainer.append(`<span class="letter" id="letter-${i}">?</span>`);
      }
    }
  
    function checkWordle(guess) {
      const originalWord = secretWord; // Store the original secret word
  
      let secretLetters = {};
      let guessLetters = {};
      let feedback = guess.split("").map((letter, index) => {
        const correctLetter = originalWord[index];
        if (letter === correctLetter) {
          return "C";
        } else {
          // Count letters in the secret word and guessed word
          secretLetters[correctLetter] = (secretLetters[correctLetter] || 0) + 1;
          guessLetters[letter] = (guessLetters[letter] || 0) + 1;
        }
      });
  
      // Check for existing letters with matching counts
      feedback.forEach((result, index) => {
        const letter = guess[index];
        if (
          result !== "C" &&
          secretLetters[letter] > 0 &&
          guessLetters[letter] > 0
        ) {
          feedback[index] = "E";
          secretLetters[letter]--;
        } else if (result !== "C") {
          feedback[index] = "W";
        }
      });
  
      console.log("feedback");
      console.log(feedback);
      console.log(secretLetters);
      console.log(guessLetters);
  
      return feedback;
    }
  
    function showFeedback(feedback) {
      feedback.forEach((result, index) => {
        const $letter = $(`#letter-${index}`);
        $letter.removeClass("correct exists wrong");
        switch (result) {
          case "C":
            $letter.addClass("correct");
            break;
          case "E":
            $letter.addClass("exists");
            break;
          case "W":
            $letter.addClass("wrong");
            break;
          default:
            break;
        }
      });
    }
  
    function renderHistory() {
      $historyList.empty();
      guessedWords.forEach((word, index) => {
        const feedback = checkWordle(word);
        let wordHtml = "";
        word.split("").forEach((letter, index) => {
          let letterClass = "";
          switch (feedback[index]) {
            case "C":
              letterClass = "correct";
              break;
            case "E":
              letterClass = "exists";
              break;
            case "W":
              letterClass = "wrong";
              break;
            default:
              break;
          }
          wordHtml += `<span class="letter ${letterClass}">${letter}</span>`;
        });
        const wordClass = feedback.every((val) => val === "C")
          ? "correct-word"
          : "incorrect-word";
        $historyList.append(`<li class="${wordClass}">${wordHtml}</li>`);
      });
    }
  
    $guessForm.on("submit", function (event) {
      event.preventDefault();
      const guess = $guessInput.val().toUpperCase();
      if (guess.length === secretWord.length) {
        const feedback = checkWordle(guess);
        showFeedback(feedback);
        guessedWords.push(guess);
        renderHistory();
        chancesLeft--;
        $chancesSpan.text(chancesLeft);
  
        // Condition for game over
        if (feedback.every((val) => val === "C") || chancesLeft === 0) {
          showResult(feedback);
        }
      } else {
        alert(`Please enter a ${secretWord.length}-letter word.`);
      }
      $guessInput.val("");
    });
  
    // Shows result on game over
    function showResult(feedback) {
      if (feedback.every((val) => val === "C")) {
        $endsuccesssound[0].play();
        const $resultDiv = $(
          '<div class="result-message">Congratulations! You guessed the word correctly.</div>'
        );
        $resultDiv.hide().appendTo(".container").fadeIn(1000);
      } else {
        $endfailsound[0].play();
        const $resultDiv = $(
          '<div class="result-message">Sorry, you ran out of chances. The correct word was ' +
            secretWord +
            ".</div>"
        );
        $resultDiv.hide().appendTo(".container").fadeIn(1000);
      }
  
      // Disable form input and submit button after the game is over
      console.log($submitButton);
      console.log($guessInput);
  
      $guessInput.prop("disabled", true);
      $submitButton.prop("disabled", true);
      $guessForm.off("submit");
  
      // Clear chances and feedback after the game is over
      $chancesSpan.text("0");
      $feedbackDiv.empty();
    }
  
    function reloadPage() {
      location.reload();
    }
  
    // Add event listener to the reload button
    $("#reload-button").on("click", reloadPage);
  });
  