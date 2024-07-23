import chalk from "chalk";
import { createRequire } from "module";
import { GLOBAL_WORD_RANKS, initWordsList, LetterGuessResult, reducePossibleWords, runWordle } from "./wordle.js";
const require = createRequire(import.meta.url);
const prompt = require('prompt-sync')({ sigint: true });

const solveWordle = async () => {
    await initWordsList();

    let wordleWord: string | null = null;

    while (!wordleWord) {
        let inputWord = prompt.hide(`Ask your friend to enter a 5 letter word secretly 😉 or press enter for a random word: `);

        if (inputWord && !GLOBAL_WORD_RANKS.find(wr => wr.word === inputWord.toLowerCase())) {
            console.error('Not a valid 5-letter word!');
        } else if (!inputWord) {
            wordleWord = GLOBAL_WORD_RANKS[Math.floor(Math.random() * GLOBAL_WORD_RANKS.length)].word;
        } else {
            wordleWord = inputWord;
        }
    }

    let wordleGuess = 'trace'; // The best word to start with statistically!

    console.log(`\nGuess this word: ${chalk.rgb(0, 255, 255).bold(wordleGuess.toUpperCase())}\n`);
    let filteredWords = GLOBAL_WORD_RANKS.filter(wr => wr.word !== wordleGuess);
    let i = 1;

    for await (const { guess, guessResult } of runWordle(wordleWord)) {
        filteredWords = reducePossibleWords(guess, guessResult, filteredWords).sort((a, b) => b.rank - a.rank);

        console.log(`Remaining possible words: ${filteredWords.length > 10 ? filteredWords.length : filteredWords.map(wr => wr.word.toUpperCase()).join(', ')}`);
        wordleGuess = filteredWords[0].word;
        i++;

        if (i < 7) {
            console.log(`\nGuess this word: ${chalk.rgb(0, 255, 255).bold(wordleGuess.toUpperCase())}\n`);
        }
    }
}

solveWordle();
