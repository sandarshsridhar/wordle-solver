import * as fs from 'fs';
import * as readline from 'readline';
import { checkWord, GLOBAL_WORD_RANKS, initWordsList, LetterGuessResult, reducePossibleWords } from "./wordle.js";

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

const firstWords = [
    'adieu',
    'crane',
    'arise',
    'stare',
    'trace',
    'about',
    'aisle',
    'media',
    'roast',
    'tales',
    'audio',
    'crate',
    'slate',
    'canoe',
    'cones',
    'least'
];

for (const firstWord of firstWords) {
    console.log(`\nSolving for ${firstWord.toUpperCase()}`);
    const report = await getSolvabilityScore(firstWord);

    console.log(`\n\nSolvability Report for ${firstWord.toUpperCase()}`);
    console.log(JSON.stringify(report, null, 2));
}
