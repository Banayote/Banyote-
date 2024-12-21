import { exec } from 'child_process';
import fs from 'fs/promises';
import formidable from 'formidable';

export const config = {
    api: {
        bodyParser: false, // Disable body parsing so we can handle file uploads
    },
};

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
    }

    // Use formidable to parse the incoming file
    const form = new formidable.IncomingForm({
        maxFileSize: 100 * 1024 * 1024, // Set max file size to 100MB
    });

    form.parse(req, async (err, fields, files) => {
        if (err) {
            console.error('Error parsing form:', err);
            res.status(500).send('Error processing request');
            return;
        }

        // Ensure a file was uploaded
        const uploadedFile = files.file;
        if (!uploadedFile) {
            res.status(400).send('No file uploaded');
            return;
        }

        const inputPath = uploadedFile.filepath;
        const outputPath = './output.mp4';

        // Run Real-ESRGAN to enhance the video
        exec(`python inference_realesrgan_video.py -i ${inputPath} -o ${outputPath}`, async (error) => {
            if (error) {
                console.error('Error enhancing video:', error);
                res.status(500).send('Failed to process video');
                return;
            }

            try {
                // Send the enhanced video as a response
                const enhancedVideo = await fs.readFile(outputPath);
                res.setHeader('Content-Type', 'video/mp4');
                res.send(enhancedVideo);

                // Cleanup temporary files
                await fs.unlink(inputPath);
                await fs.unlink(outputPath);
            } catch (cleanupError) {
                console.error('Error during cleanup:', cleanupError);
                res.status(500).send('Failed to cleanup files');
            }
        });
    });
}
