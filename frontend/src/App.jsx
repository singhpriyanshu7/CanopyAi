import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import FocusedTreeView from './FocusedTreeView';
import CompareView from './CompareView';
import extendedData from './trees_extended.json';

// Read token securely from environment
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

const RiskBadge = ({ level, label }) => {
  const colors = {
    'Low': 'bg-emerald-100 text-emerald-800',
    'Medium': 'bg-amber-100 text-amber-800',
    'High': 'bg-red-100 text-red-800',
    'Unavailable': 'bg-gray-100 text-gray-800'
  };
  return (
    <div className="flex flex-col">
      <span className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</span>
      <span className={`text-xs px-2 py-1 rounded font-medium inline-block w-max mt-0.5 ${colors[level] || colors['Unavailable']}`}>
        {level}
      </span>
    </div>
  );
};

const TreeCard = ({ tree, rank, onClick }) => {
  const isTop = rank === 1;

  return (
    <div 
      onClick={onClick}
      className={`bg-white rounded-xl shadow-sm border border-gray-200 cursor-pointer hover:border-emerald-400 hover:shadow-md transition-all overflow-hidden`}
    >
      <div className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-start gap-3">
            <span className={`mt-1 w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-xs font-bold ${isTop ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
              {rank}
            </span>
            <div>
              <h3 className="text-lg font-bold text-gray-800 leading-tight">{tree.common_name}</h3>
              <p className="text-xs text-gray-500 italic">{tree.species}</p>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <div className={`text-2xl font-black ${isTop ? 'text-emerald-600' : 'text-gray-700'}`}>{tree.overall_score}</div>
            <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Score</div>
          </div>
        </div>
        
        {tree.data_limitations && tree.data_limitations.length > 0 && (
           <div className="mb-3 text-xs bg-amber-50 text-amber-800 p-2 rounded border border-amber-200">
             <strong>Note:</strong> {tree.data_limitations.join(", ")}
           </div>
        )}

        <div className="grid grid-cols-2 gap-y-3 gap-x-2 mb-2 mt-2">
          <RiskBadge level={tree.infrastructure_conflict_risk} label="Infra Risk" />
          <RiskBadge level={tree.root_conflict_risk} label="Root Risk" />
        </div>

        <div className="text-sm font-semibold text-emerald-600 mt-3 pt-3 border-t border-gray-100 flex items-center justify-between group">
          <span>View Tree Details</span>
          <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
        </div>
      </div>
    </div>
  );
};
const getFeatureRisk = (feature, site, tree) => {
  if (!site || !tree) return 'Unavailable';
  if (feature === 'Road') {
     if (site.road_context?.status === 'error') return 'Unavailable';
     return tree.space_compatibility === 'High' ? 'Low' : 
            (tree.space_compatibility === 'Medium' ? 'Medium' : 'High');
  }
  if (feature === 'Footpath') {
     if (site.footpath?.status === 'error') return 'Unavailable';
     if (!site.footpath?.present) return 'Low';
     return tree.root_conflict_risk;
  }
  if (feature === 'Building') {
     if (site.building_presence?.status === 'error') return 'Unavailable';
     if (!site.building_presence?.nearby) return 'Low';
     return tree.infrastructure_conflict_risk;
  }
  if (feature === 'Utilities') {
     if (site.utilities?.status === 'error') return 'Unavailable';
     if (!site.utilities?.overhead_power) return 'Low';
     return tree.infrastructure_conflict_risk;
  }
  return 'Unavailable';
};

const getBorderColor = (risk) => {
  switch (risk) {
    case 'Low': return 'border-emerald-500';
    case 'Medium': return 'border-amber-500';
    case 'High': return 'border-red-500';
    default: return 'border-gray-400';
  }
};

const getBgColor = (risk) => {
  switch (risk) {
    case 'Low': return 'bg-emerald-500';
    case 'Medium': return 'bg-amber-500';
    case 'High': return 'bg-red-500';
    default: return 'bg-gray-400';
  }
};

function App() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const marker = useRef(null);
  const riskMarkers = useRef([]);
  const plantingZoneId = 'planting-zone-layer';
  const plantingZoneSourceId = 'planting-zone-source';
  
  const [lng, setLng] = useState(null);
  const [lat, setLat] = useState(null);
  const [zoom, setZoom] = useState(13);
  
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState('');
  const [siteData, setSiteData] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  
  const [focusedTreeIndex, setFocusedTreeIndex] = useState(null);
  const [showCompareView, setShowCompareView] = useState(false);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === '#compare') {
        setShowCompareView(true);
        setFocusedTreeIndex(null);
        return;
      }
      setShowCompareView(false);
      
      if (hash.startsWith('#tree-')) {
        const idx = parseInt(hash.replace('#tree-', ''), 10);
        if (!isNaN(idx)) {
          setFocusedTreeIndex(idx);
          return;
        }
      }
      setFocusedTreeIndex(null);
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // check on initial load
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    if (map.current) return;
    
    if (!mapboxgl.accessToken) {
      console.error("Mapbox token is missing!");
      return;
    }
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-122.4194, 37.7749],
      zoom: zoom
    });

    map.current.on('click', (e) => {
      const coordinates = e.lngLat;
      setLng(coordinates.lng.toFixed(4));
      setLat(coordinates.lat.toFixed(4));
      
      setSiteData(null);
      setRecommendations(null);
      setAnalysisError('');
      window.location.hash = ''; // reset selection

      if (!marker.current) {
        marker.current = new mapboxgl.Marker({ color: '#059669' })
          .setLngLat([coordinates.lng, coordinates.lat])
          .addTo(map.current);
      } else {
        marker.current.setLngLat([coordinates.lng, coordinates.lat]);
      }
    });
  }, [zoom]);

  useEffect(() => {
    if (!map.current) return;

    // Clear existing markers
    riskMarkers.current.forEach(m => m.remove());
    riskMarkers.current = [];

    // Clear existing layer
    if (map.current.getLayer(plantingZoneId)) {
      map.current.removeLayer(plantingZoneId);
    }
    if (map.current.getSource(plantingZoneSourceId)) {
      map.current.removeSource(plantingZoneSourceId);
    }

    if (recommendations && recommendations.length > 0 && siteData && lat && lng) {
      const topTree = recommendations[focusedTreeIndex !== null ? focusedTreeIndex : 0];
      
      // 1. Draw Planting Zone
      map.current.addSource(plantingZoneSourceId, {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          }
        }
      });

      map.current.addLayer({
        id: plantingZoneId,
        type: 'circle',
        source: plantingZoneSourceId,
        paint: {
          'circle-radius': 50,
          'circle-color': '#10b981',
          'circle-opacity': 0.15,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#10b981'
        }
      });

      // 2. Draw Risk Markers
      const features = [
        { name: 'Road', offset: [0, -70] },
        { name: 'Footpath', offset: [70, 0] },
        { name: 'Building', offset: [0, 70] },
        { name: 'Utilities', offset: [-70, 0] }
      ];

      features.forEach(f => {
        const risk = getFeatureRisk(f.name, siteData, topTree);
        const el = document.createElement('div');
        el.className = `flex flex-col items-center justify-center bg-white/95 backdrop-blur-sm rounded shadow p-1 border-2 ${getBorderColor(risk)} pointer-events-none`;
        el.innerHTML = `
          <span class="text-[10px] font-bold text-gray-700 whitespace-nowrap">${f.name}</span>
          <span class="text-[9px] px-1 rounded text-white ${getBgColor(risk)}">${risk}</span>
        `;

        const m = new mapboxgl.Marker({ 
          element: el, 
          offset: f.offset,
          anchor: 'center'
        })
          .setLngLat([parseFloat(lng), parseFloat(lat)])
          .addTo(map.current);
        
        riskMarkers.current.push(m);
      });
    }

  }, [recommendations, siteData, lat, lng, focusedTreeIndex]);

  const handleAnalyze = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!lat || !lng) return;
    setAnalyzing(true);
    setAnalysisError('');
    setSiteData(null);
    setRecommendations(null);
    window.location.hash = ''; // ensure we exit focus mode
    
    try {
      // Step A: Call POST /analyze-location
      const analyzeResponse = await fetch('http://127.0.0.1:8001/analyze-location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ latitude: parseFloat(lat), longitude: parseFloat(lng) }),
      });
      
      if (!analyzeResponse.ok) {
        throw new Error('Failed to analyze location');
      }
      
      const siteDataResult = await analyzeResponse.json();
      
      // Step B: Display the returned site constraints
      setSiteData(siteDataResult);
      
      // Step C: Call POST /recommend-trees
      const recResponse = await fetch('http://127.0.0.1:8001/recommend-trees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          latitude: parseFloat(lat), 
          longitude: parseFloat(lng),
          site_analysis: siteDataResult
        }),
      });
      
      if (!recResponse.ok) {
        throw new Error('Failed to fetch recommendations');
      }
      
      const recData = await recResponse.json();
      
      // Enrich data with extended fields from local trees_extended.json 
      const recs = recData.recommendations || recData;
      if (recs) {
        const enriched = recs.map(tree => {
          const match = extendedData && Array.isArray(extendedData) ? extendedData.find(t => t.species === tree.species) : null;
          if (match) {
            return {
              ...match, // add all fields (water_requirement, co2, etc)
              ...tree   // overwrite with backend computed scores
            };
          }
          return tree;
        });
        setRecommendations(enriched);
      }
      
      // Safe merging complete
    } catch (err) {
      setAnalysisError('Error analyzing location or fetching recommendations. Please try again.');
      console.error("Analysis Error:", err);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-50 text-gray-800 font-sans relative">
      
      {/* SIDEBAR */}
      <div className="w-96 flex flex-col bg-white shadow-xl z-30 p-6 overflow-y-auto shrink-0 relative">
        <h1 className="text-3xl font-bold text-emerald-700 mb-2">CanopyAI</h1>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
          Urban tree and infrastructure compatibility system. Select a street-level location to analyze planting viability.
        </p>

        <div className="flex-1">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">Location Details</h2>
          
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 mb-6">
            {lat && lng ? (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-sm">Latitude</span>
                  <span className="font-mono font-medium">{lat}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-sm">Longitude</span>
                  <span className="font-mono font-medium">{lng}</span>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-sm text-center py-4">
                Click anywhere on the map to select a planting location.
              </p>
            )}
          </div>

          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">Site Constraints</h2>
          
          {siteData?.error_message && (
            <div className="mb-4 text-sm text-amber-800 bg-amber-50 p-3 rounded-lg border border-amber-200 shadow-sm">
              {siteData.error_message}
            </div>
          )}

          <div className="space-y-3">
            <div className="flex flex-col p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">Road Context</span>
                {siteData?.road_context ? (
                  <span className={`text-xs px-2 py-1 rounded capitalize font-medium ${siteData.road_context.status === 'error' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-700'}`}>
                    {siteData.road_context.value}
                  </span>
                ) : (
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-500">Pending</span>
                )}
              </div>
              {siteData?.road_context && <span className="text-xs text-gray-400">Source: {siteData.road_context.data_source}</span>}
            </div>
            
            <div className="flex flex-col p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">Footpath</span>
                {siteData?.footpath ? (
                  <span className={`text-xs px-2 py-1 rounded font-medium ${siteData.footpath.status === 'error' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-700'}`}>
                    {siteData.footpath.status === 'error' ? 'Unavailable' : (siteData.footpath.present ? 'Present' : 'Not Detected')}
                  </span>
                ) : (
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-500">Pending</span>
                )}
              </div>
              {siteData?.footpath && (
                <div className="text-xs text-gray-400 flex flex-col mt-1">
                  <span>Width: {siteData.footpath.width}</span>
                  <span>Source: {siteData.footpath.data_source}</span>
                </div>
              )}
            </div>
            
            <div className="flex flex-col p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">Building Proximity</span>
                {siteData?.building_presence ? (
                  <span className={`text-xs px-2 py-1 rounded font-medium ${siteData.building_presence.status === 'error' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-700'}`}>
                    {siteData.building_presence.status === 'error' ? 'Unavailable' : (siteData.building_presence.nearby ? 'Nearby (<50m)' : 'Clear')}
                  </span>
                ) : (
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-500">Pending</span>
                )}
              </div>
              {siteData?.building_presence && <span className="text-xs text-gray-400">Source: {siteData.building_presence.data_source}</span>}
            </div>

            <div className="flex flex-col p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">Utilities</span>
                {siteData?.utilities ? (
                  <span className={`text-xs px-2 py-1 rounded font-medium ${siteData.utilities.status === 'error' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-700'}`}>
                    {siteData.utilities.status === 'error' ? 'Unavailable' : (siteData.utilities.overhead_power ? 'Powerlines Detected' : 'Clear (Overhead)')}
                  </span>
                ) : (
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-500">Pending</span>
                )}
              </div>
              {siteData?.utilities && (
                <div className="text-xs text-gray-400 flex flex-col mt-1">
                  <span>Underground: {siteData.utilities.underground}</span>
                  <span>Source: {siteData.utilities.data_source}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100">
          <button 
            onClick={handleAnalyze}
            disabled={!lat || !lng || analyzing}
            className={`w-full py-3 px-4 rounded-lg font-bold text-white transition-all flex justify-center items-center shadow-sm ${
              !lat || !lng 
                ? 'bg-gray-300 cursor-not-allowed' 
                : analyzing 
                  ? 'bg-emerald-500 opacity-75 cursor-wait' 
                  : 'bg-emerald-600 hover:bg-emerald-700 hover:shadow-md active:bg-emerald-800'
            }`}
          >
            {analyzing ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Analyzing Site...
              </span>
            ) : 'Analyze Site & Recommend Trees'}
          </button>
          
          {analysisError && (
            <div className="mt-4 text-sm text-red-700 bg-red-50 p-3 rounded-lg border border-red-200">
              {analysisError}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT WORKSPACE AREA */}
      <div className="flex-1 flex relative">
        {/* MAP AREA (always mounted, optionally hidden or underneath) */}
        <div className="absolute inset-0 flex">
          <div className="flex-1 relative bg-gray-200 flex items-center justify-center">
            {!mapboxgl.accessToken && (
              <div className="text-red-500 font-medium z-20 bg-white p-4 rounded shadow">
                Error: VITE_MAPBOX_TOKEN is missing or invalid.
              </div>
            )}
            <div ref={mapContainer} className="absolute inset-0 w-full h-full" />
            
            {/* LEGEND */}
            {recommendations && (
              <div className="absolute bottom-6 left-6 bg-white/95 p-4 rounded-xl shadow-lg z-10 text-xs backdrop-blur-sm border border-gray-200 w-64 pointer-events-none">
                <h3 className="font-bold text-gray-800 mb-3 text-sm">Site Risk Visualization</h3>
                
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-5 h-5 rounded-full bg-emerald-500 opacity-20 border-2 border-emerald-500 flex-shrink-0"></div>
                  <span className="text-gray-700 font-medium">Estimated Planting Zone</span>
                </div>
                
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-2">Conflict Risk</p>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-emerald-500 flex-shrink-0"></div>
                      <span className="text-gray-600">Low Risk</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-amber-500 flex-shrink-0"></div>
                      <span className="text-gray-600">Medium Risk</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500 flex-shrink-0"></div>
                      <span className="text-gray-600">High Risk</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-gray-400 flex-shrink-0"></div>
                      <span className="text-gray-600">Unavailable Data</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2 text-[9px] text-gray-400 leading-tight">
                  * Zones and risks are estimated based on available mapped data. Not a legal survey boundary. Manual survey required before planting.
                </div>
              </div>
            )}
          </div>

          {/* RECOMMENDATIONS PANEL */}
        {recommendations && (
          <div className="w-[420px] bg-gray-50 flex flex-col shadow-2xl z-20 border-l border-gray-200 overflow-y-auto shrink-0">
            <div className="p-6 bg-emerald-800 text-white sticky top-0 z-10 shadow-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Top Recommendations</h2>
                <span className="bg-emerald-700 text-emerald-100 text-xs px-2 py-1 rounded font-medium border border-emerald-600">
                  {recommendations.length} results
                </span>
              </div>
              <button 
                onClick={() => { window.location.hash = '#compare'; }} 
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold py-2 rounded shadow-sm border border-emerald-500 transition-colors"
              >
                Compare Trees
              </button>
              <p className="text-xs text-emerald-200 opacity-90 mt-3 leading-relaxed">
                Trees ranked by compatibility with current site infrastructure, space, and climate constraints.
              </p>
            </div>
            
            <div className="p-4 space-y-4">
               {recommendations.map((tree, idx) => (
                  <TreeCard 
                    key={tree.species} 
                    tree={tree} 
                    rank={idx + 1} 
                    onClick={() => { window.location.hash = `#tree-${idx}`; }}
                  />
               ))}
            </div>
          </div>
        )}
      </div>

      {/* COMPARE VIEW */}
      {showCompareView && recommendations && (
        <CompareView 
          trees={recommendations} 
          onClose={() => { window.location.hash = ''; }} 
        />
      )}

      {/* FOCUSED TREE VIEW */}
        {focusedTreeIndex !== null && recommendations && recommendations[focusedTreeIndex] && (
          <FocusedTreeView 
            tree={recommendations[focusedTreeIndex]} 
            onClose={() => { window.location.hash = ''; }} 
          />
        )}
      </div>
      
    </div>
  );
}

export default App;
