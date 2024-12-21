import { exec } from 'child_process';
import fs from 'fs/promises';
import formidable from 'formidable';

export const config = {
    api: {
        bodyParser: false, // Disable body parsing so we can handle file uploads manually
    },
};

export default async function handler(req, res) {
    // Allow only POST method
    if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
    }

    // Use formidable to parse the incoming form data (including the file)
    const form = new formidable.IncomingForm();

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

        const inputPath = uploadedFile.filepath; // Path of the uploaded file
        const outputPath = './output.mp4'; // Path where the enhanced video will be saved

        // Run Real-ESRGAN to enhance the video
        exec(`python inference_realesrgan_video.py -i ${inputPath} -o ${outputPath}`, async (error, stdout, stderr) => {
            if (error) {
                console.error('Error enhancing video:', stderr);
                res.status(500).send('Failed to process video');
                return;
            }

            try {
                // Send the enhanced video as a response
                const enhancedVideo = await fs.readFile(outputPath);
                res.setHeader('Content-Type', 'video/mp4');
                res.send(enhancedVideo);

                // Cleanup temporary files after sending the response
                await fs.unlink(inputPath);  // Remove the uploaded file
                await fs.unlink(outputPath); // Remove the processed (enhanced) video
            } catch (cleanupError) {
                console.error('Error during cleanup:', cleanupError);
                res.status(500).send('Failed to cleanup files');
            }
        });
    });
}
