import os
import json
from typing import Dict, Any

# Simple deterministic fallback
def generate_fallback_explanation(tree_data: Dict[str, Any]) -> str:
    common_name = tree_data.get("common_name", "this tree")
    overall = tree_data.get("overall_score", 0)
    infra = tree_data.get("sub_scores", {}).get("infrastructure_compatibility", 0)
    root = tree_data.get("sub_scores", {}).get("root_safety", 0)
    climate = tree_data.get("sub_scores", {}).get("climate_suitability", 0)
    space = tree_data.get("sub_scores", {}).get("space_availability", 0)
    env = tree_data.get("sub_scores", {}).get("environmental_benefit", 0)
    
    limits = tree_data.get("data_limitations", [])
    limit_text = "Most required site inputs are available."
    if len(limits) > 0:
        limit_text = f"Data unavailable \u2014 manual verification required for: {', '.join(limits)}."

    risk_infra = tree_data.get("infrastructure_conflict_risk", "Unknown")
    risk_root = tree_data.get("root_conflict_risk", "Unknown")

    return f"""WHY THIS TREE?
CanopyAI recommends {common_name} with an overall compatibility score of {overall}/100 based on your site's specific constraints.

KEY FACTORS
- Infrastructure: {infra}/100. Conflict risk is {risk_infra}.
- Root safety: {root}/100. Conflict risk is {risk_root}.
- Climate: {climate}/100.
- Space: {space}/100.
- Environmental impact: {env}/100.

DATA LIMITATIONS
{limit_text}

FUTURE OUTLOOK
Potential future interaction: Canopy expansion and root growth may gradually reduce available clearance near infrastructure over the next decade. Mitigate by maintaining recommended clearance distances.
"""

def explain_tree_recommendation(tree_data: Dict[str, Any]) -> str:
    api_key = os.environ.get("GEMINI_API_KEY", "")
    if not api_key:
        return generate_fallback_explanation(tree_data)
    
    try:
        import urllib.request
        import urllib.error
        
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
        
        prompt = f"""You are an explanation layer for CanopyAI. Explain only the structured facts provided to you. Never invent facts or measurements. Never change or reinterpret the recommendation score. If information is unavailable, explicitly state that it is unavailable.

Here is the structured data for the recommended tree:
{json.dumps(tree_data, indent=2)}

Return the explanation in exactly this format:

WHY THIS TREE?
(A short 2-3 sentence explanation)

KEY FACTORS
Infrastructure: ...
Root safety: ...
Climate: ...
Space: ...
Environmental impact: ...

DATA LIMITATIONS
(Mention unavailable data and required manual verification based on data_limitations)

FUTURE OUTLOOK
(Explain the existing future infrastructure-risk assessment and mitigation recommendations)
"""
        
        data = {
            "contents": [{
                "parts": [{"text": prompt}]
            }],
            "generationConfig": {
                "temperature": 0.2
            }
        }
        
        req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers={'Content-Type': 'application/json'})
        with urllib.request.urlopen(req, timeout=10) as response:
            result = json.loads(response.read().decode('utf-8'))
            text = result['candidates'][0]['content']['parts'][0]['text']
            return text.strip()
            
    except Exception as e:
        print(f"AI Explanation failed: {e}")
        return generate_fallback_explanation(tree_data)
