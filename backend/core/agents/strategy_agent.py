from typing import Dict, Any, List

def strategy_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Strategy Agent: Responsible for Steps 2 and 3
    - Step 2: Detect Opportunity based on Analytics context
    - Step 3: Generate Strategy
    """
    print("\n[Strategy Agent] Scanning for opportunities and generating strategy...")
    
    analytics = state.get("analysis", {})
    metrics = analytics.get("metrics", {})
    
    # 2. Detect opportunity
    if metrics.get("market_demand", 0) > 80:
        opportunity = "High market demand identified indicating untapped short term growth potential."
        urgency = "high"
    else:
        opportunity = "Steady market demand indicating long term positioning advantage."
        urgency = "medium"
        
    print(f"[Strategy Agent] Identified opportunity: {opportunity}")
    
    # 3. Generate strategy
    strategy = {
        "core_objective": "Dominate local keyword rankings within 30 days.",
        "opportunity": opportunity,
        "urgency": urgency,
        "recommended_channels": ["YouTube", "Email Newsletter"],
        "budget_allocation": (60, 40)
    }
    
    print("[Strategy Agent] Strategy generated successfully.")
    
    return {
        "strategy": strategy,
        "current_step": "strategy_complete"
    }

if __name__ == "__main__":
    # Test
    res = strategy_node({"analysis": {"metrics": {"market_demand": 85}}})
    print(res)
