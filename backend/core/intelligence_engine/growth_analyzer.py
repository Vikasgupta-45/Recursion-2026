def calculate_channel_velocity(recent_growth_rate: float) -> dict:
    """Determines the velocity trajectory for the channel health score."""
    status = "Accelerating" if recent_growth_rate > 5.0 else "Stagnant"
    return {
        "growth_status": status,
        "velocity_score": round(recent_growth_rate * 1.5, 2)
    }
