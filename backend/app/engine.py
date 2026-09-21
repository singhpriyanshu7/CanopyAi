from typing import Dict, Any, List

WEIGHTS = {
    "infrastructure_compatibility": 0.30,
    "root_safety": 0.25,
    "climate_suitability": 0.20,
    "space_availability": 0.15,
    "environmental_benefit": 0.10,
}

def score_tree(tree: Dict[str, Any], site: Dict[str, Any]) -> Dict[str, Any]:
    # Site indicators
    building_status = site.get("building_presence", {}).get("status", "error")
    building_nearby = site.get("building_presence", {}).get("nearby", False)

    utility_status = site.get("utilities", {}).get("status", "error")
    overhead_power = site.get("utilities", {}).get("overhead_power", False)

    footpath_status = site.get("footpath", {}).get("status", "error")
    footpath_present = site.get("footpath", {}).get("present", False)

    road_status = site.get("road_context", {}).get("status", "error")
    road_value = site.get("road_context", {}).get("value", "Unknown")

    data_limitations = []

    # 1. Infrastructure Compatibility
    infra_score = 100
    if building_status == "error":
        data_limitations.append("Building data unavailable (assumed moderate risk)")
        infra_score -= 25
    elif building_nearby:
        if tree["infrastructure_risk"] == "high": infra_score -= 60
        elif tree["infrastructure_risk"] == "medium": infra_score -= 30

    if utility_status == "error":
        data_limitations.append("Utility data unavailable (assumed moderate risk)")
        infra_score -= 25
    elif overhead_power:
        if tree["utility_clearance"] == "high": infra_score -= 60
        elif tree["utility_clearance"] == "medium": infra_score -= 30

    infra_score = max(0, infra_score)

    # 2. Root Safety
    root_score = 100
    if footpath_status == "error":
        data_limitations.append("Footpath data unavailable (assumed moderate risk)")
        root_score -= 25
    elif footpath_present:
        if tree["root_aggressiveness"] == "high": root_score -= 50
        elif tree["root_aggressiveness"] == "medium": root_score -= 20

    if road_value in ["residential", "living_street", "pedestrian", "footway"]:
        if tree["root_aggressiveness"] == "high": root_score -= 30

    root_score = max(0, root_score)

    # 3. Climate Suitability
    climate_base = 100 if tree["climate_suitability"] == "suitable" else (50 if tree["climate_suitability"] == "moderate" else 0)
    water_penalty = 0
    if tree["water_requirement"] == "high": water_penalty = 20
    elif tree["water_requirement"] == "medium": water_penalty = 10
    climate_score = max(0, climate_base - water_penalty)

    # 4. Space Availability
    space_score = 100
    if road_status == "error":
        data_limitations.append("Road context unavailable (assumed moderate space)")
        space_score -= 25
    else:
        narrow_roads = ["residential", "tertiary", "unclassified", "footway", "pedestrian", "path"]
        if road_value in narrow_roads:
            if tree["root_spread"] == "high": space_score -= 40
            elif tree["root_spread"] == "medium": space_score -= 20
            
            # Simple heuristic for canopy size penalty in narrow streets
            if "20" in tree["canopy_width"] or "25" in tree["canopy_width"] or "30" in tree["canopy_width"]:
                space_score -= 30

    space_score = max(0, space_score)

    # 5. Environmental Benefit
    env_score = 0
    if tree["shade_potential"] == "high": env_score += 50
    elif tree["shade_potential"] == "medium": env_score += 30
    else: env_score += 10

    if tree["native_status"] == "Native": env_score += 50
    else: env_score += 20
    env_score = min(100, env_score)

    # Overall Score
    overall = (
        infra_score * WEIGHTS["infrastructure_compatibility"] +
        root_score * WEIGHTS["root_safety"] +
        climate_score * WEIGHTS["climate_suitability"] +
        space_score * WEIGHTS["space_availability"] +
        env_score * WEIGHTS["environmental_benefit"]
    )

    # Reason Generation
    reason_parts = []
    if infra_score < 50: reason_parts.append("High infrastructure conflict.")
    if root_score < 50: reason_parts.append("Aggressive roots unsuitable for this pavement.")
    if env_score > 80: reason_parts.append("Excellent shade and native benefits.")
    if overall > 80: reason_parts.append("Highly compatible with site constraints.")
    elif overall > 60: reason_parts.append("Moderately compatible with site constraints.")
    
    if not reason_parts:
        reason_parts.append("Acceptable fit based on available data.")

    # Deduplicate data limitations
    data_limitations = list(set(data_limitations))

    return {
        "species": tree["species"],
        "common_name": tree["common_name"],
        "overall_score": round(overall, 1),
        "sub_scores": {
            "infrastructure_compatibility": infra_score,
            "root_safety": root_score,
            "climate_suitability": climate_score,
            "space_availability": space_score,
            "environmental_benefit": env_score
        },
        "root_conflict_risk": "High" if root_score < 40 else ("Medium" if root_score < 75 else "Low"),
        "infrastructure_conflict_risk": "High" if infra_score < 40 else ("Medium" if infra_score < 75 else "Low"),
        "climate_compatibility": "High" if climate_score > 75 else ("Medium" if climate_score > 40 else "Low"),
        "space_compatibility": "High" if space_score > 75 else ("Medium" if space_score > 40 else "Low"),
        "reason": " ".join(reason_parts),
        "data_limitations": data_limitations,
        "mature_height": tree.get("mature_height", "Unknown"),
        "canopy_width": tree.get("canopy_width", "Unknown"),
        "growth_rate": tree.get("growth_rate", "Unknown"),
        "water_requirement": tree.get("water_requirement", "Unknown"),
        "shade_potential": tree.get("shade_potential", "Unknown"),
        "native_status": tree.get("native_status", "Unknown"),
        "maintenance": tree.get("maintenance", "Unknown"),
        "annual_co2_sequestration_kg": tree.get("annual_co2_sequestration_kg", None),
        "co2_reference_source": tree.get("co2_reference_source", None),
        "image_urls": tree.get("image_urls", [])
    }

def rank_trees(site_data: Dict[str, Any], tree_dataset: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    print("RANK TREES CALLED. FIRST TREE IMAGE URLS:", tree_dataset[0].get("image_urls", "MISSING"))
    scored = [score_tree(tree, site_data) for tree in tree_dataset]
    scored.sort(key=lambda x: x["overall_score"], reverse=True)
    return scored[:5]
