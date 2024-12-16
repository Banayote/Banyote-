import os
import torch
import cv2
from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
import cloudinary.uploader  # Import Cloudinary's uploader module

# Cloudinary Configuration
cloudinary.config(
    cloud_name="dk2ginl42",  # Replace with your Cloudinary cloud name
    api_key="jkZM7lp2RTCcHAYlIMpgub2Pv7E",  # Replace with your Cloudinary API key
    api_secret="386593879163922"  # Replace with your Cloudinary API secret
)

# Paths to store temporary files
UPLOAD_FOLDER = "/tmp/uploads/"
RESULT_FOLDER = "/tmp/results/"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(RESULT_FOLDER, exist_ok=True)

# Load the AI model (as a placeholder, resnet18 is being used here)
model = torch.hub.load("pytorch/vision", "resnet18", pretrained=True)  # Replace with your AI model

# Initialize Flask app
app = Flask(__name__)

@app.route("/api/enhance", methods=["POST"])
def enhance_video():
    # Check if a file URL is provided
    if "file_url" not in request.json:
        return jsonify({"error": "No file URL provided"}), 400

    file_url = request.json["file_url"]

    # Download the video from the provided URL
    video_path = os.path.join(UPLOAD_FOLDER, "input_video.mp4")
    os.system(f"wget -O {video_path} {file_url}")

    # Output path for the enhanced video
    enhanced_path = os.path.join(RESULT_FOLDER, "enhanced_video.mp4")

    # Open the video for processing
    cap = cv2.VideoCapture(video_path)
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(
        enhanced_path,
        fourcc,
        cap.get(cv2.CAP_PROP_FPS),
        (int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)), int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)))
    )

    while True:
        ret, frame = cap.read()
        if not ret:
            break
        # Enhance the video frame using your AI model or OpenCV logic
        enhanced_frame = cv2.detailEnhance(frame, sigma_s=10, sigma_r=0.15)  # Replace this with AI model logic
        out.write(enhanced_frame)

    cap.release()
    out.release()

    # Upload the enhanced video to Cloudinary
    cloudinary_response = cloudinary.uploader.upload(enhanced_path, resource_type="video")

    # Return the Cloudinary URL of the enhanced video
    return jsonify({"message": "Video enhanced successfully", "video_url": cloudinary_response["url"]})


