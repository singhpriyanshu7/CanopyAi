from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import httpx
import asyncio

app = FastAPI(title="CanopyAI", description="Minimal backend foundation")

# Allow CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class LocationRequest(BaseModel):
    latitude: float
    longitude: float

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "CanopyAI Backend"}

@app.post("/analyze-location")
async def analyze_location(loc: LocationRequest):
    overpass_url = "https://overpass-api.de/api/interpreter"
    
    # Query for roads, footways, buildings, and power lines within 50 meters
    radius = 50
    overpass_query = f"""
    [out:json];
    (
      way["highway"](around:{radius},{loc.latitude},{loc.longitude});
      way["building"](around:{radius},{loc.latitude},{loc.longitude});
      way["power"](around:{radius},{loc.latitude},{loc.longitude});
      node["power"](around:{radius},{loc.latitude},{loc.longitude});
    );
    out body;
    >;
    out skel qt;
    """

    max_retries = 2
    retry_delay = 2.0  # seconds
    
    data = None
    overpass_error = None

    for attempt in range(max_retries + 1):
        try:
            async with httpx.AsyncClient() as client:
                headers = {"User-Agent": "CanopyAI/1.0 (Hackathon Project)"}
                response = await client.post(overpass_url, data={'data': overpass_query}, headers=headers, timeout=15.0)
                response.raise_for_status()
                data = response.json()
                break # Success
        except (httpx.RequestError, httpx.HTTPStatusError) as e:
            overpass_error = str(e)
            if attempt < max_retries:
                await asyncio.sleep(retry_delay)
            else:
                pass # All retries exhausted

    if data is None:
        # Fallback response when OSM fails completely
        return {
            "road_context": {
                "value": "Unavailable",
                "data_source": "OpenStreetMap",
                "status": "error"
            },
            "footpath": {
                "present": False,
                "width": "Unavailable",
                "data_source": "OpenStreetMap",
                "status": "error"
            },
            "building_presence": {
                "nearby": False,
                "data_source": "OpenStreetMap",
                "status": "error"
            },
            "utilities": {
                "overhead_power": False,
                "underground": "Unavailable",
                "data_source": "OpenStreetMap",
                "status": "error"
            },
            "error_message": f"OSM analysis temporarily unavailable: {overpass_error}"
        }

    elements = data.get("elements", [])
    
    # Analysis variables
    road_types = []
    footpath_present = False
    building_present = False
    power_present = False

    for el in elements:
        tags = el.get("tags", {})
        
        # Check highway
        if "highway" in tags:
            hw = tags["highway"]
            if hw in ["footway", "path", "pedestrian", "steps"]:
                footpath_present = True
            else:
                road_types.append(hw)
            
            # Check for sidewalk tag on main roads
            if "sidewalk" in tags and tags["sidewalk"] not in ["no", "none"]:
                footpath_present = True

        # Check building
        if "building" in tags:
            building_present = True

        # Check power
        if "power" in tags:
            power_present = True

    road_context = road_types[0] if road_types else "Unknown"

    return {
        "road_context": {
            "value": road_context,
            "data_source": "OpenStreetMap",
            "status": "measured" if road_types else "unavailable"
        },
        "footpath": {
            "present": footpath_present,
            "width": "Unavailable (Requires manual survey)",
            "data_source": "OpenStreetMap",
            "status": "measured" if footpath_present else "estimated"
        },
        "building_presence": {
            "nearby": building_present,
            "data_source": "OpenStreetMap",
            "status": "measured"
        },
        "utilities": {
            "overhead_power": power_present,
            "underground": "Unavailable (Cannot be detected from maps)",
            "data_source": "OpenStreetMap",
            "status": "measured" if power_present else "unavailable"
        }
    }

from app.data_layer import load_tree_dataset
from app.engine import rank_trees

@app.get("/trees")
def get_trees():
    """Returns the urban tree species dataset."""
    try:
        trees = load_tree_dataset()
        return {"count": len(trees), "trees": trees}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class RecommendRequest(BaseModel):
    latitude: float
    longitude: float
    site_analysis: dict

@app.post("/recommend-trees")
async def recommend_trees(req: RecommendRequest):
    """Analyzes the location and returns top tree recommendations."""
    # Use the site data provided by the frontend
    site_data = req.site_analysis
    
    # 2. Get dataset
    try:
        trees = load_tree_dataset()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load tree dataset: {str(e)}")
        
    # 3. Score and rank
    recommendations = rank_trees(site_data, trees)
    
    return {
        "site_analysis": site_data,
        "recommendations": recommendations
    }

from app.ai_explainer import explain_tree_recommendation

class ExplainRequest(BaseModel):
    tree_data: dict

@app.post("/explain-recommendation")
async def explain_recommendation(req: ExplainRequest):
    """Generates an AI explanation for why a tree was recommended."""
    explanation = explain_tree_recommendation(req.tree_data)
    return {"explanation": explanation}
