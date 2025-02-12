from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
from pdfminer.high_level import extract_text
from txt_to_video import generate_video, get_filename
from flask_cors import CORS
from openai import OpenAI
import os
openaiApiKey = ""
model = OpenAI(api_key = openaiApiKey)

app = Flask(__name__)
# CORS(app,  resources={r"/api/*": {"origins": "http://localhost:5005"}})  # Enable CORS for all origins
CORS(app,  resources={r"/api/*": {"origins": "*"}})

def generate_video_from_text(text):
    # Implement video generation logic here
    # Return the URL of the generated video
    return 'http://example.com/generated_video.mp4'

def summarize_text(text):
    prompt = f"Please summarize the following text in 150 words:\n\n{text}\n\nSummary:"
    
    response = model.chat.completions.create(
        model="gpt-3.5-turbo", 
        messages=[
            {"role": "user", "content": prompt}
        ],
        max_tokens=200,  
        temperature=0.7 
    )
    summary = response.choices[0].message.content
    return summary


@app.route('/api/get-video-link', methods=['POST'])
def get_video_link():
    data = request.json
    text = data.get('text')
    
    # print("Text is inside get video link: ", text)
    summarized_text = summarize_text(". ".join(text))
    # print("Summarized Text is : ", summarized_text)
    # Process the extracted text (e.g., generate a video)
    # video_url = generate_video(summarized_text)
    video_url = get_filename()
    
    return jsonify({'videoLink': "http://localhost:8000/"+video_url})

@app.route('/api/upload-video', methods=['POST'])
def upload_video():
    if 'videoFile' not in request.files:
        return {'error': 'No file part'}, 400
    file = request.files['videoFile']
    if file.filename == '':
        return {'error': 'No selected file'}, 400

    # Save the file
    file.save(os.path.join('uploads', file.filename))  # Make sure 'uploads' directory exists
    return {'message': 'File uploaded successfully'}, 200

if __name__ == '__main__':
    app.run(port=5005, debug = True)


# npm install -g http-server
# http-server -p 5005
