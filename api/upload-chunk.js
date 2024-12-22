import fs from 'fs';
import path from 'path';

export const config = {
    api: {
        bodyParser: false, // Disable default body parser for file uploads
    },
};

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const formidable = await import('formidable');
    const form = new formidable.IncomingForm({ uploadDir: '/tmp', keepExtensions: true });

    form.parse(req, async (err, fields, files) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Error parsing the file' });
        }

        const { chunkIndex, totalChunks, fileName } = fields;

        if (!files.chunk || !chunkIndex || !totalChunks || !fileName) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const tempDir = path.join('/tmp', fileName);
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir);
        }

        const chunkPath = path.join(tempDir, `chunk-${chunkIndex}`);
        fs.renameSync(files.chunk.filepath, chunkPath);

        console.log(`Uploaded chunk ${chunkIndex}/${totalChunks} for file ${fileName}`);
        res.status(200).json({ success: true });
    });
}
