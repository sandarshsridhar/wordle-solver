import * as fs from 'fs';
import * as readline from 'readline';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const prompt = require('prompt-sync')({ sigint: true });
import chalk from 'chalk';

enum LetterGuessResult {
    White,
    Yellow,
    Green,
    Red
}

type LetterIndexMap = {
    letter: string,
    index: number
}

type Word = {
    word: string,
    rank: number
}

const GLOBAL_WORD_RANKS: Array<Word> = [];

const initWordsList = async () => {
    const readStream = fs.createReadStream('data/word-ranks.txt');

    const rl = readline.createInterface({
        input: readStream,
        terminal: false,
        crlfDelay: Infinity
    });

    for await (const line of rl) {
        const wordRank = line.split(':');
        GLOBAL_WORD_RANKS.push({
            word: wordRank[0],
            rank: Number(wordRank[1].trim()),
        });
    }

    readStream.close();
    rl.close();

    let currentIndex = GLOBAL_WORD_RANKS.length, randomIndex;

    while (currentIndex != 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        [GLOBAL_WORD_RANKS[currentIndex], GLOBAL_WORD_RANKS[randomIndex]] = [GLOBAL_WORD_RANKS[randomIndex], GLOBAL_WORD_RANKS[currentIndex]];
    }
}

const checkWord = (guess: string, wordle: string): Array<LetterGuessResult> => {
    if (!GLOBAL_WORD_RANKS.find(w => w.word === guess))
        throw new Error('Not a word!');

    const wordGuessResult: Array<number> = [
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
            } else {
                wordGuessResult[index] = LetterGuessResult.Yellow;
            }
        }
    });

    sanitizeResult(wordleLetters, guessedLetters, wordGuessResult);

    return wordGuessResult;
}

const sanitizeResult = (wordleLetters: Array<string>, guessedLetters: Array<string>, wordGuessResult: Array<LetterGuessResult>) => {
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
            } else {
                wordGuessResult[index] = LetterGuessResult.White;
            }
        }
    });
}

const formatResult = (guessLetter: string, letterResult: number) => {
    let colors = [255, 255, 255];
    if (letterResult === LetterGuessResult.Green) {
        colors = [0, 255, 0];
    } else if (letterResult === LetterGuessResult.Yellow) {
        colors = [255, 255, 0];
    } else if (letterResult === LetterGuessResult.Red) {
        colors = [255, 0, 0];
    }

    return chalk.rgb(colors[0], colors[1], colors[2]).bold(`${guessLetter.toUpperCase()}\t`);
}

const printGuess = (guess: string, guessResult: Array<LetterGuessResult>) => {
    const guessLetters = guess.split('');
    console.log(`${formatResult(guessLetters[0], guessResult[0])}` +
        `${formatResult(guessLetters[1], guessResult[1])}` +
        `${formatResult(guessLetters[2], guessResult[2])}` +
        `${formatResult(guessLetters[3], guessResult[3])}` +
        `${formatResult(guessLetters[4], guessResult[4])}`
    );
}

const determineColor = (result: LetterGuessResult): any => {
    if (result === LetterGuessResult.Green)
        return '🟩';
    else if (result === LetterGuessResult.Yellow)
        return '🟨';
    else
        return '⬜️';
}

const printGuessDistribution = (guesses: Array<Array<LetterGuessResult>>) => {
    guesses.forEach((guess) => {
        console.log(`${determineColor(guess[0])}` +
            `${determineColor(guess[1])}` +
            `${determineColor(guess[2])}` +
            `${determineColor(guess[3])}` +
            `${determineColor(guess[4])}`
        );
    });
}

const printResult = (result: [number, string]) => {
    switch (result[0]) {
        case 1: console.log('Lucky Guess!!! 😏');
            break;
        case 2: console.log('Genius!!! 😱');
            break;
        case 3: console.log('Impressive!!! 🤩');
            break;
        case 4: console.log('Nice!!! 😄');
            break;
        case 5: console.log('Did ok!!! 😅');
            break;
        case 6: console.log('Phew... 😮‍💨');
            break;
        default: {
            console.log('Oh no!!!! You lost... 😵🥴😞😭');
            console.log(printGuess(
                result[1],
                [
                    LetterGuessResult.Red,
                    LetterGuessResult.Red,
                    LetterGuessResult.Red,
                    LetterGuessResult.Red,
                    LetterGuessResult.Red
                ]));
            break;
        }
    }
}

