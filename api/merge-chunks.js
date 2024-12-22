import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { fileName } = req.body;

    if (!fileName) {
        return res.status(400).json({ error: 'File name is required' });
    }

    const tempDir = path.join('/tmp', fileName);
    const outputFilePath = path.join('/tmp', fileName);

    try {
        const chunkFiles = fs
            .readdirSync(tempDir)
            .sort((a, b) => {
                const numA = parseInt(a.split('-').pop());
                const numB = parseInt(b.split('-').pop());
                return numA - numB;
            });

        const writeStream = fs.createWriteStream(outputFilePath);

        for (const chunkFile of chunkFiles) {
            const chunkPath = path.join(tempDir, chunkFile);
            const data = fs.readFileSync(chunkPath);
            writeStream.write(data);
            fs.unlinkSync(chunkPath);
        }

        writeStream.end();
        fs.rmdirSync(tempDir); // Clean up the temporary directory

        console.log(`Merged file saved as ${outputFilePath}`);
        res.status(200).json({ success: true, filePath: outputFilePath });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error merging chunks' });
    }
}

