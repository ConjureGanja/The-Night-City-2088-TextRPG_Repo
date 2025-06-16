import React, { useState, useEffect } from 'react';
import { mapService, Location, District, DangerLevel, MapMarker, MarkerType } from '../services/mapService';

interface MapPanelProps {
  isVisible: boolean;
  onToggle: () => void;
}

const MapPanel: React.FC<MapPanelProps> = ({ isVisible, onToggle }) => {
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [allLocations, setAllLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<District | 'all'>('all');
  const [showOnlyDiscovered, setShowOnlyDiscovered] = useState(false);

  useEffect(() => {
    if (isVisible) {
      refreshMapData();
    }
  }, [isVisible]);

  const refreshMapData = () => {
    setCurrentLocation(mapService.getCurrentLocation());
    setAllLocations(mapService.getAllLocations());
    setMarkers(mapService.getAllMarkers());
  };

  const handleLocationClick = (location: Location) => {
    setSelectedLocation(location);
  };

  const handleTravelTo = (locationId: string) => {
    const result = mapService.travelTo(locationId);
    if (result.success) {
      refreshMapData();
      setSelectedLocation(null);
    }
    // Show result message (could be integrated with a toast system)
    console.log(result.message);
  };

  const handleFastTravel = (locationId: string) => {
    const result = mapService.fastTravel(locationId);
    if (result.success) {
      refreshMapData();
      setSelectedLocation(null);
    }
    console.log(result.message);
  };

  const getDangerLevelColor = (dangerLevel: DangerLevel): string => {
    return mapService.getDangerLevelColor(dangerLevel);
  };

  const getMarkerIcon = (markerType: MarkerType): string => {
    const icons = {
      [MarkerType.MAIN_QUEST]: '⭐',
      [MarkerType.SIDE_QUEST]: '❓',
      [MarkerType.GIGS]: '💼',
      [MarkerType.CYBERPSYCHO]: '🧠',
      [MarkerType.TAROT]: '🃏',
      [MarkerType.VENDOR]: '🛒',
      [MarkerType.POINT_OF_INTEREST]: '📍',
      [MarkerType.DANGER_ZONE]: '⚠️'
    };
    return icons[markerType] || '📍';
  };

  const getDistrictColor = (district: District): string => {
    const colors = {
      [District.WATSON]: 'text-blue-400',
      [District.CITY_CENTER]: 'text-yellow-400',
      [District.WESTBROOK]: 'text-purple-400',
      [District.HEYWOOD]: 'text-green-400',
      [District.SANTO_DOMINGO]: 'text-orange-400',
      [District.PACIFICA]: 'text-red-400',
      [District.BADLANDS]: 'text-gray-400',
      [District.CORPO_PLAZA]: 'text-cyan-400'
    };
    return colors[district];
  };

  const filteredLocations = allLocations.filter(location => {
    if (showOnlyDiscovered && !location.discovered) return false;
    if (selectedDistrict === 'all') return true;
    return location.district === selectedDistrict;
  });

  const connectedLocations = mapService.getConnectedLocations();
  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="bg-gray-900 border-2 border-cyan-400 rounded-lg w-full max-w-7xl h-full max-h-screen m-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gray-800 border-b border-cyan-400 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse"></div>
            <h2 className="text-cyan-400 font-bold text-xl">NIGHT CITY MAP v3.0</h2>
            {currentLocation && (
              <div className="text-sm text-gray-400">
                Current: <span className={getDangerLevelColor(currentLocation.dangerLevel)}>
                  {currentLocation.name}
                </span>
              </div>
            )}
          </div>
          <button
            onClick={onToggle}
            className="text-cyan-400 hover:text-white transition-colors text-xl"
          >
            ✕
          </button>
        </div>

        <div className="flex h-full">
          {/* Left Panel - Location List */}
          <div className="w-80 border-r border-cyan-400 p-4 overflow-y-auto">
            {/* Filters */}
            <div className="mb-4 space-y-3">
              <div>
                <label className="text-cyan-400 text-xs block mb-1">DISTRICT:</label>                <select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value as any)}
                  className="w-full bg-gray-800 text-cyan-400 border border-gray-600 rounded px-2 py-1 text-xs"
                  aria-label="Select district to filter locations"
                >
                  <option value="all">All Districts</option>
                  {Object.values(District).map(district => (
                    <option key={district} value={district}>
                      {district.replace('_', ' ').toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="discoveredOnly"
                  checked={showOnlyDiscovered}
                  onChange={(e) => setShowOnlyDiscovered(e.target.checked)}
                  className="text-cyan-400"
                />
                <label htmlFor="discoveredOnly" className="text-cyan-400 text-xs">
                  Discovered Only
                </label>
              </div>
            </div>

            {/* Current Location */}
            {currentLocation && (
              <div className="mb-4 p-3 border-2 border-yellow-400 rounded bg-yellow-900 bg-opacity-20">
                <div className="text-yellow-400 text-xs font-bold mb-1">CURRENT LOCATION</div>
                <div className="text-white font-bold">{currentLocation.name}</div>
                <div className={`text-xs ${getDistrictColor(currentLocation.district)}`}>
                  {currentLocation.district.replace('_', ' ').toUpperCase()}
                </div>
              </div>
            )}

            {/* Connected Locations */}
            {connectedLocations.length > 0 && (
              <div className="mb-4">
                <h3 className="text-cyan-400 font-bold text-sm mb-2">CONNECTED LOCATIONS</h3>
                <div className="space-y-1">
                  {connectedLocations.map(location => (
                    <div
                      key={location.id}
                      onClick={() => handleLocationClick(location)}
                      className="flex items-center justify-between p-2 border border-green-600 rounded cursor-pointer hover:bg-green-900 hover:bg-opacity-20 transition-colors"
                    >
                      <div>
                        <div className="text-green-400 text-sm font-bold">{location.shortName}</div>
                        <div className={`text-xs ${getDangerLevelColor(location.dangerLevel)}`}>
                          {location.dangerLevel.toUpperCase()}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTravelTo(location.id);
                        }}
                        className="bg-green-600 hover:bg-green-500 text-white px-2 py-1 rounded text-xs"
                      >
                        TRAVEL
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All Locations */}
            <div>
              <h3 className="text-cyan-400 font-bold text-sm mb-2">ALL LOCATIONS</h3>
              <div className="space-y-1">
                {filteredLocations.map(location => (
                  <div
                    key={location.id}
                    onClick={() => handleLocationClick(location)}
                    className={`
                      p-2 border rounded cursor-pointer transition-all
                      ${location.id === currentLocation?.id ? 'border-yellow-400 bg-yellow-900 bg-opacity-20' : 
                        location.id === selectedLocation?.id ? 'border-cyan-400 bg-cyan-900 bg-opacity-20' :
                        location.discovered ? 'border-gray-600 hover:border-cyan-400' : 'border-gray-800 opacity-50'}
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className={`text-sm font-bold ${location.discovered ? 'text-white' : 'text-gray-500'}`}>
                          {location.discovered ? location.name : '???'}
                        </div>
                        <div className={`text-xs ${getDistrictColor(location.district)}`}>
                          {location.district.replace('_', ' ').toUpperCase()}
                        </div>
                        <div className={`text-xs ${getDangerLevelColor(location.dangerLevel)}`}>
                          {location.dangerLevel.toUpperCase()}
                        </div>
                      </div>
                      
                      <div className="flex flex-col space-y-1">
                        {location.unlocked && location.discovered && (
                          <>
                            {mapService.canTravelTo(location.id).canTravel && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTravelTo(location.id);
                                }}
                                className="bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded text-xs"
                              >
                                TRAVEL
                              </button>
                            )}
                            {location.fastTravelAvailable && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleFastTravel(location.id);
                                }}
                                className="bg-purple-600 hover:bg-purple-500 text-white px-2 py-1 rounded text-xs"
                              >
                                FAST
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    
                    {/* Location markers */}
                    <div className="flex space-x-1 mt-1">
                      {markers
                        .filter(marker => marker.locationId === location.id)
                        .slice(0, 3)
                        .map(marker => (
                          <span
                            key={marker.id}
                            title={marker.title}
                            className="text-xs"
                          >
                            {getMarkerIcon(marker.type)}
                          </span>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Center Panel - Visual Map */}
          <div className="flex-1 p-4 relative overflow-hidden bg-gray-800">
            <div className="relative w-full h-full bg-black border border-cyan-400 rounded overflow-hidden">
              {/* Grid overlay */}
              <div className="absolute inset-0 opacity-20">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div
                    key={`h-${i}`}
                    className="absolute w-full border-t border-cyan-400"
                    style={{ top: `${(i + 1) * 5}%` }} // eslint-disable-line react/forbid-dom-props
                  />
                ))}
                {Array.from({ length: 20 }).map((_, i) => (
                  <div
                    key={`v-${i}`}
                    className="absolute h-full border-l border-cyan-400"
                    style={{ left: `${(i + 1) * 5}%` }} // eslint-disable-line react/forbid-dom-props
                  />
                ))}
              </div>

              {/* Location dots */}
              {filteredLocations.map(location => (
                location.discovered && (
                  <div
                    key={location.id}
                    onClick={() => handleLocationClick(location)}
                    className={`
                      absolute w-4 h-4 rounded-full cursor-pointer transform -translate-x-2 -translate-y-2 z-10 transition-all
                      ${location.id === currentLocation?.id ? 'bg-yellow-400 animate-pulse scale-150' :
                        location.id === selectedLocation?.id ? 'bg-cyan-400 scale-125' :
                        location.unlocked ? 'bg-green-400 hover:scale-110' : 'bg-gray-600'}
                    `}                    style={{
                      left: `${location.coordinates.x}%`,
                      top: `${location.coordinates.y}%`
                    }} // eslint-disable-line react/forbid-dom-props
                    title={location.name}
                  >
                    {/* Markers around location */}
                    {markers
                      .filter(marker => marker.locationId === location.id)
                      .slice(0, 4)
                      .map((marker, index) => (
                        <div
                          key={marker.id}
                          className="absolute text-xs animate-bounce"                          style={{
                            top: `${-20 - (index * 8)}px`,
                            left: `${index * 8 - 16}px`
                          }} // eslint-disable-line react/forbid-dom-props
                        >
                          {getMarkerIcon(marker.type)}
                        </div>
                      ))}
                  </div>
                )
              ))}

              {/* Connection lines */}
              {currentLocation && connectedLocations.map(location => (
                <svg
                  key={`line-${location.id}`}
                  className="absolute inset-0 pointer-events-none"
                  style={{ width: '100%', height: '100%' }} // eslint-disable-line react/forbid-dom-props
                >
                  <line
                    x1={`${currentLocation.coordinates.x}%`}
                    y1={`${currentLocation.coordinates.y}%`}
                    x2={`${location.coordinates.x}%`}
                    y2={`${location.coordinates.y}%`}
                    stroke="rgba(34, 197, 94, 0.3)"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                  />
                </svg>
              ))}

              {/* District labels */}
              <div className="absolute top-4 left-4 text-blue-400 text-sm font-bold opacity-60">WATSON</div>
              <div className="absolute top-4 right-4 text-purple-400 text-sm font-bold opacity-60">WESTBROOK</div>
              <div className="absolute bottom-4 left-4 text-gray-400 text-sm font-bold opacity-60">BADLANDS</div>
              <div className="absolute bottom-4 right-4 text-orange-400 text-sm font-bold opacity-60">SANTO DOMINGO</div>
              <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 text-yellow-400 text-sm font-bold opacity-60">CITY CENTER</div>
            </div>

            {/* Map legend */}
            <div className="absolute bottom-4 right-4 bg-gray-900 border border-cyan-400 rounded p-3 text-xs">
              <div className="font-bold text-cyan-400 mb-2">LEGEND</div>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                  <span className="text-gray-300">Current Location</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  <span className="text-gray-300">Available</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-gray-600 rounded-full"></div>
                  <span className="text-gray-300">Locked</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-lg">⭐</span>
                  <span className="text-gray-300">Main Quest</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-lg">❓</span>
                  <span className="text-gray-300">Side Quest</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Location Details */}
          <div className="w-80 border-l border-cyan-400 p-4 overflow-y-auto">
            {selectedLocation ? (
              <div className="space-y-4">
                <div className="border-b border-gray-600 pb-4">
                  <h3 className="font-bold text-xl text-white">{selectedLocation.name}</h3>
                  <div className={`text-sm ${getDistrictColor(selectedLocation.district)}`}>
                    {selectedLocation.district.replace('_', ' ').toUpperCase()}
                  </div>
                  <div className={`text-sm ${getDangerLevelColor(selectedLocation.dangerLevel)}`}>
                    Danger Level: {selectedLocation.dangerLevel.toUpperCase()}
                  </div>
                </div>

                <div className="text-sm text-gray-300">
                  {selectedLocation.description}
                </div>

                {/* Services */}
                {selectedLocation.services && selectedLocation.services.length > 0 && (
                  <div className="border border-gray-600 rounded p-3">
                    <h4 className="text-cyan-400 font-bold text-sm mb-2">SERVICES</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedLocation.services.map(service => (
                        <div key={service} className="flex items-center space-x-1 text-xs">
                          <span>{mapService.getServiceIcon(service)}</span>
                          <span className="text-gray-300">{service.replace('_', ' ')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* NPCs */}
                {selectedLocation.npcs && selectedLocation.npcs.length > 0 && (
                  <div className="border border-gray-600 rounded p-3">
                    <h4 className="text-cyan-400 font-bold text-sm mb-2">CONTACTS</h4>
                    <div className="space-y-1">
                      {selectedLocation.npcs.map(npc => (
                        <div key={npc} className="text-xs text-green-400">• {npc}</div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Special Features */}
                {selectedLocation.specialFeatures && selectedLocation.specialFeatures.length > 0 && (
                  <div className="border border-gray-600 rounded p-3">
                    <h4 className="text-cyan-400 font-bold text-sm mb-2">SPECIAL FEATURES</h4>
                    <div className="space-y-1">
                      {selectedLocation.specialFeatures.map(feature => (
                        <div key={feature} className="text-xs text-yellow-400">• {feature.replace('_', ' ')}</div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Markers at this location */}
                {markers.filter(m => m.locationId === selectedLocation.id).length > 0 && (
                  <div className="border border-gray-600 rounded p-3">
                    <h4 className="text-cyan-400 font-bold text-sm mb-2">ACTIVITIES</h4>
                    <div className="space-y-2">
                      {markers
                        .filter(m => m.locationId === selectedLocation.id)
                        .map(marker => (
                          <div key={marker.id} className="flex items-center space-x-2 text-xs">
                            <span>{getMarkerIcon(marker.type)}</span>
                            <div>
                              <div className="text-white font-bold">{marker.title}</div>
                              <div className="text-gray-400">{marker.description}</div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Travel Options */}
                {selectedLocation.discovered && selectedLocation.unlocked && (
                  <div className="space-y-2">
                    {mapService.canTravelTo(selectedLocation.id).canTravel && (
                      <button
                        onClick={() => handleTravelTo(selectedLocation.id)}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 px-4 rounded"
                      >
                        TRAVEL HERE
                      </button>
                    )}
                    {selectedLocation.fastTravelAvailable && (
                      <button
                        onClick={() => handleFastTravel(selectedLocation.id)}
                        className="w-full bg-purple-600 hover:bg-purple-500 text-white py-2 px-4 rounded"
                      >
                        FAST TRAVEL
                      </button>
                    )}
                  </div>
                )}

                {!selectedLocation.unlocked && (
                  <div className="bg-red-900 border border-red-600 rounded p-3 text-center">
                    <div className="text-red-400 font-bold text-sm">ACCESS RESTRICTED</div>
                    {selectedLocation.accessRequirements && (
                      <div className="text-xs text-gray-400 mt-1">
                        Requirements not met
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <div className="text-4xl mb-4">🗺️</div>
                  <div className="text-sm">Select a location to view details</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapPanel;
