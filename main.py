import joblib
import pandas as pd
import os
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from typing import Literal
from fastapi.middleware.cors import CORSMiddleware

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
model = joblib.load(os.path.join(BASE_DIR, 'Mental_Health_Model.pkl'))
top_countries = ['Other','India','USA','Canada','Australia','UK','Germany','Mexico','Turkey','France']

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


#A first Pydantic Model
class StudentData(BaseModel):
    age                     : int = Field(..., ge=10, le=100)
    gender                  : Literal['Male', 'Female']
    country                 : str
    academic_level          : Literal['Undergraduate', 'Graduate', 'High School']
    most_used_platform      : Literal['Facebook', 'LinkedIn', 'Instagram', 'Snapchat','Twitter','YouTube', 'TikTok', 'LINE', 'KakaoTalk', 'VKontakte', 'WhatsApp','WeChat']
    purpose_of_use          : Literal['Networking', 'Education', 'Entertainment', 'News']
    avg_daily_usage_hours   : float = Field(..., ge=0, le=24)
    daily_unlocks           : int   = Field(..., ge=0)
    study_hours             : float = Field(..., ge=0, le=24)
    physical_activity_hours : float = Field(..., ge=0, le=24)
    sleep_hours_per_night   : float = Field(..., ge=0, le=24)
    stress_level            : Literal['Medium', 'Low', 'Very High', 'High']




# Describe what we send back
class PredictionResponse(BaseModel):
    predicted_mental_health_score:float
    #6.777777 -> float




def _file(*names):
    for n in names:
        p = os.path.join(BASE_DIR, n)
        if os.path.exists(p):
            return FileResponse(p)
    raise HTTPException(status_code=404, detail="File not found")


# The website is also served from this server: http://127.0.0.1:8000
@app.get('/')
def home():
    return _file('index.html')


@app.get('/style.css')
def css():
    return _file('style.css')


@app.get('/script.js')
def js():
    return _file('script.js')


@app.get('/hero.jpeg')
def hero():
    return _file('hero.jpeg')

@app.get('/health')
def health():
    return {'status': 'ok'}


@app.post('/predict', response_model=PredictionResponse)
def predict(data: StudentData):
    country_group = data.country if data.country in top_countries else "Other"

    input_row = pd.DataFrame([{
        'Age'                     : data.age,
        'Gender'                  : data.gender,
        'Country'                 : data.country,
        'Academic_Level'          : data.academic_level,
        'Most_Used_Platform'      : data.most_used_platform,
        'Purpose_Of_Use'          : data.purpose_of_use,
        'Avg_Daily_Usage_Hours'   : data.avg_daily_usage_hours,
        'Daily_Unlocks'           : data.daily_unlocks,
        'Study_Hours'             : data.study_hours,
        'Physical_Activity_Hours' : data.physical_activity_hours,
        'Sleep_Hours_Per_Night'   : data.sleep_hours_per_night,
        'Stress_Level'            : data.stress_level,
        'Grouped_country'         : country_group
    }])

    prediction = float(model.predict(input_row)[0])

    print("INPUT DATA:", input_row.to_dict(orient="records")[0])
    print("MODEL PREDICTION:", prediction)

    return PredictionResponse(
        predicted_mental_health_score=round(prediction, 2)
    )
