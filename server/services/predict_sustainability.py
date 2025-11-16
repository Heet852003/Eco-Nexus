"""
Python script to predict vendor sustainability score using the trained ML model
Called from Node.js via exec
"""

import sys
import joblib
import pandas as pd
import numpy as np

def predict_sustainability(model_path, vendor_price_today, vendor_delivery_days, 
                          local_flag_numeric, past_sustainability_avg):
    """
    Predict vendor sustainability score
    
    Args:
        model_path: Path to the .joblib model file
        vendor_price_today: Seller's price
        vendor_delivery_days: Delivery days
        local_flag_numeric: Local flag (0 or 1)
        past_sustainability_avg: Average of past sustainability scores
    
    Returns:
        Predicted sustainability score (0-100)
    """
    try:
        # Load the model
        model = joblib.load(model_path)
        
        # Create feature DataFrame (same order as training)
        features = pd.DataFrame([{
            'vendor_price_today': float(vendor_price_today),
            'vendor_delivery_days': int(vendor_delivery_days),
            'local_flag_numeric': int(local_flag_numeric),
            'past_sustainability_avg': float(past_sustainability_avg)
        }])
        
        # Predict
        score = model.predict(features)[0]
        
        # Clamp to 0-100
        score = max(0, min(100, score))
        
        return round(score, 2)
    except Exception as e:
        # Return error code that Node.js can handle
        print(f"ERROR: {str(e)}", file=sys.stderr)
        return None

if __name__ == "__main__":
    if len(sys.argv) != 6:
        print("ERROR: Invalid arguments", file=sys.stderr)
        sys.exit(1)
    
    model_path = sys.argv[1]
    vendor_price_today = float(sys.argv[2])
    vendor_delivery_days = int(sys.argv[3])
    local_flag_numeric = int(sys.argv[4])
    past_sustainability_avg = float(sys.argv[5])
    
    score = predict_sustainability(
        model_path,
        vendor_price_today,
        vendor_delivery_days,
        local_flag_numeric,
        past_sustainability_avg
    )
    
    if score is not None:
        print(score)
    else:
        sys.exit(1)

