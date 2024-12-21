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
            const chunksDir = './temp_chunks';
            const { chunkIndex, totalChunks, fileName } = req.headers;
            const filePath = path.join(chunksDir, `${fileName}.part${chunkIndex}`);

            // Ensure temp directory exists
            await fs.mkdir(chunksDir, { recursive: true });

            // Write the chunk
            const chunks = [];
            for await (const chunk of req) {
                chunks.push(chunk);
            }
            await fs.writeFile(filePath, Buffer.concat(chunks));

            // Check if all chunks are uploaded
            const uploadedChunks = (await fs.readdir(chunksDir))
                .filter(file => file.startsWith(fileName));

            if (uploadedChunks.length === parseInt(totalChunks, 10)) {
                // Merge all chunks
                const finalFilePath = path.join('./uploads', fileName);
                const writeStream = fs.createWriteStream(finalFilePath);

                for (let i = 0; i < totalChunks; i++) {
                    const chunkPath = path.join(chunksDir, `${fileName}.part${i}`);
                    const chunkData = await fs.readFile(chunkPath);
                    writeStream.write(chunkData);
                    await fs.unlink(chunkPath); // Cleanup chunk
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
        console.error('Error processing upload:', error);
        res.status(500).send({ message: 'Internal Server Error' });
    }
}