const processGreens = (greens: Array<LetterIndexMap>, words: Array<Word>) => {
    let reducedWords = words;

    greens.forEach(map => {
        reducedWords = reducedWords.filter(wr => wr.word[map.index] === map.letter);
    });

    return reducedWords;
}

const processYellows = (yellows: Array<LetterIndexMap>, words: Array<Word>) => {
    let reducedWords = words;

    yellows.forEach(map => {
        reducedWords = reducedWords.filter(wr => wr.word.includes(map.letter) && wr.word[map.index] !== map.letter);
    });

    return reducedWords;
}

const processWhites = (whites: Array<LetterIndexMap>, words: Array<Word>, greens: Array<LetterIndexMap>, yellows: Array<LetterIndexMap>) => {
    let reducedWords = words;

    const isLetterUsed = (letter: string, array: Array<LetterIndexMap>): boolean => array.some(l => l.letter === letter);
    whites.forEach(whiteMap => {
        if (isLetterUsed(whiteMap.letter, greens) || isLetterUsed(whiteMap.letter, yellows)) {
            reducedWords = reducedWords.filter(wr => wr.word[whiteMap.index] !== whiteMap.letter);
        } else {
            reducedWords = reducedWords.filter(wr => !wr.word.includes(whiteMap.letter));
        }
    });

    return reducedWords;
}

const reducePossibleWords = (guessedWord: string, guessResult: Array<LetterGuessResult>, filteredWords: Array<Word>): Array<Word> => {
    let reducedWords = filteredWords;

    const greens: Array<LetterIndexMap> = [];
    const yellows: Array<LetterIndexMap> = [];
    const whites: Array<LetterIndexMap> = [];

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
}

function* runWordle(wordleWord?: string) {
    wordleWord = wordleWord || GLOBAL_WORD_RANKS[Math.floor(Math.random() * GLOBAL_WORD_RANKS.length)].word;
    const usedLetters = new Set<string>();
    const guesses: Array<Array<LetterGuessResult>> = [];

    let i = 1;
    while (i < 7) {
        try {
            const guess: string = prompt(`Make your guess #${i}: `);
            const guessResult = checkWord(guess.toLowerCase(), wordleWord.toLowerCase());

            guess.split('').forEach(l => usedLetters.add(l.toUpperCase()));

            printGuess(guess, guessResult);
            guesses.push(guessResult);
            console.log(`Used Letters: ${chalk.rgb(0, 255, 255).bold([...usedLetters].join(' '))} `);

            if (guessResult.every(l => l === LetterGuessResult.Green)) {
                break;
            }

            yield {
                guess,
                guessResult
            };
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

const solveWordle = async () => {
    await initWordsList();

    let wordleWord = prompt.hide(`Ask your friend to enter a 5 letter word secretly 😉 or press enter for a random word: `);

    if (wordleWord && !GLOBAL_WORD_RANKS.find(wr => wr.word === wordleWord.toLowerCase())) {
        console.error('Not a valid 5-letter word!');
        await solveWordle();

        return;
    }

    // const bestFirstGuesses = ['adieu', 'tears', 'audio', 'canoe', 'roast', 'ratio', 'arise', 'tares', 'stare'];
    // let wordleGuess = bestFirstGuesses[Math.floor(Math.random() * bestFirstGuesses.length)];
    let wordleGuess = 'adieu'; // The best word to start with statistically!

    console.log(`\nGuess this word: ${chalk.rgb(0, 255, 255).bold(wordleGuess.toUpperCase())}\n`);
    let filteredWords = GLOBAL_WORD_RANKS.filter(wr => wr.word !== wordleGuess);

    for await (const { guess, guessResult } of runWordle(wordleWord)) {
        filteredWords = reducePossibleWords(guess, guessResult, filteredWords).sort((a, b) => b.rank - a.rank);

        console.log(`Remaining possible words: ${filteredWords.length > 10 ? filteredWords.length : filteredWords.map(wr => wr.word.toUpperCase()).join(', ')}`);
        wordleGuess = filteredWords[0].word;
        console.log(`\nGuess this word: ${chalk.rgb(0, 255, 255).bold(wordleGuess.toUpperCase())}\n`);
    }
}

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


solveWordle();

// printResult(await playWordle());
