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

function* runWordle(wordleWord: string) {
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

    let wordleGuess = 'adieu';
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

const autoSolveWordleVanilla = (inputWord: string, wordleGuess: string = 'adieu'): number => {
    let wordleWord: string | null = null;

    if (!inputWord || !GLOBAL_WORD_RANKS.find(wr => wr.word === inputWord.toLowerCase())) {
        throw new Error(`${inputWord} is not a valid 5-letter word!`);
    } else {
        wordleWord = inputWord;
    }

    const usedLetters = new Set<string>();
    const guesses: Array<Array<LetterGuessResult>> = [];

    let filteredWords = GLOBAL_WORD_RANKS.filter(wr => wr.word !== wordleGuess);

    let i = 1;
    while (i < 7) {
        try {
            const guessResult = checkWord(wordleGuess.toLowerCase(), wordleWord.toLowerCase());
            wordleGuess.split('').forEach(l => usedLetters.add(l.toUpperCase()));
            guesses.push(guessResult);
            if (guessResult.every(l => l === LetterGuessResult.Green)) {
                break;
            }
            filteredWords = reducePossibleWords(wordleGuess, guessResult, filteredWords).sort((a, b) => b.rank - a.rank);
            wordleGuess = filteredWords[0].word;
        } catch (error: any) {
            console.log(error.message);
            i--;
        }
        i++;
    }
    return i;
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
    while (i < 13) {
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

const getSolvabilityScore = async (firstWord: string) => {
    await initWordsList();

    const solvabilityMap: {
        [key: string]: {
            turns: number,
            outcome: boolean
        }
    } = {};

    const readStream = fs.createReadStream('data/word-ranks.txt');
    const rl = readline.createInterface({
        input: readStream,
        terminal: false,
        crlfDelay: Infinity
    });

    for await (const word of rl) {
        const result = autoSolveWordleVanilla(word.split(':')[0], firstWord);

        solvabilityMap[word] = {
            turns: result,
            outcome: result < 7
        };
    }

    readStream.close();
    rl.close();

    const solved = Object.values(solvabilityMap).filter(s => s.outcome);
    const unsolved = Object.values(solvabilityMap).filter(s => !s.outcome);
    const all = Object.values(solvabilityMap);

    const report = {
        solved: solved.length,
        unsolved: unsolved.length,
        averageGuessesToSolveToWin: (solved.reduce((acc, s) => acc + s.turns, 0) / solved.length).toFixed(2),
        minimumGuessesToSolveToWin: Math.min(...solved.map(s => s.turns)),
        maximumGuessesToSolveToWin: Math.max(...solved.map(s => s.turns)),
        averageGuessesToSolve: (all.reduce((acc, s) => acc + s.turns, 0) / all.length).toFixed(2),
        maximumGuessesToSolve: Math.max(...all.map(s => s.turns)),
        guessToWinDistribution: {
            1: solved.filter(s => s.turns === 1).length,
            2: solved.filter(s => s.turns === 2).length,
            3: solved.filter(s => s.turns === 3).length,
            4: solved.filter(s => s.turns === 4).length,
            5: solved.filter(s => s.turns === 5).length,
            6: solved.filter(s => s.turns === 6).length
        }
    }

    return report;
}


// solveWordle();

await autoSolveWordle();

// printResult(await playWordle());

// const firstWords = [
//     'adieu',
//     'crane',
//     'arise',
//     'stare',
//     'trace',
//     'about',
//     'aisle',
//     'media',
//     'roast',
//     'tales',
//     'audio',
//     'crate',
//     'slate',
//     'canoe',
//     'cones',
//     'least'
// ];

// for (const firstWord of firstWords) {
//     console.log(`\nSolving for ${firstWord.toUpperCase()}`);
//     const report = await getSolvabilityScore(firstWord);

//     console.log(`\n\nSolvability Report for ${firstWord.toUpperCase()}`);
//     console.log(JSON.stringify(report, null, 2));
// }
