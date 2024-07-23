import chalk from "chalk";
import { createRequire } from "module";
import { GLOBAL_WORD_RANKS, LetterGuessResult, checkWord, initWordsList, printGuess, printGuessDistribution, printResult, reducePossibleWords } from "./wordle.js";
const require = createRequire(import.meta.url);
const prompt = require('prompt-sync')({ sigint: true });

const autoSolveWordle = async () => {
    await initWordsList();

    let wordleWord: string | null = null;

    while (!wordleWord) {
        let inputWord = prompt.hide(`Ask your friend to enter a 5 letter word secretly 😉: `);

        if (!inputWord || !GLOBAL_WORD_RANKS.find(wr => wr.word === inputWord.toLowerCase())) {
            console.error('Not a valid 5-letter word!');
        } else {
            wordleWord = inputWord;
        }
    }

    let wordleGuess = 'trace';
    const usedLetters = new Set<string>();
    const guesses: Array<Array<LetterGuessResult>> = [];

    console.log(`\nGuessing this word first as it is statistically the strongest first word: ${chalk.rgb(0, 255, 255).bold(wordleGuess.toUpperCase())}\n`);
    let filteredWords = GLOBAL_WORD_RANKS.filter(wr => wr.word !== wordleGuess);

    let i = 1;
    while (i < 7) {
        try {
            const guessResult = checkWord(wordleGuess.toLowerCase(), wordleWord.toLowerCase());

            wordleGuess.split('').forEach(l => usedLetters.add(l.toUpperCase()));

            printGuess(wordleGuess, guessResult);
            guesses.push(guessResult);
            console.log(`Used Letters: ${chalk.rgb(0, 255, 255).bold([...usedLetters].join(' '))} `);

            if (guessResult.every(l => l === LetterGuessResult.Green)) {
                break;
            }

            filteredWords = reducePossibleWords(wordleGuess, guessResult, filteredWords).sort((a, b) => b.rank - a.rank);
            console.log(`Remaining possible words: ${filteredWords.length > 10 ? filteredWords.length : filteredWords.map(wr => wr.word.toUpperCase()).join(', ')}`);
            wordleGuess = filteredWords[0].word;

            await new Promise<void>((r) => setTimeout(r, 1000));

            console.log(`\nGuessing the next most probable word: ${chalk.rgb(0, 255, 255).bold(wordleGuess.toUpperCase())}\n`);
        } catch (error: any) {
            console.log(error.message);
            console.log(`Used Letters: ${chalk.rgb(0, 255, 255).bold([...usedLetters].join(' '))} `);
            i--;
        }
        i++;
    }
    printGuessDistribution(guesses);

    printResult([i, wordleWord]);
}

await autoSolveWordle();