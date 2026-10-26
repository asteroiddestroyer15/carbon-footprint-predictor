# generate_realistic_dataset.py
import numpy as np
import pandas as pd

np.random.seed(42)
n_samples = 500

# 1. Realistic ranges for typical day-to-day individuals / students
car_km = np.round(np.random.uniform(0, 25, n_samples), 1)         # 0 to 25 km max daily
electricity = np.round(np.random.uniform(30, 250, n_samples), 1)  # 30 to 250 kWh monthly
meat_meals = np.random.randint(0, 10, n_samples)                  # 0 to 9 meals per week

# Flights: 85% of people take 0 flights; a few take 1 or 2 per year
flights = np.random.choice([0, 1, 2], size=n_samples, p=[0.85, 0.12, 0.03])

# 2. Formula ground truth + minor real-world variations
noise = np.random.normal(0, 5, n_samples)
monthly_carbon = (
    (car_km * 0.192 * 30) + 
    (electricity * 0.82) + 
    (meat_meals * 4.2 * 4) + 
    (flights * 120 / 12) + 
    noise
)

df = pd.DataFrame({
    'car_km': car_km,
    'electricity': electricity,
    'meat_meals': meat_meals,
    'flights': flights,
    'monthly_carbon': np.round(np.maximum(monthly_carbon, 10.0), 1)
})

df.to_csv('dataset.csv', index=False)
print("Saved 500 realistic, local-profile records to dataset.csv")