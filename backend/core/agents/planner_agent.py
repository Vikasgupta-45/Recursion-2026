from typing import Dict, Any, List

def plan_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Planner Agent: Responsible for Step 4 Create Plan.
    Breaks down the high-level strategy into execution tasks.
    """
    print("\n[Planner Agent] Translating strategy into an actionable plan.")
    
    strategy = state.get("strategy", {})
    channels = strategy.get("recommended_channels", ["Basic Posting"])
    
    # 4. Create Plan
    plan_tasks = []
    task_id = 1
    
    for channel in channels:
        plan_tasks.append({
            "task_id": task_id,
            "description": f"Setup campaigns and content for {channel}",
            "assignee": f"{channel} Coordinator",
            "deadline": "Day 7",
            "status": "pending"
        })
        task_id += 1
        
    execution_plan = {
        "timeline": "30 Days Execution Framework",
        "tasks": plan_tasks,
        "success_kpis": [
            "100% setup completion",
            "At least 5% conversion rate on new channels"
        ]
    }
    
    print(f"[Planner Agent] Created plan with {len(plan_tasks)} major tasks.")
    
    return {
        "plan": execution_plan,
        "current_step": "plan_complete"
    }

if __name__ == "__main__":
    # Test
    res = plan_node({"strategy": {"recommended_channels": ["TikTok", "Instagram"]}})
    print(res)
