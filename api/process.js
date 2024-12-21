import formidable from 'formidable';
import fs from 'fs/promises';
import path from 'path';

export const config = {
    api: {
        bodyParser: false, // Disable body parsing
    },
};

const UPLOAD_DIR = './uploads'; // Temporary directory for storing chunks

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
    }

    const form = new formidable.IncomingForm();
    form.uploadDir = UPLOAD_DIR;
    form.keepExtensions = true;

    form.parse(req, async (err, fields, files) => {
        if (err) {
            console.error('Error parsing form:', err);
            res.status(500).send('Error processing upload');
            return;
        }

        const chunk = files.chunk;
        const chunkIndex = parseInt(fields.chunkIndex, 10);
        const totalChunks = parseInt(fields.totalChunks, 10);

        // Store the chunk
        const chunkPath = path.join(UPLOAD_DIR, `chunk_${chunkIndex}`);
        await fs.rename(chunk.filepath, chunkPath);

        console.log(`Chunk ${chunkIndex + 1}/${totalChunks} received`);

        // If all chunks are uploaded, reassemble the file
        if (chunkIndex === totalChunks - 1) {
            try {
                const outputFilePath = path.join(UPLOAD_DIR, 'final_video.mp4');
                const writeStream = fs.createWriteStream(outputFilePath);

                for (let i = 0; i < totalChunks; i++) {
                    const currentChunkPath = path.join(UPLOAD_DIR, `chunk_${i}`);
                    const data = await fs.readFile(currentChunkPath);
                    writeStream.write(data);
                    await fs.unlink(currentChunkPath); // Cleanup chunk
                }

                writeStream.end();
                console.log('File reassembled successfully');

                res.status(200).send('File reassembled successfully');
            } catch (error) {
                console.error('Error reassembling file:', error);
                res.status(500).send('Failed to reassemble file');
            }
        } else {
            res.status(200).send('Chunk uploaded successfully');
        }
    });
}
