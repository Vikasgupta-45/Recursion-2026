from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

def detect_content_gaps(creator_titles: list, market_trending_titles: list) -> list:
    """
    NLP module that uses TF-IDF and Cosine Similarity to find high-demand 
    topics the creator HAS NOT YET covered (Content Gaps).
    """
    if not creator_titles or not market_trending_titles:
        return []
        
    vectorizer = TfidfVectorizer(stop_words='english')
    # Fit the vectorizer on all the combined titles to build vocabulary
    all_titles = creator_titles + market_trending_titles
    vectorizer.fit(all_titles)
    
    creator_vecs = vectorizer.transform(creator_titles)
    market_vecs = vectorizer.transform(market_trending_titles)
    
    gaps = []
    # Cross-reference every trending topic against the creator's video history
    sim_matrix = cosine_similarity(market_vecs, creator_vecs)
    
    for i, trend_title in enumerate(market_trending_titles):
        # The highest similarity score between this trend and ANY creator video
        max_sim = np.max(sim_matrix[i]) if sim_matrix[i].size > 0 else 0
        
        if max_sim < 0.15: # Low similarity means the creator hasn't covered this! GAP!
            gaps.append({
                "topic_opportunity": trend_title,
                "demand": "High",
                "competition": "Medium",
                "your_coverage": "Low",
                "similarity_score": round(max_sim, 2),
                "recommendation": "Create 5 videos exploring this trending gap."
            })
            
    # Return the widest gaps (lowest similarity)
    return sorted(gaps, key=lambda x: x['similarity_score'])[:3]
