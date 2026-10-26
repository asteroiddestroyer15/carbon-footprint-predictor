import os
import joblib
import numpy as np
from google import genai

# Initialize Google AI Studio client (reads GEMINI_API_KEY environment variable)

client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))


# Load saved regression model
reg_model = joblib.load('models/linear_reg.pkl')

def predict_future_footprint(car_km, electricity, meat_meals, flights, projected_growth=1.05):
    """Predicts next month emissions factoring a 5% lifestyle/seasonal increase."""
    input_data = np.array([[car_km * projected_growth, electricity * projected_growth, meat_meals, flights]])
    predicted_co2 = reg_model.predict(input_data)[0]
    return round(predicted_co2, 2)

import time

def generate_ai_recommendations(user_data, current_total, future_pred):
    prompt = f"""
    You are an expert Environmental Sustainability AI.
    A user has evaluated their monthly carbon footprint:
    - Daily Car Commute: {user_data['car_km']} km
    - Monthly Electricity: {user_data['electricity']} kWh
    - Meat Meals per Week: {user_data['meat_meals']}
    - Yearly Flights: {user_data['flights']}
    - Current Monthly Total: {current_total} kg CO2e
    - Linear Regression Projected Next Month: {future_pred} kg CO2e

    Provide:
    1. A 1-sentence assessment identifying their highest emission hotspot.
    2. Exactly 3 realistic, high-impact bullet points to reduce their emissions.
    3. Estimated total kg CO2e reduction per month from these steps.
    Keep the tone concise, encouraging, and direct without fluff.
    """

    # List of models to try in order if one experiences high demand (503)
    candidate_models = ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-3.6-flash"]

    for model_name in candidate_models:
        for attempt in range(2):  # Try twice per model
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=prompt
                )
                return response.text
            except Exception as e:
                err_msg = str(e)
                # If overloaded, wait 1.5 seconds and retry
                if "503" in err_msg or "UNAVAILABLE" in err_msg:
                    time.sleep(1.5)
                    continue
                break  # If it's a different error (e.g. 404), skip immediately to the next candidate model

    return "The AI service is temporarily experiencing high global traffic. Please click 'Run AI Assessment' again in a few seconds."