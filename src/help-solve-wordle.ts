import chalk from "chalk";
import { createRequire } from "module";
import { GLOBAL_WORD_RANKS, initWordsList, LetterGuessResult, reducePossibleWords } from "./wordle.js";
const require = createRequire(import.meta.url);
const prompt = require('prompt-sync')({ sigint: true });

const sanitizeResult = (result: string) => {
    return result.toLowerCase().split('').map(r => {
        switch (r) {
            case 'g':
                return LetterGuessResult.Green;
            case 'y':
                return LetterGuessResult.Yellow;
            case 'w':
            default:
                return LetterGuessResult.White;
        }
    });
}

const helpSolveWordle = async () => {
    console.log('Welcome to Wordle Helper! This program helps you solve the Wordle game. Just follow the instructions on the screen and enjoy!');

    const sleep = () => new Promise<void>((r) => setTimeout(r, 3_000));

    await initWordsList();

    await sleep();

    let wordleGuess = 'trace';
    let i = 1;
    let filteredWords = GLOBAL_WORD_RANKS.filter(wr => wr.word !== wordleGuess);

    while (i < 7) {
        console.log(`\nGuess this word: ${chalk.rgb(0, 255, 255).bold(wordleGuess.toUpperCase())}\n`);

        const promptResult = prompt('Now, looking at your wordle result, enter G, Y, W for each letter where G is green, Y is yellow and W is white with NO spaces: ');
        const result = sanitizeResult(promptResult);

        if (result.every(r => r === LetterGuessResult.Green)) {
            console.log(`\nYou got it! The word is ${chalk.rgb(0, 255, 0).bold(wordleGuess.toUpperCase())}`);
            break;
        }

        filteredWords = reducePossibleWords(wordleGuess, result, filteredWords).sort((a, b) => b.rank - a.rank);

        console.log(`Remaining possible words: ${filteredWords.length > 10 ? filteredWords.length : filteredWords.map(wr => wr.word.toUpperCase()).join(', ')}`);
        wordleGuess = filteredWords[0].word;

        i++;
    }
}

helpSolveWordle();