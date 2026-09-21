import React from 'react';

const CompareView = ({ trees, onClose }) => {
  // Take up to 3 top trees for comparison to fit nicely, or all 5 with horizontal scroll
  const compareTrees = trees.slice(0, 3);

  const getScoreColor = (score) => {
    if (score >= 80) return "text-emerald-700 font-black";
    if (score >= 50) return "text-amber-600 font-bold";
    return "text-rose-600 font-bold";
  };

  const getRiskColor = (level) => {
    if (level === 'Low') return "bg-emerald-100 text-emerald-800";
    if (level === 'Medium') return "bg-amber-100 text-amber-800";
    if (level === 'High') return "bg-rose-100 text-rose-800";
    return "bg-gray-100 text-gray-800";
  };

  return (
    <div className="absolute inset-0 bg-white z-50 flex flex-col animate-in fade-in duration-300">
      
      {/* HEADER */}
      <div className="h-16 bg-white border-b border-gray-200 flex items-center px-6 shadow-sm shrink-0">
        <button 
          onClick={onClose}
          className="flex items-center gap-2 text-gray-500 hover:text-emerald-700 font-bold transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          Back to Dashboard
        </button>
        <div className="ml-auto">
          <h2 className="text-xl font-black text-emerald-900 tracking-tight">Compare Top Recommendations</h2>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-8 bg-gray-50">
        <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="p-4 bg-gray-50 border-b border-r border-gray-200 w-48 font-bold text-gray-700 uppercase text-xs tracking-wider">Metric</th>
                {compareTrees.map((tree, idx) => (
                  <th key={idx} className="p-4 bg-emerald-800 text-white border-b border-gray-200 w-1/3 text-center align-top relative">
                    {idx === 0 && <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-amber-400 text-amber-900 text-[10px] font-black uppercase px-2 py-0.5 rounded-full shadow-sm mt-3">Top Match</div>}
                    <div className="mt-2 text-xl font-black">{tree.common_name}</div>
                    <div className="text-xs italic text-emerald-200">{tree.species}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              
              {/* Overall Compatibility */}
              <tr className="border-b border-gray-100 hover:bg-gray-50/50">
                <td className="p-4 border-r border-gray-200 font-bold text-gray-700 text-sm">Overall Compatibility</td>
                {compareTrees.map((tree, idx) => (
                  <td key={idx} className="p-4 text-center">
                    <span className={`text-3xl ${getScoreColor(tree.overall_score)}`}>{tree.overall_score}</span>
                    <span className="text-gray-400 text-sm">/100</span>
                  </td>
                ))}
              </tr>

              {/* Infrastructure Risk */}
              <tr className="border-b border-gray-100 hover:bg-gray-50/50 bg-gray-50/30">
                <td className="p-4 border-r border-gray-200 font-bold text-gray-700 text-sm">Infrastructure Risk</td>
                {compareTrees.map((tree, idx) => (
                  <td key={idx} className="p-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getRiskColor(tree.infrastructure_conflict_risk)}`}>
                      {tree.infrastructure_conflict_risk}
                    </span>
                  </td>
                ))}
              </tr>

              {/* Root Risk */}
              <tr className="border-b border-gray-100 hover:bg-gray-50/50">
                <td className="p-4 border-r border-gray-200 font-bold text-gray-700 text-sm">Root Risk</td>
                {compareTrees.map((tree, idx) => (
                  <td key={idx} className="p-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getRiskColor(tree.root_conflict_risk)}`}>
                      {tree.root_conflict_risk}
                    </span>
                  </td>
                ))}
              </tr>

              {/* Climate Compatibility */}
              <tr className="border-b border-gray-100 hover:bg-gray-50/50 bg-gray-50/30">
                <td className="p-4 border-r border-gray-200 font-bold text-gray-700 text-sm">Climate</td>
                {compareTrees.map((tree, idx) => (
                  <td key={idx} className="p-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getRiskColor(tree.climate_compatibility)}`}>
                      {tree.climate_compatibility}
                    </span>
                  </td>
                ))}
              </tr>

              {/* Space Compatibility */}
              <tr className="border-b border-gray-100 hover:bg-gray-50/50">
                <td className="p-4 border-r border-gray-200 font-bold text-gray-700 text-sm">Space</td>
                {compareTrees.map((tree, idx) => (
                  <td key={idx} className="p-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getRiskColor(tree.space_compatibility)}`}>
                      {tree.space_compatibility}
                    </span>
                  </td>
                ))}
              </tr>

              {/* Mature Height */}
              <tr className="border-b border-gray-100 hover:bg-gray-50/50 bg-gray-50/30">
                <td className="p-4 border-r border-gray-200 font-bold text-gray-700 text-sm">Mature Height</td>
                {compareTrees.map((tree, idx) => (
                  <td key={idx} className="p-4 text-center font-medium text-gray-800">{tree.mature_height}</td>
                ))}
              </tr>

              {/* Canopy Width */}
              <tr className="border-b border-gray-100 hover:bg-gray-50/50">
                <td className="p-4 border-r border-gray-200 font-bold text-gray-700 text-sm">Canopy Width</td>
                {compareTrees.map((tree, idx) => (
                  <td key={idx} className="p-4 text-center font-medium text-gray-800">{tree.canopy_width}</td>
                ))}
              </tr>

              {/* Growth Rate */}
              <tr className="border-b border-gray-100 hover:bg-gray-50/50 bg-gray-50/30">
                <td className="p-4 border-r border-gray-200 font-bold text-gray-700 text-sm">Growth Rate</td>
                {compareTrees.map((tree, idx) => (
                  <td key={idx} className="p-4 text-center font-medium text-gray-800 capitalize">{tree.growth_rate}</td>
                ))}
              </tr>

              {/* Water Requirement */}
              <tr className="border-b border-gray-100 hover:bg-gray-50/50">
                <td className="p-4 border-r border-gray-200 font-bold text-gray-700 text-sm">Water Requirement</td>
                {compareTrees.map((tree, idx) => (
                  <td key={idx} className="p-4 text-center font-medium text-gray-800 capitalize">{tree.water_requirement || "Unknown"}</td>
                ))}
              </tr>

              {/* Maintenance */}
              <tr className="border-b border-gray-100 hover:bg-gray-50/50 bg-gray-50/30">
                <td className="p-4 border-r border-gray-200 font-bold text-gray-700 text-sm">Maintenance</td>
                {compareTrees.map((tree, idx) => (
                  <td key={idx} className="p-4 text-center font-medium text-gray-800 capitalize">{tree.maintenance || "Unknown"}</td>
                ))}
              </tr>

              {/* Native Status */}
              <tr className="hover:bg-gray-50/50">
                <td className="p-4 border-r border-gray-200 font-bold text-gray-700 text-sm rounded-bl-2xl">Native Status</td>
                {compareTrees.map((tree, idx) => (
                  <td key={idx} className={`p-4 text-center font-medium text-gray-800 capitalize ${idx === compareTrees.length - 1 ? 'rounded-br-2xl' : ''}`}>{tree.native_status || "Unknown"}</td>
                ))}
              </tr>

            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CompareView;
