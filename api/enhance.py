import os
import cv2
from flask import Flask, request, jsonify, send_file
from werkzeug.utils import secure_filename

UPLOAD_FOLDER = "/tmp/uploads/"
RESULT_FOLDER = "/tmp/results/"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(RESULT_FOLDER, exist_ok=True)

app = Flask(__name__)

@app.route("/api/enhance", methods=["POST"])
def enhance_video():
    if "video" not in request.files:
        return jsonify({"error": "No video file provided"}), 400

    video = request.files["video"]
    if video.filename == "":
        return jsonify({"error": "No selected video file"}), 400

    video_path = os.path.join(UPLOAD_FOLDER, secure_filename(video.filename))
    video.save(video_path)

    enhanced_path = os.path.join(RESULT_FOLDER, "enhanced_" + video.filename)

    # Process video frame by frame (basic enhancement with OpenCV)
    cap = cv2.VideoCapture(video_path)
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(
        enhanced_path, fourcc, cap.get(cv2.CAP_PROP_FPS),
        (int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)), int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)))
    )

    while True:
        ret, frame = cap.read()
        if not ret:
            break
        # Simple enhancement (can replace with lightweight AI models)
        enhanced_frame = cv2.detailEnhance(frame, sigma_s=10, sigma_r=0.15)
        out.write(enhanced_frame)

    cap.release()
    out.release()

    return send_file(enhanced_path, as_attachment=True)

# Vercel's handler for serverless functions
def handler(req):
    return app(req)
