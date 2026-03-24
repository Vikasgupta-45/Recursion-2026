from typing import Dict, Any, TypedDict, Literal
from langgraph.graph import StateGraph, START, END
from langchain_core.messages import BaseMessage, HumanMessage

from .analytics_agent import analyze_node
from .strategy_agent import strategy_node
from .planner_agent import plan_node

# --- Define the State ---
class AgenticFlowState(TypedDict):
    """
    State representing the multi-agent workflow context.
    Using TypedDict which is standard for LangGraph to keep track of variables across nodes.
    """
    messages: list[BaseMessage]
    analysis: Dict[str, Any]
    strategy: Dict[str, Any]
    plan: Dict[str, Any]
    current_step: str

# --- Advanced Manager Routing Logic ---
def manager_router(state: AgenticFlowState) -> Literal["analytics_agent", "strategy_agent", "planner_agent", "__end__"]:
    """
    Manager Agent Decisions:
    Decides the next node to route to based on state evaluation.
    This creates an intelligent and dynamic orchestration layer.
    """
    # Step 1 Check
    if not state.get("analysis"):
        print("\n[Manager Agent] Decision: Missing analysis. Routing to Analytics Agent (Step 1).")
        return "analytics_agent"
    
    # Step 2 & 3 Check
    if not state.get("strategy"):
        print("\n[Manager Agent] Decision: Analysis complete. Routing to Strategy Agent (Step 2 & Step 3).")
        return "strategy_agent"
    
    # Step 4 Check
    if not state.get("plan"):
        print("\n[Manager Agent] Decision: Strategy generated. Routing to Planner Agent (Step 4).")
        return "planner_agent"
    
    print("\n[Manager Agent] Decision: Plan finalized. Terminating Workflow.")
    return "__end__"

# A pass-through manager node, if we want the manager to do active state transformations.
def manager_node(state: AgenticFlowState) -> Dict[str, Any]:
    # We can use an LLM here to analyze the state to dynamically determine next steps if needed.
    return state
    
# --- Building the Orchestration Graph ---
def build_graph() -> Any:
    workflow = StateGraph(AgenticFlowState)
    
    # 1. Add Nodes (Agents)
    workflow.add_node("manager", manager_node)
    workflow.add_node("analytics_agent", analyze_node)
    workflow.add_node("strategy_agent", strategy_node)
    workflow.add_node("planner_agent", plan_node)
    
    # 2. Add Edges (Conversational / Agentic Flow)
    workflow.add_edge(START, "manager")
    
    # Manager conditionally routes to the appropriate agent based on its evaluation
    workflow.add_conditional_edges("manager", manager_router)
    
    # Each Sub-Agent returns control back to the Manager to verify completion
    workflow.add_edge("analytics_agent", "manager")
    workflow.add_edge("strategy_agent", "manager")
    workflow.add_edge("planner_agent", "manager")
    
    # 3. Compile Graph
    agent_app = workflow.compile()
    return agent_app

class AgentOrchestrator:
    """
    Advanced agent orchestrator wrapper for simple usage.
    """
    def __init__(self):
        self.app = build_graph()
        
    def run_flow(self, user_query: str) -> Dict[str, Any]:
        """
        Executes the manager flow and handles all Agent interactions.
        """
        initial_state = {
            "messages": [HumanMessage(content=user_query)],
            "analysis": {},
            "strategy": {},
            "plan": {},
            "current_step": "initialize"
        }
        
        print(f"\n{'='*50}\nStarting Multi-Agent Orchestration\n{'='*50}")
        final_state = self.app.invoke(initial_state)
        print(f"\n{'='*50}\nMulti-Agent Orchestration Completed Successfully.\n{'='*50}")
        return final_state

if __name__ == "__main__":
    # Test the Advanced Orchestration Layer
    orchestrator = AgentOrchestrator()
    result = orchestrator.run_flow(user_query="How do I grow my tech-focused YouTube channel fast in 30 days?")
    
    print("\n\n--- Final Output Summary ---")
    print(f"Strategy Recommended: {result['strategy'].get('core_objective')}")
    print(f"Total Actionable Tasks: {len(result['plan'].get('tasks', []))}")
