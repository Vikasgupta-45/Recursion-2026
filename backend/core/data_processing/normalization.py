import pandas as pd
from sklearn.preprocessing import MinMaxScaler

def normalize_metrics(df: pd.DataFrame, columns: list) -> pd.DataFrame:
    """Min-Max normalization to put metrics like Views and Likes on a 0-1 scale for AI ingest."""
    scaler = MinMaxScaler()
    for col in columns:
        if col in df.columns:
            df[f'{col}_normalized'] = scaler.fit_transform(df[[col]])
    return df
