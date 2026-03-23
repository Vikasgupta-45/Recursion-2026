import pandas as pd

def remove_noise(df: pd.DataFrame) -> pd.DataFrame:
    """Removes statistical outliers using the Interquartile Range (IQR)."""
    if df.empty or 'views' not in df.columns:
        return df
    
    Q1 = df['views'].quantile(0.25)
    Q3 = df['views'].quantile(0.75)
    IQR = Q3 - Q1
    
    # Filter out extreme outliers
    filtered_df = df[~((df['views'] < (Q1 - 1.5 * IQR)) | (df['views'] > (Q3 + 1.5 * IQR)))]
    return filtered_df
