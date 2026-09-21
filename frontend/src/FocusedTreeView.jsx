import React, { useState, useEffect } from 'react';

const RiskBadge = ({ level, label }) => {
  const colors = {
    'Low': 'bg-emerald-100 text-emerald-800 border border-emerald-200',
    'Medium': 'bg-amber-100 text-amber-800 border border-amber-200',
    'High': 'bg-rose-100 text-rose-800 border border-rose-200',
    'Unavailable': 'bg-gray-100 text-gray-800 border border-gray-200',
  };
  return (
    <div className="flex flex-col bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
      <span className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">{label}</span>
      <span className={`text-sm px-2 py-1 rounded font-bold inline-block w-max ${colors[level] || colors['Unavailable']}`}>
        {level}
      </span>
    </div>
  );
};

const ProgressBar = ({ label, value }) => (
  <div className="mb-3">
    <div className="flex justify-between text-xs mb-1">
      <span className="font-bold text-gray-700">{label}</span>
      <span className="font-bold text-gray-900">{value}/100</span>
    </div>
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div 
        className={`h-2 rounded-full ${value >= 80 ? 'bg-emerald-500' : value >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
        style={{ width: `${value}%` }}
      ></div>
    </div>
  </div>
);

const TreeSVG = ({ scale, canopyAspect = 1, className = "" }) => {
  const scaleX = Math.max(0.7, Math.min(1.4, canopyAspect));
  return (
    <svg 
      width="100%" 
      height="100%" 
      viewBox="0 0 200 240" 
      preserveAspectRatio="xMidYMax meet"
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={`transition-transform duration-700 ease-out origin-bottom ${className}`}
      style={{ transform: `scale(${scale})` }}
    >
      <defs>
        <linearGradient id="trunkGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#5c3a21" />
          <stop offset="30%" stopColor="#8b5a33" />
          <stop offset="80%" stopColor="#704321" />
          <stop offset="100%" stopColor="#4a2c16" />
        </linearGradient>
        
        <linearGradient id="canopyGradMain" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="60%" stopColor="#059669" />
          <stop offset="100%" stopColor="#064e3b" />
        </linearGradient>
        
        <linearGradient id="canopyGradHighlight" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6ee7b7" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>

        <linearGradient id="canopyGradShadow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#047857" />
          <stop offset="100%" stopColor="#022c22" />
        </linearGradient>
        
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="12" stdDeviation="8" floodOpacity="0.25" />
        </filter>
      </defs>

      <path d="M90 240 Q90 200 95 180 Q85 170 85 150 L93 100 L107 100 L115 150 Q115 170 105 180 Q110 200 110 240 Z" fill="url(#trunkGrad)" filter="url(#shadow)" />
      
      <path d="M93 110 Q70 80 50 70" stroke="url(#trunkGrad)" strokeWidth="8" strokeLinecap="round" />
      <path d="M107 110 Q130 80 150 70" stroke="url(#trunkGrad)" strokeWidth="8" strokeLinecap="round" />
      <path d="M98 100 Q95 60 100 40" stroke="url(#trunkGrad)" strokeWidth="6" strokeLinecap="round" />
      
      <g style={{ transform: `scale(${scaleX}, 1)`, transformOrigin: '100px 100px' }}>
        <circle cx="60" cy="110" r="45" fill="url(#canopyGradShadow)" />
        <circle cx="140" cy="110" r="45" fill="url(#canopyGradShadow)" />
        <circle cx="100" cy="60" r="55" fill="url(#canopyGradShadow)" />
        
        <path d="M30 115 C -5 115, 0 50, 45 45 C 55 10, 145 10, 155 45 C 200 50, 205 115, 170 115 Z" fill="url(#canopyGradMain)" filter="url(#shadow)" />
        
        <circle cx="75" cy="70" r="35" fill="url(#canopyGradHighlight)" opacity="0.85" />
        <circle cx="135" cy="80" r="30" fill="url(#canopyGradHighlight)" opacity="0.75" />
        <circle cx="100" cy="40" r="25" fill="url(#canopyGradHighlight)" opacity="0.9" />
        <circle cx="60" cy="90" r="20" fill="url(#canopyGradHighlight)" opacity="0.6" />
        <circle cx="150" cy="60" r="15" fill="url(#canopyGradHighlight)" opacity="0.8" />
        
        <path d="M70 50 Q80 40 90 50 Q80 60 70 50 Z" fill="#ffffff" opacity="0.15" />
        <path d="M110 60 Q120 50 130 60 Q120 70 110 60 Z" fill="#ffffff" opacity="0.15" />
        <path d="M130 90 Q140 85 145 95 Q135 100 130 90 Z" fill="#ffffff" opacity="0.1" />
        <path d="M60 90 Q70 85 75 95 Q65 100 60 90 Z" fill="#ffffff" opacity="0.1" />
      </g>
    </svg>
  );
};

const interpolateMetric = (metricStr, year) => {
  if (!metricStr || metricStr === 'Unknown') return 'Unknown';
  const match = metricStr.match(/(\d+)(-\d+)?\s*([a-zA-Z]+)/);
  if (match) {
    const maxVal = match[2] ? parseFloat(match[2].substring(1)) : parseFloat(match[1]);
    const unit = match[3];
    const currentVal = 1 + ((maxVal * 0.7) - 1) * (year / 10);
    return `${currentVal.toFixed(1)}${unit}`;
  }
  return metricStr;
};

export default function FocusedTreeView({ tree, onClose }) {
  const [year, setYear] = useState(0);
  const [explanation, setExplanation] = useState(null);
  const [isExplaining, setIsExplaining] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchExplanation = async () => {
      setIsExplaining(true);
      setExplanation(null);
      try {
        const response = await fetch('http://127.0.0.1:8001/explain-recommendation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tree_data: tree })
        });
        if (response.ok) {
          const data = await response.json();
          if (active) setExplanation(data.explanation);
        } else {
          if (active) setExplanation("Error generating explanation.");
        }
      } catch (err) {
        if (active) setExplanation("Failed to connect to explanation service.");
      } finally {
        if (active) setIsExplaining(false);
      }
    };
    fetchExplanation();
    return () => { active = false; };
  }, [tree.species]); // Only refetch if the tree changes, NOT on slider move

  let growthFactor = year / 10;
  if (tree.growth_rate === 'fast') {
    growthFactor = Math.pow(year / 10, 0.7);
  } else if (tree.growth_rate === 'slow') {
    growthFactor = Math.pow(year / 10, 1.3);
  }
  const visualScale = 0.4 + growthFactor * 0.6;
  
  let interactionText = "Low potential interaction";
  if (year >= 5 && year < 10) {
     interactionText = tree.growth_rate === 'fast' ? 'Medium potential interaction' : 'Low potential interaction';
  } else if (year === 10) {
     interactionText = tree.growth_rate === 'slow' ? 'Medium potential interaction' : 'Potentially increased interaction with nearby infrastructure';
  }
  if (year === 0) interactionText = "None (Planting Stage)";

  let stageLabel = "Planting Size";
  if (year > 2 && year < 7) stageLabel = "Partial Canopy Development";
  if (year >= 7) stageLabel = "Approaching Mature Form";
  if (year === 10) stageLabel = "Mature Form";
  
  const displayHeight = year === 10 ? tree.mature_height : interpolateMetric(tree.mature_height, year);
  const displayCanopy = year === 10 ? tree.canopy_width : interpolateMetric(tree.canopy_width, year);

  const parseMax = (str) => {
    if (!str || str === 'Unknown') return 10;
    const match = str.match(/(\d+)(-\d+)?\s*/);
    return match ? parseFloat(match[2] ? match[2].substring(1) : match[1]) : 10;
  };
  const maxH = parseMax(tree.mature_height);
  const maxW = parseMax(tree.canopy_width);
  const canopyAspect = maxW / (maxH || 1);

  const slug = tree.species.toLowerCase().replace(/\s+/g, '-');
  const imageUrl = `/tree-images/${slug}.jpg`;

  // Data confidence
  const missingCount = tree.data_limitations ? tree.data_limitations.length : 0;
  let confidenceLevel = "High";
  let confidenceText = "Most required site inputs are available.";
  if (missingCount > 0 && missingCount <= 2) {
      confidenceLevel = "Medium";
      confidenceText = "Some site measurements are unavailable and safety margins were applied.";
  } else if (missingCount > 2) {
      confidenceLevel = "Limited";
      confidenceText = "Important site measurements require manual verification.";
  }

  // Future Infrastructure Outlook Logic
  const getRisk = (score) => score < 40 ? "High" : score < 75 ? "Medium" : "Low";
  const infraOutlook = [
    { label: "Root / Footpath", level: getRisk(tree.sub_scores.root_safety) },
    { label: "Building", level: getRisk(tree.sub_scores.infrastructure_compatibility) },
    { label: "Road clearance", level: getRisk(tree.sub_scores.space_availability) },
    { label: "Overhead utility", level: getRisk(tree.sub_scores.infrastructure_compatibility - 10) } // Just mapping from existing
  ];

  return (
    <div className="absolute inset-0 bg-gray-50 z-40 flex flex-col animate-in fade-in duration-300">
      
      {/* HEADER */}
      <div className="h-16 bg-white border-b border-gray-200 flex items-center px-6 shadow-sm shrink-0 sticky top-0 z-50">
        <button 
          onClick={onClose}
          className="flex items-center gap-2 text-gray-500 hover:text-emerald-700 font-bold transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          Back to Dashboard
        </button>
      </div>

      {/* CONTENT SPLIT */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT/MAIN: INFO SCROLL */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-gray-50">
          
          {/* Section A: Tree Identity + Overall Compatibility */}
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-black text-gray-900">{tree.common_name}</h1>
              <h2 className="text-lg italic text-gray-500 mb-2">{tree.species}</h2>
            </div>
            
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 text-center min-w-[150px]">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Overall Compatibility</div>
              <div className="text-4xl font-black text-emerald-600">{tree.overall_score} <span className="text-lg text-gray-400">/ 100</span></div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8">
            
            {/* Section B: Compatibility Score Breakdown */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 border-b pb-2">Compatibility Score Breakdown</h3>
              <ProgressBar label="Infrastructure" value={tree.sub_scores.infrastructure_compatibility} />
              <ProgressBar label="Root Safety" value={tree.sub_scores.root_safety} />
              <ProgressBar label="Climate" value={tree.sub_scores.climate_suitability} />
              <ProgressBar label="Space" value={tree.sub_scores.space_availability} />
              <ProgressBar label="Environmental" value={tree.sub_scores.environmental_benefit} />
              
              <div className="mt-4 p-3 bg-gray-50 rounded text-sm text-gray-600">
                <span className="font-bold text-gray-700 block mb-1">Why this score?</span>
                {tree.reason}
              </div>
            </div>

            {/* Section C: Data Confidence & Environmental */}
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Data Confidence</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${confidenceLevel === 'High' ? 'bg-emerald-100 text-emerald-800' : confidenceLevel === 'Medium' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'}`}>
                    {confidenceLevel}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">{confidenceText}</p>
                {missingCount > 0 && (
                  <ul className="list-disc pl-5 text-xs text-rose-600">
                    {tree.data_limitations.map((lim, i) => <li key={i}>{lim}</li>)}
                  </ul>
                )}
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white">
                <h3 className="text-sm font-bold text-emerald-900 uppercase tracking-wider mb-2">Environmental Impact</h3>
                {tree.annual_co2_sequestration_kg ? (
                  <>
                    <div className="text-2xl font-black text-emerald-700 mb-1">~{tree.annual_co2_sequestration_kg} kg CO₂/year</div>
                    <p className="text-xs text-emerald-600/70 italic">Estimated annual CO₂ sequestration</p>
                    <p className="text-[10px] text-gray-400 mt-2 border-t pt-2 border-emerald-100">{tree.co2_reference_source}</p>
                  </>
                ) : (
                  <div className="text-sm text-gray-500 italic">Data unavailable</div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8">
            {/* Section D: Future Infrastructure Outlook */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 border-b pb-2">10-Year Infrastructure Outlook</h3>
              <div className="space-y-3 mb-4">
                {infraOutlook.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 font-medium">{item.label}</span>
                    <span className={`font-bold ${item.level === 'Low' ? 'text-emerald-600' : item.level === 'Medium' ? 'text-amber-500' : 'text-rose-500'}`}>{item.level}</span>
                  </div>
                ))}
              </div>
              <div className="p-3 bg-amber-50 rounded text-sm text-amber-900 border border-amber-100">
                <span className="font-bold block mb-1">Potential Future Interaction</span>
                Canopy expansion and root growth may gradually reduce available clearance near infrastructure over the next decade.
                {missingCount > 0 && <div className="mt-2 text-rose-700 font-bold">Underground utilities require manual verification.</div>}
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-100">
                <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Recommended Mitigation</h4>
                <ul className="text-sm text-gray-700 list-disc pl-4 space-y-1">
                  <li>Consider adjusting planting position to maximize clearance.</li>
                  {tree.infrastructure_conflict_risk !== 'Low' && <li>Increase clearance from building edge.</li>}
                  {tree.root_conflict_risk !== 'Low' && <li>Consider appropriate root-management measures where applicable.</li>}
                  <li>Manually verify underground utilities before planting.</li>
                </ul>
              </div>
            </div>

            {/* Section E: Tree Profile & Planting Zone */}
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 border-b pb-2">Planting Zone</h3>
                <div className="text-sm text-gray-700 font-medium mb-2">Estimated safe placement area</div>
                <div className="p-3 bg-blue-50 text-blue-900 text-sm rounded border border-blue-100">
                  <span className="font-bold block mb-1">Why here?</span>
                  Placement is suggested here because the assessed area provides optimal clearance from detected buildings and road edges.
                  <div className="text-xs italic text-blue-700/80 mt-2">This is an estimated planning zone, NOT a survey-grade civil measurement.</div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-3 border-b pb-2">Tree Profile</h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                  <div><span className="text-gray-500 text-xs block">Water Req.</span><span className="font-medium text-gray-900 capitalize">{tree.water_requirement || "Data unavailable"}</span></div>
                  <div><span className="text-gray-500 text-xs block">Maintenance</span><span className="font-medium text-gray-900 capitalize">{tree.maintenance || "Data unavailable"}</span></div>
                  <div><span className="text-gray-500 text-xs block">Native Status</span><span className="font-medium text-gray-900 capitalize">{tree.native_status || "Data unavailable"}</span></div>
                  <div><span className="text-gray-500 text-xs block">Shade Potential</span><span className="font-medium text-gray-900 capitalize">{tree.shade_potential || "Data unavailable"}</span></div>
                  <div><span className="text-gray-500 text-xs block">Growth Rate</span><span className="font-medium text-gray-900 capitalize">{tree.growth_rate || "Data unavailable"}</span></div>
                </div>
              </div>

              {/* Section F: AI Explanation */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-emerald-200">
                <div className="flex items-center gap-2 mb-4 border-b pb-2">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                  <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">AI-assisted explanation</h3>
                </div>
                <h4 className="text-base font-black text-gray-900 mb-2">Why CanopyAI recommends this tree</h4>
                {isExplaining ? (
                  <div className="flex items-center gap-3 text-sm text-gray-500 italic p-4">
                    <svg className="animate-spin h-4 w-4 text-emerald-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Generating explanation...
                  </div>
                ) : (
                  <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap font-medium">
                    {explanation}
                  </div>
                )}
              </div>
            </div>
          </div>
          
        </div>

        {/* RIGHT: COMPACT VISUALIZATION + PHOTO */}
        <div className="w-[360px] bg-white border-l border-gray-200 flex flex-col shrink-0 shadow-lg relative z-10">
          
          {/* Real Species Photo */}
          <div className="h-48 bg-gray-100 relative shrink-0">
            <img 
              src={imageUrl} 
              alt={`Photo of ${tree.common_name}`}
              className="w-full h-full object-cover"
              onError={(e) => { e.target.src = '/tree-images/placeholder.jpg'; }}
            />
            <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[9px] px-2 py-1 rounded backdrop-blur-sm">
              {tree.species}
            </div>
          </div>

          {/* Growth Projection */}
          <div className="flex-1 flex flex-col p-5 bg-gradient-to-b from-emerald-50/50 to-white overflow-y-auto">
            <h3 className="text-sm font-bold text-emerald-900 uppercase tracking-wider mb-1">Growth Projection</h3>
            <p className="text-[10px] text-emerald-700/70 mb-4">Estimated growth projection — not a survey-grade prediction.</p>
            
            <div className="relative h-48 flex items-end justify-center mb-6 shrink-0">
               {/* The Tree */}
               <div className="w-32 h-40 relative z-10 flex items-end justify-center mb-2">
                  <TreeSVG scale={visualScale} canopyAspect={canopyAspect} />
               </div>
               
               {/* Ground line */}
               <div className="absolute bottom-2 left-4 right-4 border-t-2 border-emerald-900/10 rounded-full z-0"></div>
            </div>
            
            {/* SLIDER CONTROLS */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-bold text-gray-500">NOW</span>
                <span className="text-sm font-black text-emerald-700">YEAR {year}</span>
                <span className="text-[10px] font-bold text-gray-500">10 YRS</span>
              </div>
              <input 
                type="range" 
                min="0" max="10" 
                value={year} 
                onChange={(e) => setYear(parseInt(e.target.value))}
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600 mb-4"
              />
              
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                  <div className="text-[9px] text-gray-500 uppercase tracking-wider font-bold mb-0.5">Est. Height</div>
                  <div className="font-bold text-gray-800 text-xs">{displayHeight}</div>
                </div>
                <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                  <div className="text-[9px] text-gray-500 uppercase tracking-wider font-bold mb-0.5">Est. Canopy</div>
                  <div className="font-bold text-gray-800 text-xs">{displayCanopy}</div>
                </div>
              </div>
              
              <div className="mt-2 bg-emerald-50 p-2 rounded-lg border border-emerald-100 text-center">
                <div className="text-[9px] text-emerald-600 uppercase tracking-wider font-bold mb-0.5">Growth Stage</div>
                <div className="font-bold text-emerald-800 text-xs leading-tight">{stageLabel}</div>
              </div>
            </div>
            
          </div>
        </div>

      </div>
    </div>
  );
}
