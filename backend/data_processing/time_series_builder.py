import pandas as pd

def build_time_series(df: pd.DataFrame, date_column: str = 'date') -> list:
    """Prepares structured time-series data out of the Pandas payload for Prophet."""
    if df.empty or date_column not in df.columns:
        return []
        
    df = df.sort_values(by=date_column)
    
    # Structuring exactly as Prophet requires (ds, y)
    prophet_ready_data = []
    for _, row in df.iterrows():
        prophet_ready_data.append({
            "ds": row[date_column].strftime('%Y-%m-%d'),
            "y": row.get('views', 0)
        })
        
    return prophet_ready_data
