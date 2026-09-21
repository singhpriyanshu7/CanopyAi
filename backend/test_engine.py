import json
from app.engine import score_tree, rank_trees
from app.data_layer import load_tree_dataset

def run_tests():
    trees = load_tree_dataset()
    
    # 1. Normal Site (Wide road, no footpath conflicts, no overhead power)
    site_normal = {
        "road_context": {"value": "primary", "status": "measured"},
        "footpath": {"present": False, "status": "measured"},
        "building_presence": {"nearby": False, "status": "measured"},
        "utilities": {"overhead_power": False, "status": "measured"}
    }
    recs_normal = rank_trees(site_normal, trees)
    assert len(recs_normal) <= 5
    assert recs_normal[0]["overall_score"] > 80, "Expected high score for normal site"
    print("Normal Site Test Passed")

    # 2. Limited Planting Space (Narrow road, footpath present)
    site_limited = {
        "road_context": {"value": "residential", "status": "measured"},
        "footpath": {"present": True, "status": "measured"},
        "building_presence": {"nearby": False, "status": "measured"},
        "utilities": {"overhead_power": False, "status": "measured"}
    }
    recs_limited = rank_trees(site_limited, trees)
    # Check that high root aggressiveness trees are penalized
    peepal_score = score_tree(next(t for t in trees if t["species"] == "Ficus religiosa"), site_limited)["sub_scores"]["root_safety"]
    # peepal has high aggressiveness, so root score should be penalized heavily
    assert score_tree(next(t for t in trees if t["species"] == "Ficus religiosa"), site_limited)["sub_scores"]["root_safety"] < 50
    print("Limited Planting Space Test Passed")

    # 3. High Infrastructure-Risk Site (Nearby buildings, overhead power)
    site_high_risk = {
        "road_context": {"value": "primary", "status": "measured"},
        "footpath": {"present": False, "status": "measured"},
        "building_presence": {"nearby": True, "status": "measured"},
        "utilities": {"overhead_power": True, "status": "measured"}
    }
    recs_high_risk = rank_trees(site_high_risk, trees)
    # Check that high infra risk trees are penalized
    banyan_infra = score_tree(next(t for t in trees if t["species"] == "Ficus benghalensis"), site_high_risk)["sub_scores"]["infrastructure_compatibility"]
    assert banyan_infra < 50
    print("High Infrastructure-Risk Test Passed")

    # 4. Missing/Unavailable Site Data
    site_missing = {
        "road_context": {"value": "Unavailable", "status": "error"},
        "footpath": {"present": False, "status": "error"},
        "building_presence": {"nearby": False, "status": "error"},
        "utilities": {"overhead_power": False, "status": "error"}
    }
    recs_missing = rank_trees(site_missing, trees)
    assert len(recs_missing[0]["data_limitations"]) > 0
    # The scores should be penalized gracefully, meaning overall score is around 50-70 max
    assert recs_missing[0]["overall_score"] < 90, "Missing data should not yield perfect scores"
    print("Missing Data Test Passed")

if __name__ == "__main__":
    run_tests()
    print("All tests passed.")
