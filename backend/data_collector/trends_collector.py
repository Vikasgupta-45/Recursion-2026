from pytrends.request import TrendReq

def fetch_trends_for_topic(keyword: str) -> dict:
    """Fetches real global interest trends using Google Trends API."""
    try:
        pytrend = TrendReq(hl='en-US', tz=360)
        pytrend.build_payload(kw_list=[keyword], timeframe='today 3-m')
        df = pytrend.interest_over_time()
        
        if df.empty:
            return {"error": "No trend data found"}
            
        # Clean up data specifically for our dashboard
        df = df.drop(columns=['isPartial'])
        
        # Format the last 30 days as a timeseries
        recent_trends = df.tail(30).to_dict()[keyword]
        
        return {
            "keyword": keyword,
            "trend_data": recent_trends,
            "current_score": df[keyword].iloc[-1]
        }
    except Exception as e:
         return {"error": str(e)}
