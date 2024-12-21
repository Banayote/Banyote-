import fs from 'fs/promises';
import path from 'path';

export const config = {
    api: {
        bodyParser: false, // Disable body parsing for file uploads
    },
};

export default async function handler(req, res) {
    try {
        if (req.method === 'POST') {
            // Extract headers
            const chunkIndex = req.headers['chunkindex'];
            const totalChunks = req.headers['totalchunks'];
            const fileName = req.headers['filename'];

            if (!chunkIndex || !totalChunks || !fileName) {
                res.status(400).send({ message: 'Missing required headers' });
                return;
            }

            const chunksDir = './temp_chunks';
            const chunkPath = path.join(chunksDir, `${fileName}.part${chunkIndex}`);

            // Ensure the temp directory exists
            await fs.mkdir(chunksDir, { recursive: true });

            // Write the current chunk to a file
            const chunks = [];
            for await (const chunk of req) {
                chunks.push(chunk);
            }
            await fs.writeFile(chunkPath, Buffer.concat(chunks));

            // Check if all chunks are uploaded
            const uploadedChunks = (await fs.readdir(chunksDir))
                .filter(file => file.startsWith(fileName));

            if (uploadedChunks.length === parseInt(totalChunks, 10)) {
                // Merge all chunks into the final file
                const finalFilePath = path.join('./uploads', fileName);
                const writeStream = fs.createWriteStream(finalFilePath);

                for (let i = 0; i < totalChunks; i++) {
                    const partPath = path.join(chunksDir, `${fileName}.part${i}`);
                    const partData = await fs.readFile(partPath);
                    writeStream.write(partData);
                    await fs.unlink(partPath); // Delete part after merging
                }

                writeStream.end();
                res.status(200).send({ message: 'File uploaded and merged successfully.' });
            } else {
                res.status(200).send({ message: 'Chunk uploaded successfully.' });
            }
        } else {
            res.status(405).send({ message: 'Method Not Allowed' });
        }
    } catch (error) {
        console.error('Error handling upload:', error);
        res.status(500).send({ message: 'Internal Server Error' });
    }
}
