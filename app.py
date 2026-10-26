from flask import Flask, render_template, request, jsonify
from ai_engine import predict_future_footprint, generate_ai_recommendations

app = Flask(__name__)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/calculate', methods=['POST'])
def calculate():
    data = request.get_json()
    
    car_km = float(data.get('car_km', 0))
    electricity = float(data.get('electricity', 0))
    meat_meals = float(data.get('meat_meals', 0))
    flights = float(data.get('flights', 0))

    # Standard Emission Calculations (kg CO2e)
    transport_co2 = car_km * 0.192 * 30
    energy_co2 = electricity * 0.82
    diet_co2 = meat_meals * 4.2 * 4
    flight_co2 = flights * 120 / 12
    
    current_total = round(transport_co2 + energy_co2 + diet_co2 + flight_co2, 2)
    
    # 1. Machine Learning Projection
    future_prediction = predict_future_footprint(car_km, electricity, meat_meals, flights)

    # 2. Gemini Recommendation Engine
    user_payload = {
        'car_km': car_km,
        'electricity': electricity,
        'meat_meals': meat_meals,
        'flights': flights
    }
    ai_recommendation = generate_ai_recommendations(user_payload, current_total, future_prediction)

    return jsonify({
        'current_total': current_total,
        'future_prediction': future_prediction,
        'breakdown': {
            'Transport': round(transport_co2, 2),
            'Electricity': round(energy_co2, 2),
            'Diet': round(diet_co2, 2),
            'Flights': round(flight_co2, 2)
        },
        'ai_recommendations': ai_recommendation
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)

