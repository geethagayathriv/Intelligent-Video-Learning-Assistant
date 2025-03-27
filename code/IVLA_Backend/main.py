from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from youtube_transcript_api import YouTubeTranscriptApi
from difflib import SequenceMatcher
from fireworks.client import Fireworks
from youtube_transcript_api.formatters import TextFormatter
from fastapi.middleware.cors import CORSMiddleware
import re
from llama_Model import llama_Model

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
class VideoRequest(BaseModel):
    video_link: str

class AnswerRequest(BaseModel):
    question: str
    user_answer: str
    correct_answer: str

# Utility Functions
def calculate_similarity(answer1, answer2):
    return SequenceMatcher(None, answer1.lower(), answer2.lower()).ratio()

@app.get('/')
async def root():
    return{'example': 'this is an example2','data':888}

# API Endpoints
@app.post('/extract-transcript')
async def extract_transcript(request: VideoRequest):
    #video_link = 'https://www.youtube.com/watch?v=8ofsE7xiGho&t=6s' # request.video_link
    video_link = request.video_link
    try:
        # Extract video ID
        index = video_link.find("?si")
        start_index = video_link[:index].rfind("/") + 1
        video_type = video_link.find("shorts")
        if video_type == -1:
            if index == -1:
                start_index = video_link.find("=") + 1
                video_id = video_link[start_index:]
        elif index == -1:
            index = len(video_link)
            video_id = video_link[start_index:index]

        transcript = YouTubeTranscriptApi.get_transcript(video_id)
       # text_data = " ".join([entry["text"] for entry in transcript])
        
        response=llama_Model.modelResponse(transcript)
        
        return {"questions": response}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/evaluate-answer")
async def evaluate_answer(request: AnswerRequest):
    similarity = calculate_similarity(request.user_answer, request.correct_answer)
    if similarity > 0.85:
        return {"feedback": "Correct! Well done."}
    elif similarity > 0.5:
        return {"feedback": "Almost there! Keep trying!"}
    else:
        return {"feedback": f"Incorrect. The correct answer is: {request.correct_answer}"}


@app.post('/extract-summary')
async def extract_summary(request: VideoRequest):
    #video_link = 'https://www.youtube.com/watch?v=8ofsE7xiGho&t=6s' # request.video_link
    video_link = request.video_link
    try:
        # Extract video ID
        index = video_link.find("?si")
        start_index = video_link[:index].rfind("/") + 1
        video_type = video_link.find("shorts")
        if video_type == -1:
            if index == -1:
                start_index = video_link.find("=") + 1
                video_id = video_link[start_index:]
        elif index == -1:
            index = len(video_link)
            video_id = video_link[start_index:index]

        transcript = YouTubeTranscriptApi.get_transcript(video_id)
       # text_data = " ".join([entry["text"] for entry in transcript])
        
        response=llama_Model.generate_summary(transcript)
        
        return {"Summary": response}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))