import pandas as pd
import numpy as np

def clean_timeseries_data(raw_data: list) -> pd.DataFrame:
    """Removes noise and handles missing values via forward filling."""
    df = pd.DataFrame(raw_data)
    # Convert dates and fill missing metric data
    df['date'] = pd.to_datetime(df['date'])
    df = df.sort_values('date')
    
    # Fill missing zeroes with previous day's metrics (FFill)
    df = df.replace(0, np.nan)
    df = df.ffill().fillna(0)
    return df

def extract_features(df: pd.DataFrame) -> dict:
    """Extracts derived metrics: Engagement Rate & Growth Rate."""
    if df.empty or 'views' not in df.columns:
        return {}
        
    # Engagement = (likes + comments) / views
    if 'likes' in df.columns and 'comments' in df.columns:
        df['engagement_rate'] = (df['likes'] + df['comments']) / df['views']
    else:
        df['engagement_rate'] = 0.0
        
    # Growth rate = change in subscribers/views over 7 days
    if len(df) >= 7:
        growth_rate = ((df['views'].iloc[-1] - df['views'].iloc[-7]) / df['views'].iloc[-7]) * 100
    else:
        growth_rate = 0.0
        
    return {
        "avg_engagement_rate_30d": float(df['engagement_rate'].mean()),
        "weekly_growth_rate_pct": float(growth_rate)
    }
