import * as fs from 'fs';
import got, { HTTPError } from 'got';
import { Agent as HttpsAgent } from 'https';
import * as readline from 'readline';

const options = {
    keepAlive: true,
    timeout: (30 * 60 * 1000)
};

const httpClient = got.extend({
    agent: {
        https: new HttpsAgent(options)
    }
})

export const getWordRank = async (word: string): Promise<string> => {
    const url = `https://api.datamuse.com/words?sp=${word}&md=f&max=1`

    try {
        const response = JSON.parse((await httpClient.get(url)).body);

        if (response.length === 0) {
            console.error(`No results found for ${word}`);

            return '0';
        }

        return response[0].tags[0].split(':')[1];
    } catch (err: any) {
        console.error(err);

        if (err instanceof HTTPError && err.response.statusCode === 429) {
            console.log('Sleeping for 5 seconds...');
            await new Promise<void>((r) => setTimeout(r, 5_000));

            return getWordRank(word);
        }

        throw err;
    }
}

export const createWordRanks = async () => {
    const readStream = fs.createReadStream('data/five-lettered-words.txt');
    const writeStream = fs.createWriteStream('data/word-ranks.txt');

    const rl = readline.createInterface({
        input: readStream,
        terminal: false,
        crlfDelay: Infinity
    });

    for await (const word of rl) {
        const rank = await getWordRank(word);
        console.log(`${word}: ${rank}`);

        if (rank === '0') {
            continue;
        }
        writeStream.write(`${word}: ${rank}\n`);
    }

    writeStream.end();
    readStream.close();
    rl.close();
}

await createWordRanks();