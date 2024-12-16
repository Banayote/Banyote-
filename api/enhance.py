import os
import torch
import cv2
import cloudinary
import cloudinary.uploader
from flask import Flask, request, jsonify, send_file
from werkzeug.utils import secure_filename

# Configure Cloudinary with your API credentials
cloudinary.config(
    cloud_name = "dk2ginl42",  # Your Cloud Name
    api_key = "jkZM7lp2RTCcHAYlIMpgub2Pv7E",  # Your API Key
    api_secret = "386593879163922"  # Your API Secret
)

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

    # Save the uploaded video temporarily
    video_path = os.path.join(UPLOAD_FOLDER, secure_filename(video.filename))
    video.save(video_path)

    # Process the video for enhancement
    enhanced_path = os.path.join(RESULT_FOLDER, "enhanced_" + video.filename)

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

    # Upload the enhanced video to Cloudinary
    cloudinary_response = cloudinary.uploader.upload(enhanced_path, resource_type="video")

    # Return the enhanced video URL from Cloudinary as a response
    return jsonify({"message": "Video enhanced and uploaded", "video_url": cloudinary_response["url"]})

# Vercel handler to work with serverless functions
def handler(req):
    return app(req)



