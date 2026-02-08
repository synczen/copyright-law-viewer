const fs = require('fs');
const pdf = require('pdf-parse');

const files = [
    { input: 'd:\\1\\wipo_berne\\berne-en.pdf', output: 'd:\\1\\wipo_berne\\berne-en.txt' },
    { input: 'd:\\1\\wipo_berne\\guidetotheBern.pdf', output: 'd:\\1\\wipo_berne\\berne-guide.txt' }
];

async function extractText(input, output) {
    try {
        if (!fs.existsSync(input)) {
            console.log(`File not found: ${input}`);
            return;
        }
        console.log(`Reading file: ${input}`);
        const dataBuffer = fs.readFileSync(input);
        const data = await pdf(dataBuffer);

        fs.writeFileSync(output, data.text);
        console.log(`Successfully extracted ${data.text.length} characters to ${output}`);
    } catch (error) {
        console.error(`Error extracting ${input}:`, error.message);
    }
}

async function processAll() {
    for (const file of files) {
        await extractText(file.input, file.output);
    }
}

processAll();
