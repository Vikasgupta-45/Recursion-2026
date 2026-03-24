from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.cluster import KMeans

def cluster_trending_topics(titles: list, n_clusters: int = 3) -> dict:
    """Unsupervised KMeans clustering to group raw video titles into Niche Topics."""
    if len(titles) < n_clusters:
        return {"clusters": "Not enough data"}
        
    vec = TfidfVectorizer(stop_words='english')
    X = vec.fit_transform(titles)
    
    # Train KMeans Model
    kmeans = KMeans(n_clusters=n_clusters, random_state=42)
    kmeans.fit(X)
    
    clusters = {}
    for title, label in zip(titles, kmeans.labels_):
        cluster_name = f"Cluster Group {label+1}"
        if cluster_name not in clusters:
            clusters[cluster_name] = []
        clusters[cluster_name].append(title)
        
    return clusters
