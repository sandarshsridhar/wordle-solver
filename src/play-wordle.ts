import chalk from "chalk";
import { createRequire } from "module";
import { GLOBAL_WORD_RANKS, LetterGuessResult, checkWord, initWordsList, printGuess, printGuessDistribution, printResult } from "./wordle.js";
const require = createRequire(import.meta.url);
const prompt = require('prompt-sync')({ sigint: true });

const playWordle = async (): Promise<[number, string]> => {
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

    const usedLetters = new Set<string>();
    const guesses: Array<Array<LetterGuessResult>> = [];

    let i = 1;
    while (i < 7) {
        try {
            const guess: string = prompt(`Make your guess #${i}: `);
            const guessResult = checkWord(guess.toLowerCase(), wordleWord);

            guess.split('').forEach(l => usedLetters.add(l.toUpperCase()));

            printGuess(guess, guessResult);
            guesses.push(guessResult);
            console.log(`Used Letters: ${chalk.rgb(0, 255, 255).bold([...usedLetters].join(' '))} `);

            if (guessResult.every(l => l === LetterGuessResult.Green)) {
                break;
            }
        } catch (error: any) {
            console.log(error.message);
            console.log(`Used Letters: ${chalk.rgb(0, 255, 255).bold([...usedLetters].join(' '))} `);
            i--;
        }
        i++;
    }
    printGuessDistribution(guesses);

    return [i, wordleWord];
}

printResult(await playWordle());