from flask import Flask, request, jsonify, send_file
import os
import cv2

app = Flask(__name__)
UPLOAD_FOLDER = "uploads"
RESULT_FOLDER = "results"

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(RESULT_FOLDER, exist_ok=True)

@app.route('/enhance', methods=['POST'])
def enhance_video():
    if 'video' not in request.files:
        return jsonify({"error": "No video file provided"}), 400
    
    video_file = request.files['video']
    video_path = os.path.join(UPLOAD_FOLDER, video_file.filename)
    video_file.save(video_path)

    # Simple enhancement using OpenCV
    enhanced_path = os.path.join(RESULT_FOLDER, "enhanced_" + video_file.filename)
    cap = cv2.VideoCapture(video_path)
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(enhanced_path, fourcc, cap.get(cv2.CAP_PROP_FPS), 
                          (int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)), int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))))
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        enhanced_frame = cv2.detailEnhance(frame, sigma_s=10, sigma_r=0.15)
        out.write(enhanced_frame)

    cap.release()
    out.release()
    return send_file(enhanced_path, as_attachment=True)

if __name__ == "__main__":
    app.run(debug=True)
