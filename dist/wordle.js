var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
import * as fs from 'fs';
import * as readline from 'readline';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import chalk from 'chalk';
var LetterGuessResult;
(function (LetterGuessResult) {
    LetterGuessResult[LetterGuessResult["White"] = 0] = "White";
    LetterGuessResult[LetterGuessResult["Yellow"] = 1] = "Yellow";
    LetterGuessResult[LetterGuessResult["Green"] = 2] = "Green";
    LetterGuessResult[LetterGuessResult["Red"] = 3] = "Red";
})(LetterGuessResult || (LetterGuessResult = {}));
const WORDS_LIST = [];
const initWordsList = async () => {
    var e_1, _a;
    const readStream = fs.createReadStream('data/five_lettered_words.txt');
    const rl = readline.createInterface({
        input: readStream,
        terminal: false,
        crlfDelay: Infinity
    });
    try {
        for (var rl_1 = __asyncValues(rl), rl_1_1; rl_1_1 = await rl_1.next(), !rl_1_1.done;) {
            const word = rl_1_1.value;
            WORDS_LIST.push(word);
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (rl_1_1 && !rl_1_1.done && (_a = rl_1.return)) await _a.call(rl_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
    readStream.close();
    rl.close();
    let currentIndex = WORDS_LIST.length, randomIndex;
    while (currentIndex != 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [WORDS_LIST[currentIndex], WORDS_LIST[randomIndex]] = [WORDS_LIST[randomIndex], WORDS_LIST[currentIndex]];
    }
};
const checkWord = (guess, wordle) => {
    if (!WORDS_LIST.includes(guess))
        throw new Error('Not a word!');
    const wordGuessResult = [
        LetterGuessResult.White,
        LetterGuessResult.White,
        LetterGuessResult.White,
        LetterGuessResult.White,
        LetterGuessResult.White
    ];
    const guessedLetters = guess.split('');
    const wordleLetters = wordle.split('');
    guessedLetters.forEach((letter, index) => {
        if (wordleLetters.includes(letter)) {
            if (wordleLetters[index] === letter) {
                wordGuessResult[index] = LetterGuessResult.Green;
            }
            else {
                wordGuessResult[index] = LetterGuessResult.Yellow;
            }
        }
    });
    sanitizeResult(wordleLetters, guessedLetters, wordGuessResult);
    return wordGuessResult;
};
const sanitizeResult = (wordleLetters, guessedLetters, wordGuessResult) => {
    wordGuessResult.forEach((guess, index) => {
        if (guess === LetterGuessResult.Green) {
            wordleLetters[index] = '_';
            guessedLetters[index] = '_';
        }
    });
    guessedLetters.forEach((letter, index) => {
        if (letter !== '_') {
            if (wordleLetters.includes(letter)) {
                wordleLetters[wordleLetters.indexOf(letter)] = '_';
                guessedLetters[index] = '_';
            }
            else {
                wordGuessResult[index] = LetterGuessResult.White;
            }
        }
    });
};
const formatResult = (guessLetter, letterResult) => {
    let colors = [255, 255, 255];
    if (letterResult === LetterGuessResult.Green) {
        colors = [0, 255, 0];
    }
    else if (letterResult === LetterGuessResult.Yellow) {
        colors = [255, 255, 0];
    }
    else if (letterResult === LetterGuessResult.Red) {
        colors = [255, 0, 0];
    }
    return chalk.rgb(colors[0], colors[1], colors[2]).bold(`${guessLetter.toUpperCase()}\t`);
};
const printGuess = (guess, guessResult) => {
    const guessLetters = guess.split('');
    console.log(`${formatResult(guessLetters[0], guessResult[0])}` +
        `${formatResult(guessLetters[1], guessResult[1])}` +
        `${formatResult(guessLetters[2], guessResult[2])}` +
        `${formatResult(guessLetters[3], guessResult[3])}` +
        `${formatResult(guessLetters[4], guessResult[4])}`);
};
const determineColor = (result) => {
    if (result === LetterGuessResult.Green)
        return '🟩';
    else if (result === LetterGuessResult.Yellow)
        return '🟨';
    else
        return '⬜️';
};
const printGuessDistribution = (guesses) => {
    guesses.forEach((guess) => {
        console.log(`${determineColor(guess[0])}` +
            `${determineColor(guess[1])}` +
            `${determineColor(guess[2])}` +
            `${determineColor(guess[3])}` +
            `${determineColor(guess[4])}`);
    });
};
const printResult = (result) => {
    switch (result[0]) {
        case 1:
            console.log('Lucky Guess!!! 😏');
            break;
        case 2:
            console.log('Genius!!! 😱');
            break;
        case 3:
            console.log('Impressive!!! 🤩');
            break;
        case 4:
            console.log('Nice!!! 😄');
            break;
        case 5:
            console.log('Did ok!!! 😅');
            break;
        case 6:
            console.log('Phew... 😮‍💨');
            break;
        default: {
            console.log('Oh no!!!! You lost... 😵🥴😞😭');
            console.log(printGuess(result[1], [
                LetterGuessResult.Red,
                LetterGuessResult.Red,
                LetterGuessResult.Red,
                LetterGuessResult.Red,
                LetterGuessResult.Red
            ]));
            break;
        }
    }
};
function* runWordle() {
    const wordleWord = WORDS_LIST[Math.floor(Math.random() * WORDS_LIST.length)];
    const usedLetters = new Set();
    const guesses = [];
    let i = 1;
    while (i < 7) {
        const prompt = require('prompt-sync')({ sigint: true });
        try {
            const guess = prompt(`Make your guess #${i}: `);
            const guessResult = checkWord(guess.toLowerCase(), wordleWord);
            guess.split('').forEach(l => usedLetters.add(l.toUpperCase()));
            printGuess(guess, guessResult);
            guesses.push(guessResult);
            console.log(`Used Letters: ${chalk.rgb(0, 255, 255).bold([...usedLetters].join(' '))} `);
            if (guessResult.every(l => l === LetterGuessResult.Green)) {
                break;
            }
            yield guessResult;
        }
        catch (error) {
            console.log(error.message);
            console.log(`Used Letters: ${chalk.rgb(0, 255, 255).bold([...usedLetters].join(' '))} `);
            i--;
        }
        i++;
    }
    printGuessDistribution(guesses);
    printResult([i, wordleWord]);
}
const processGreens = (greens, words) => {
    let reducedWords = words;
    greens.forEach(map => {
        reducedWords = reducedWords.filter(word => word[map.index] === map.letter);
    });
    return reducedWords;
};
const processYellows = (yellows, words) => {
    let reducedWords = words;
    yellows.forEach(map => {
        reducedWords = reducedWords.filter(word => word.includes(map.letter) && word[map.index] !== map.letter);
    });
    return reducedWords;
};
const processWhites = (whites, words, greens, yellows) => {
    let reducedWords = words;
    const isLetterUsed = (letter, array) => array.some(l => l.letter === letter);
    whites.forEach(whiteMap => {
        if (isLetterUsed(whiteMap.letter, greens) || isLetterUsed(whiteMap.letter, yellows)) {
            reducedWords = reducedWords.filter(word => word[whiteMap.index] !== whiteMap.letter);
        }
        else {
            reducedWords = reducedWords.filter(word => !word.includes(whiteMap.letter));
        }
    });
    return reducedWords;
};
const reducePossibleWords = (guessedWord, guessResult, filteredWords) => {
    let reducedWords = filteredWords;
    const greens = [];
    const yellows = [];
    const whites = [];
    guessResult.forEach((l, i) => {
        if (l === LetterGuessResult.Green)
            greens.push({ letter: guessedWord[i], index: i });
        else if (l === LetterGuessResult.Yellow)
            yellows.push({ letter: guessedWord[i], index: i });
        else if (l === LetterGuessResult.White)
            whites.push({ letter: guessedWord[i], index: i });
    });
    reducedWords = processGreens(greens, reducedWords);
    reducedWords = processYellows(yellows, reducedWords);
    reducedWords = processWhites(whites, reducedWords, greens, yellows);
    return reducedWords;
};
const playWordle = async () => {
    await initWordsList();
    const wordleWord = WORDS_LIST[Math.floor(Math.random() * WORDS_LIST.length)];
    const usedLetters = new Set();
    const guesses = [];
    let i = 1;
    while (i < 7) {
        const prompt = require('prompt-sync')({ sigint: true });
        try {
            const guess = prompt(`Make your guess #${i}: `);
            const guessResult = checkWord(guess.toLowerCase(), wordleWord);
            guess.split('').forEach(l => usedLetters.add(l.toUpperCase()));
            printGuess(guess, guessResult);
            guesses.push(guessResult);
            console.log(`Used Letters: ${chalk.rgb(0, 255, 255).bold([...usedLetters].join(' '))} `);
            if (guessResult.every(l => l === LetterGuessResult.Green)) {
                break;
            }
        }
        catch (error) {
            console.log(error.message);
            console.log(`Used Letters: ${chalk.rgb(0, 255, 255).bold([...usedLetters].join(' '))} `);
            i--;
        }
        i++;
    }
    printGuessDistribution(guesses);
    return [i, wordleWord];
};
const solveWordle = async () => {
    var e_2, _a;
    await initWordsList();
    const bestFirstGuesses = ['adieu', 'tears', 'audio', 'canoe', 'roast', 'ratio', 'arise', 'tares', 'stare'];
    let wordleGuess = bestFirstGuesses[Math.floor(Math.random() * bestFirstGuesses.length)];
    console.log(`\nGuess this word: ${chalk.rgb(0, 255, 255).bold(wordleGuess.toUpperCase())}\n`);
    let filteredWords = WORDS_LIST.filter(w => w !== wordleGuess);
    try {
        for (var _b = __asyncValues(runWordle()), _c; _c = await _b.next(), !_c.done;) {
            const guess = _c.value;
            filteredWords = reducePossibleWords(wordleGuess, guess, filteredWords);
            console.log(`Remaining possible words: ${filteredWords.length}`);
            wordleGuess = filteredWords[Math.floor(Math.random() * filteredWords.length)];
            console.log(`\nGuess this word: ${chalk.rgb(0, 255, 255).bold(wordleGuess.toUpperCase())}\n`);
        }
    }
    catch (e_2_1) { e_2 = { error: e_2_1 }; }
    finally {
        try {
            if (_c && !_c.done && (_a = _b.return)) await _a.call(_b);
        }
        finally { if (e_2) throw e_2.error; }
    }
};
solveWordle();
// printResult(await playWordle());
