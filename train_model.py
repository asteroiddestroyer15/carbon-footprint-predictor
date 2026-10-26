import os
import joblib
import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split

# 1. Read the dataset
df = pd.read_csv('dataset.csv')

# VERIFICATION 1: Check total rows loaded
print(f"Total rows loaded from CSV: {len(df)}")
print(f"Dataset shape: {df.shape} (rows, columns)")

X = df[['car_km', 'electricity', 'meat_meals', 'flights']]
y = df['monthly_carbon']

# 80% train, 20% test
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# VERIFICATION 2: Check train/test partition counts
print(f"Rows sent to model.fit() for training: {len(X_train)} (80%)")
print(f"Rows reserved for evaluation testing: {len(X_test)} (20%)")

# Train the model
model = LinearRegression()
model.fit(X_train, y_train)

# VERIFICATION 3: Inspect the learned parameters
print("\n--- Learned Model Parameters ---")
print(f"Intercept (b): {model.intercept_:.4f}")
for feature, weight in zip(X.columns, model.coef_):
    print(f"Weight for {feature:<12}: {weight:.4f}")

# Evaluate accuracy
accuracy = model.score(X_test, y_test)
print(f"\nTest R² Score: {accuracy:.4f}")

os.makedirs('models', exist_ok=True)
joblib.dump(model, 'models/linear_reg.pkl')
print("Model saved successfully.")