import fs from 'fs';
import path from 'path';

export const config = {
    api: {
        bodyParser: false, // Disable body parsing for file uploads
    },
};

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { chunk, chunkIndex, totalChunks, fileName } = req.body;

        const tempDir = './temp_uploads';
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir);
        }

        const tempFilePath = path.join(tempDir, `${fileName}.part${chunkIndex}`);
        fs.writeFileSync(tempFilePath, chunk);

        // Check if all chunks are uploaded
        const uploadedChunks = fs.readdirSync(tempDir).filter(file => file.startsWith(fileName));
        if (uploadedChunks.length === totalChunks) {
            // Merge chunks
            const outputFilePath = `./uploads/${fileName}`;
            const writeStream = fs.createWriteStream(outputFilePath);

            for (let i = 0; i < totalChunks; i++) {
                const chunkPath = path.join(tempDir, `${fileName}.part${i}`);
                const data = fs.readFileSync(chunkPath);
                writeStream.write(data);
                fs.unlinkSync(chunkPath); // Delete chunk after merging
            }

            writeStream.close();
            res.status(200).send({ message: 'File uploaded and merged successfully.' });
        } else {
            res.status(200).send({ message: 'Chunk uploaded successfully.' });
        }
    } else {
        res.status(405).send({ message: 'Method Not Allowed' });
    }
}
