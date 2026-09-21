import json
import os
from typing import List, Dict, Any

DATA_FILE = os.path.join(os.path.dirname(__file__), "data", "trees.json")

def load_tree_dataset() -> List[Dict[str, Any]]:
    """
    Loads the tree species dataset from the local JSON file.
    Returns a list of dictionaries, each representing a tree species.
    """
    if not os.path.exists(DATA_FILE):
        raise FileNotFoundError(f"Tree dataset not found at {DATA_FILE}")
        
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        trees = json.load(f)
        
    return trees

def get_tree_by_species(species_name: str) -> Dict[str, Any]:
    """
    Finds a specific tree by its scientific species name.
    """
    trees = load_tree_dataset()
    for tree in trees:
        if tree.get("species", "").lower() == species_name.lower():
            return tree
    return None
