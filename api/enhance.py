import os
import torch
import cv2
from flask import Flask, request, jsonify, send_file
from werkzeug.utils import secure_filename

# Paths to store uploaded and enhanced videos
UPLOAD_FOLDER = "/tmp/uploads/"
RESULT_FOLDER = "/tmp/results/"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(RESULT_FOLDER, exist_ok=True)

# Load the AI model (a simple model placeholder)
model = torch.hub.load('pytorch/vision', 'resnet18', pretrained=True)  # Placeholder for AI model

# Initialize Flask app
app = Flask(__name__)

@app.route("/api/enhance", methods=["POST"])
def enhance_video():
    if "video" not in request.files:
        return jsonify({"error": "No video file provided"}), 400

    video = request.files["video"]
    if video.filename == "":
        return jsonify({"error": "No selected video file"}), 400

    # Save the uploaded video
    video_path = os.path.join(UPLOAD_FOLDER, secure_filename(video.filename))
    video.save(video_path)

    # Output path for the enhanced video
    enhanced_path = os.path.join(RESULT_FOLDER, "enhanced_" + video.filename)

    # Open the video for processing
    cap = cv2.VideoCapture(video_path)
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(enhanced_path, fourcc, cap.get(cv2.CAP_PROP_FPS), 
                          (int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)), int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))))

    while True:
        ret, frame = cap.read()
        if not ret:
            break
        # Apply enhancement (replace this with your AI model's enhancement logic)
        enhanced_frame = cv2.detailEnhance(frame, sigma_s=10, sigma_r=0.15)
        out.write(enhanced_frame)

    cap.release()
    out.release()

    # Return the enhanced video as a response
    return send_file(enhanced_path, as_attachment=True)

# Vercel handler to work with serverless functions
def handler(req):
    return app(req)
