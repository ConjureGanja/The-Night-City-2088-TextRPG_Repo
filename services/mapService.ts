// Night City Map Service for Night City Adventures
// Handles location data, navigation, and interactive map features

import { audioService } from './audioService';

export interface Location {
  id: string;
  name: string;
  shortName: string;
  description: string;
  district: District;
  dangerLevel: DangerLevel;
  coordinates: { x: number; y: number };
  connectedLocations: string[];
  unlocked: boolean;
  discovered: boolean;
  npcs?: string[];
  services?: ServiceType[];
  specialFeatures?: string[];
  fastTravelAvailable?: boolean;
  accessRequirements?: {
    credRating?: number;
    level?: number;
    items?: string[];
    questsCompleted?: string[];
  };
}

export enum District {
  CITY_CENTER = 'city_center',
  WESTBROOK = 'westbrook',
  WATSON = 'watson',
  HEYWOOD = 'heywood',
  SANTO_DOMINGO = 'santo_domingo',
  PACIFICA = 'pacifica',
  BADLANDS = 'badlands',
  CORPO_PLAZA = 'corpo_plaza'
}

export enum DangerLevel {
  SAFE = 'safe',
  LOW = 'low',
  MODERATE = 'moderate',
  HIGH = 'high',
  EXTREME = 'extreme',
  RESTRICTED = 'restricted'
}

export enum ServiceType {
  RIPPERDOC = 'ripperdoc',
  WEAPONS_VENDOR = 'weapons_vendor',
  ARMOR_VENDOR = 'armor_vendor',
  NETRUNNER_SHOP = 'netrunner_shop',
  BAR = 'bar',
  HOTEL = 'hotel',
  GARAGE = 'garage',
  BLACK_MARKET = 'black_market',
  CORPO_OFFICE = 'corpo_office',
  DATA_FORTRESS = 'data_fortress'
}

export interface MapMarker {
  id: string;
  locationId: string;
  type: MarkerType;
  title: string;
  description: string;
  priority: number;
  visible: boolean;
  completed?: boolean;
}

export enum MarkerType {
  MAIN_QUEST = 'main_quest',
  SIDE_QUEST = 'side_quest',
  GIGS = 'gigs',
  CYBERPSYCHO = 'cyberpsycho',
  TAROT = 'tarot',
  VENDOR = 'vendor',
  POINT_OF_INTEREST = 'poi',
  DANGER_ZONE = 'danger_zone'
}

class MapService {  private currentLocation: string = 'apartment_v';
  private locations: Map<string, Location> = new Map();
  private markers: Map<string, MapMarker> = new Map();
  private travelHistory: string[] = [];

  constructor() {
    this.initializeLocations();
    this.initializeMarkers();
  }

  // Get current location context for AI prompts
  getCurrentLocationContext(): string {
    const location = this.getCurrentLocation();
    if (!location) return 'Unknown location';
    
    const connectedStr = location.connectedLocations.length > 0 
      ? `Connected to: ${location.connectedLocations.map(id => {
          const connectedLoc = this.locations.get(id);
          return connectedLoc ? connectedLoc.shortName : id;
        }).join(', ')}.` 
      : '';
    
    const servicesStr = location.services && location.services.length > 0 
      ? `Available services: ${location.services.join(', ')}.` 
      : '';
    
    const npcsStr = location.npcs && location.npcs.length > 0 
      ? `Notable contacts: ${location.npcs.join(', ')}.` 
      : '';
    
    return `Current Location: ${location.name} (${location.district.replace('_', ' ')}) - ${location.description} Danger Level: ${location.dangerLevel}. ${connectedStr} ${servicesStr} ${npcsStr}`.trim();
  }
  // Try to detect location changes from story text
  parseLocationFromStory(storyText: string): string | null {
    const text = storyText.toLowerCase();
    
    // Enhanced location detection with multiple strategies
    for (const [id, location] of this.locations.entries()) {
      const locationName = location.name.toLowerCase();
      const shortName = location.shortName.toLowerCase();
      
      // Strategy 1: Exact location mentions
      if (text.includes(locationName) || text.includes(shortName)) {
        // Strategy 2: Context-aware detection
        const contextPatterns = [
          // Arrival patterns
          `arrive at ${locationName}`,
          `arriving at ${locationName}`,
          `reach ${locationName}`,
          `reaching ${locationName}`,
          `enter ${locationName}`,
          `entering ${locationName}`,
          `approach ${locationName}`,
          `approaching ${locationName}`,
          `walk to ${locationName}`,
          `head to ${locationName}`,
          `travel to ${locationName}`,
          `go to ${locationName}`,
          `visit ${locationName}`,
          `at ${locationName}`,
          `in ${locationName}`,
          `inside ${locationName}`,
          `outside ${locationName}`,
          `near ${locationName}`,
          `around ${locationName}`,
          `toward ${locationName}`,
          `towards ${locationName}`,
          
          // With short names
          `arrive at ${shortName}`,
          `arriving at ${shortName}`,
          `reach ${shortName}`,
          `reaching ${shortName}`,
          `enter ${shortName}`,
          `entering ${shortName}`,
          `approach ${shortName}`,
          `approaching ${shortName}`,
          `walk to ${shortName}`,
          `head to ${shortName}`,
          `travel to ${shortName}`,
          `go to ${shortName}`,
          `visit ${shortName}`,
          `at ${shortName}`,
          `in ${shortName}`,
          `inside ${shortName}`,
          `outside ${shortName}`,
          `near ${shortName}`,
          `around ${shortName}`,
          `toward ${shortName}`,
          `towards ${shortName}`,
          
          // Status patterns
          `you're now in ${locationName}`,
          `you're now at ${locationName}`,
          `you are now in ${locationName}`,
          `you are now at ${locationName}`,
          `you find yourself in ${locationName}`,
          `you find yourself at ${locationName}`,
          `welcome to ${locationName}`,
          `you're in ${locationName}`,
          `you're at ${locationName}`,
          `you are in ${locationName}`,
          `you are at ${locationName}`,
          
          // With short names
          `you're now in ${shortName}`,
          `you're now at ${shortName}`,
          `you are now in ${shortName}`,
          `you are now at ${shortName}`,
          `you find yourself in ${shortName}`,
          `you find yourself at ${shortName}`,
          `welcome to ${shortName}`,
          `you're in ${shortName}`,
          `you're at ${shortName}`,
          `you are in ${shortName}`,
          `you are at ${shortName}`
        ];
        
        // Check if any pattern matches
        for (const pattern of contextPatterns) {
          if (text.includes(pattern)) {
            return id;
          }
        }
        
        // Strategy 3: Proximity-based detection (if location is mentioned with directional context)
        const proximityPatterns = [
          `the ${locationName}`,
          `${locationName} building`,
          `${locationName} tower`,
          `${locationName} headquarters`,
          `${locationName} hq`,
          `${locationName} plaza`,
          `${locationName} bar`,
          `${locationName} club`,
          `${locationName} district`,
          `${locationName} area`,
          `${locationName} street`,
          `${locationName} entrance`,
          `${locationName} lobby`,
          `${locationName} complex`
        ];
        
        for (const pattern of proximityPatterns) {
          if (text.includes(pattern)) {
            // Extra validation for stronger matches
            const movementWords = ['go', 'walk', 'head', 'travel', 'move', 'arrive', 'reach', 'enter', 'approach', 'visit', 'outside', 'inside', 'near', 'at', 'in', 'toward', 'towards'];
            if (movementWords.some(word => text.includes(word))) {
              return id;
            }
          }
        }
      }
    }
    
    // Strategy 4: Special case handling for common variations
    const specialCases = {
      'arasaka': ['arasaka_headquarters', 'arasaka_plaza'],
      'arasaka tower': ['arasaka_headquarters'],
      'arasaka hq': ['arasaka_headquarters'],
      'arasaka building': ['arasaka_headquarters'],
      'afterlife': ['afterlife_bar'],
      'the afterlife': ['afterlife_bar'],
      'clouds': ['clouds'],
      'the clouds': ['clouds'],
      'apartment': ['apartment_v'],
      'home': ['apartment_v'],
      'your apartment': ['apartment_v'],
      'your place': ['apartment_v'],
      'corpo plaza': ['corpo_plaza'],
      'corporation plaza': ['corpo_plaza'],
      'badlands': ['badlands'],
      'the badlands': ['badlands'],
      'heywood': ['heywood'],
      'santo domingo': ['santo_domingo'],
      'pacifica': ['pacifica']
    };
    
    for (const [keyword, locationIds] of Object.entries(specialCases)) {
      if (text.includes(keyword)) {
        // Check for movement context
        const movementWords = ['go', 'walk', 'head', 'travel', 'move', 'arrive', 'reach', 'enter', 'approach', 'visit', 'outside', 'inside', 'near', 'at', 'in', 'toward', 'towards', 'you are', 'you\'re'];
        if (movementWords.some(word => text.includes(word))) {
          // Return the first (most specific) location
          return locationIds[0];
        }
      }
    }
    
    return null;
  }
  // Update location based on story progression
  updateLocationFromStory(storyText: string): boolean {
    const newLocationId = this.parseLocationFromStory(storyText);
    if (newLocationId && newLocationId !== this.currentLocation) {
      // Auto-unlock and discover the location when mentioned in story
      const location = this.locations.get(newLocationId);
      if (location) {
        // Mark as discovered if not already
        if (!location.discovered) {
          location.discovered = true;
          console.log(`🗺️ New location discovered: ${location.name}`);
        }
        
        // Auto-unlock if it's a story-accessible location
        // (Some restricted locations like Arasaka HQ might need special access)
        if (!location.unlocked && location.dangerLevel !== DangerLevel.RESTRICTED) {
          location.unlocked = true;
          console.log(`🔓 Location unlocked: ${location.name}`);
        } else if (!location.unlocked && location.dangerLevel === DangerLevel.RESTRICTED) {
          // For restricted locations, only unlock if explicitly visiting
          const restrictedVisitPatterns = [
            'you enter',
            'you arrive at',
            'you\'re now in',
            'you are now in',
            'welcome to',
            'inside',
            'you find yourself in'
          ];
          
          const text = storyText.toLowerCase();
          const shouldUnlock = restrictedVisitPatterns.some(pattern => 
            text.includes(pattern + ' ' + location.name.toLowerCase()) ||
            text.includes(pattern + ' ' + location.shortName.toLowerCase())
          );
          
          if (shouldUnlock) {
            location.unlocked = true;
            console.log(`🔓 Restricted location accessed: ${location.name}`);
          }
        }
      }
      
      const result = this.travelTo(newLocationId);
      if (result.success) {
        console.log(`📍 Location updated: ${location?.name || newLocationId}`);
      }
      return result.success;
    }
    return false;
  }

  private initializeLocations() {
    const defaultLocations: Location[] = [      {
        id: 'apartment_v',
        name: "Your Apartment",
        shortName: 'Home',
        description: 'Your modest apartment in Watson. Not much, but it\'s yours. The place where you start each day in Night City.',
        district: District.WATSON,
        dangerLevel: DangerLevel.SAFE,
        coordinates: { x: 40, y: 60 },
        connectedLocations: ['little_china', 'kabuki_market'],
        unlocked: true,
        discovered: true,
        services: [ServiceType.HOTEL],
        specialFeatures: ['save_point', 'item_storage', 'wardrobe'],
        fastTravelAvailable: true
      },
      {
        id: 'little_china',
        name: 'Little China',
        shortName: 'L. China',
        description: 'A bustling area of Watson with neon signs and street vendors.',
        district: District.WATSON,
        dangerLevel: DangerLevel.LOW,
        coordinates: { x: 45, y: 55 },
        connectedLocations: ['apartment_v', 'kabuki_market', 'corpo_plaza'],
        unlocked: true,
        discovered: true,
        services: [ServiceType.RIPPERDOC, ServiceType.WEAPONS_VENDOR, ServiceType.BAR],
        npcs: ['Viktor Vector', 'Wakako Okada']
      },
      {
        id: 'kabuki_market',
        name: 'Kabuki Market',
        shortName: 'Kabuki',
        description: 'A sprawling marketplace where you can find almost anything.',
        district: District.WATSON,
        dangerLevel: DangerLevel.MODERATE,
        coordinates: { x: 35, y: 65 },
        connectedLocations: ['apartment_v', 'little_china'],
        unlocked: true,
        discovered: true,
        services: [ServiceType.ARMOR_VENDOR, ServiceType.NETRUNNER_SHOP, ServiceType.BLACK_MARKET],
        npcs: ['Judy Alvarez', 'T-Bug']
      },
      {
        id: 'corpo_plaza',
        name: 'Corpo Plaza',
        shortName: 'Corpo',
        description: 'The heart of corporate power in Night City. High security.',
        district: District.CORPO_PLAZA,
        dangerLevel: DangerLevel.RESTRICTED,
        coordinates: { x: 50, y: 30 },
        connectedLocations: ['little_china', 'city_center'],
        unlocked: false,
        discovered: false,
        services: [ServiceType.CORPO_OFFICE],
        accessRequirements: {
          credRating: 50,
          level: 10
        },
        specialFeatures: ['max_security', 'corpo_access_only']
      },
      {
        id: 'city_center',
        name: 'City Center',
        shortName: 'Center',
        description: 'The gleaming commercial heart of Night City.',
        district: District.CITY_CENTER,
        dangerLevel: DangerLevel.LOW,
        coordinates: { x: 55, y: 40 },
        connectedLocations: ['corpo_plaza', 'westbrook'],
        unlocked: false,
        discovered: false,
        services: [ServiceType.WEAPONS_VENDOR, ServiceType.ARMOR_VENDOR, ServiceType.HOTEL]
      },
      {
        id: 'westbrook',
        name: 'Westbrook',
        shortName: 'Westbrook',
        description: 'Entertainment district with clubs, casinos, and vice.',
        district: District.WESTBROOK,
        dangerLevel: DangerLevel.MODERATE,
        coordinates: { x: 70, y: 45 },
        connectedLocations: ['city_center', 'japantown'],
        unlocked: false,
        discovered: false,
        services: [ServiceType.BAR, ServiceType.BLACK_MARKET, ServiceType.RIPPERDOC],
        npcs: ['Johnny Silverhand', 'Alt Cunningham']
      },
      {
        id: 'japantown',
        name: 'Japantown',
        shortName: 'Jtown',
        description: 'A slice of old Japan in the heart of Westbrook.',
        district: District.WESTBROOK,
        dangerLevel: DangerLevel.LOW,
        coordinates: { x: 75, y: 50 },
        connectedLocations: ['westbrook'],
        unlocked: false,
        discovered: false,
        services: [ServiceType.RIPPERDOC, ServiceType.NETRUNNER_SHOP],
        specialFeatures: ['traditional_architecture', 'zen_garden']
      },
      {        id: 'badlands',
        name: 'The Badlands',
        shortName: 'Badlands',
        description: 'The wasteland outside Night City. Dangerous but free.',
        district: District.BADLANDS,
        dangerLevel: DangerLevel.EXTREME,
        coordinates: { x: 10, y: 10 },
        connectedLocations: ['heywood'],
        unlocked: false,
        discovered: false,
        services: [],
        specialFeatures: ['nomad_camps', 'vehicle_required'],
        accessRequirements: {
          level: 15,
          items: ['vehicle_access']
        }
      },
      {
        id: 'arasaka_headquarters',
        name: 'Arasaka Headquarters',
        shortName: 'Arasaka HQ',
        description: 'The imposing tower that dominates the Night City skyline. Corporate power incarnate.',
        district: District.CORPO_PLAZA,
        dangerLevel: DangerLevel.RESTRICTED,
        coordinates: { x: 52, y: 25 },
        connectedLocations: ['corpo_plaza', 'city_center'],
        unlocked: false,
        discovered: false,
        services: [ServiceType.CORPO_OFFICE],
        accessRequirements: {
          credRating: 75,
          level: 15
        },
        specialFeatures: ['max_security', 'corpo_access_only', 'biometric_locks']
      },
      {
        id: 'arasaka_plaza',
        name: 'Arasaka Plaza',
        shortName: 'Arasaka Plaza',
        description: 'The plaza surrounding Arasaka Tower. Heavy security presence.',
        district: District.CORPO_PLAZA,
        dangerLevel: DangerLevel.HIGH,
        coordinates: { x: 50, y: 28 },
        connectedLocations: ['arasaka_headquarters', 'corpo_plaza'],
        unlocked: false,
        discovered: false,
        services: [],
        specialFeatures: ['security_checkpoints', 'surveillance_heavy']
      },
      {
        id: 'afterlife_bar',
        name: 'Afterlife',
        shortName: 'Afterlife',
        description: 'The most notorious bar in Night City. Where legends drink and deals are made.',
        district: District.CITY_CENTER,
        dangerLevel: DangerLevel.MODERATE,
        coordinates: { x: 58, y: 42 },
        connectedLocations: ['city_center', 'westbrook'],
        unlocked: false,
        discovered: false,
        services: [ServiceType.BAR, ServiceType.BLACK_MARKET],
        npcs: ['Rogue Amendiares', 'Claire Russell'],
        specialFeatures: ['mercenary_hub', 'job_board']
      },
      {
        id: 'clouds',
        name: 'Clouds',
        shortName: 'Clouds',
        description: 'An exclusive dollhouse in Westbrook. High-end entertainment for the wealthy.',
        district: District.WESTBROOK,
        dangerLevel: DangerLevel.MODERATE,
        coordinates: { x: 72, y: 48 },
        connectedLocations: ['westbrook', 'japantown'],
        unlocked: false,
        discovered: false,
        services: [ServiceType.BAR],
        npcs: ['Evelyn Parker', 'Woodman'],
        specialFeatures: ['exclusive_access', 'high_security']
      },
      {
        id: 'heywood',
        name: 'Heywood',
        shortName: 'Heywood',
        description: 'A diverse district mixing corporate housing and gang territories.',
        district: District.HEYWOOD,
        dangerLevel: DangerLevel.MODERATE,
        coordinates: { x: 30, y: 80 },
        connectedLocations: ['city_center', 'santo_domingo', 'badlands'],
        unlocked: false,
        discovered: false,
        services: [ServiceType.WEAPONS_VENDOR, ServiceType.BAR, ServiceType.GARAGE],
        npcs: ['Jackie Welles', 'Valentinos Gang']
      },
      {
        id: 'santo_domingo',
        name: 'Santo Domingo',
        shortName: 'S. Domingo',
        description: 'Industrial district with factories and working-class neighborhoods.',
        district: District.SANTO_DOMINGO,
        dangerLevel: DangerLevel.MODERATE,
        coordinates: { x: 25, y: 90 },
        connectedLocations: ['heywood'],
        unlocked: false,
        discovered: false,
        services: [ServiceType.GARAGE, ServiceType.WEAPONS_VENDOR],
        specialFeatures: ['industrial_zone', 'power_plant']
      },
      {
        id: 'pacifica',
        name: 'Pacifica',
        shortName: 'Pacifica',
        description: 'An abandoned district controlled by the Voodoo Boys. Enter at your own risk.',
        district: District.PACIFICA,
        dangerLevel: DangerLevel.EXTREME,
        coordinates: { x: 80, y: 80 },
        connectedLocations: ['westbrook'],
        unlocked: false,
        discovered: false,
        services: [ServiceType.NETRUNNER_SHOP, ServiceType.BLACK_MARKET],
        npcs: ['Voodoo Boys', 'Placide'],
        specialFeatures: ['gang_territory', 'netrunner_haven', 'abandoned_infrastructure']
      }
    ];

    defaultLocations.forEach(location => {
      this.locations.set(location.id, location);
    });
  }

  private initializeMarkers() {
    const defaultMarkers: MapMarker[] = [
      {
        id: 'main_viktor',
        locationId: 'little_china',
        type: MarkerType.MAIN_QUEST,
        title: 'Visit Viktor',
        description: 'Get your first cyberware from Viktor Vector',
        priority: 1,
        visible: true
      },
      {
        id: 'side_judy',
        locationId: 'kabuki_market',
        type: MarkerType.SIDE_QUEST,
        title: 'Judy\'s Request',
        description: 'Help Judy with a technical problem',
        priority: 2,
        visible: true
      },
      {
        id: 'vendor_weapons',
        locationId: 'little_china',
        type: MarkerType.VENDOR,
        title: 'Weapons Dealer',
        description: 'Upgrade your arsenal',
        priority: 3,
        visible: true
      }
    ];

    defaultMarkers.forEach(marker => {
      this.markers.set(marker.id, marker);
    });
  }

  // Location management
  getCurrentLocation(): Location | null {
    return this.locations.get(this.currentLocation) || null;
  }

  getAllLocations(): Location[] {
    return Array.from(this.locations.values());
  }

  getDiscoveredLocations(): Location[] {
    return Array.from(this.locations.values()).filter(loc => loc.discovered);
  }

  getUnlockedLocations(): Location[] {
    return Array.from(this.locations.values()).filter(loc => loc.unlocked);
  }

  getLocationById(id: string): Location | null {
    return this.locations.get(id) || null;
  }

  getLocationsByDistrict(district: District): Location[] {
    return Array.from(this.locations.values()).filter(loc => loc.district === district);
  }

  // Travel methods
  canTravelTo(locationId: string): { canTravel: boolean; reason?: string } {
    const location = this.locations.get(locationId);
    const currentLoc = this.getCurrentLocation();

    if (!location) {
      return { canTravel: false, reason: 'Location not found' };
    }

    if (!location.unlocked) {
      return { canTravel: false, reason: 'Location not unlocked' };
    }

    if (!currentLoc) {
      return { canTravel: false, reason: 'Current location error' };
    }

    // Check if locations are connected
    if (!currentLoc.connectedLocations.includes(locationId) && !location.fastTravelAvailable) {
      return { canTravel: false, reason: 'No direct route available' };
    }

    // Check access requirements
    if (location.accessRequirements) {
      // Implementation would check player stats, items, etc.
      // For now, allow all travel for unlocked locations
    }

    return { canTravel: true };
  }

  travelTo(locationId: string): { success: boolean; message: string } {
    const travelCheck = this.canTravelTo(locationId);
    
    if (!travelCheck.canTravel) {
      audioService.playErrorSound();
      return { 
        success: false, 
        message: `Cannot travel: ${travelCheck.reason}` 
      };
    }

    const location = this.locations.get(locationId);
    if (!location) {
      return { success: false, message: 'Location not found' };
    }

    // Update travel history
    this.travelHistory.push(this.currentLocation);
    this.currentLocation = locationId;

    // Mark as discovered
    location.discovered = true;

    // Play travel sound
    audioService.playSuccessSound();

    return { 
      success: true, 
      message: `Traveled to ${location.name}` 
    };
  }

  fastTravel(locationId: string): { success: boolean; message: string } {
    const location = this.locations.get(locationId);
    
    if (!location) {
      return { success: false, message: 'Location not found' };
    }

    if (!location.fastTravelAvailable) {
      return { success: false, message: 'Fast travel not available to this location' };
    }

    if (!location.discovered) {
      return { success: false, message: 'Must discover location before fast travel' };
    }

    this.travelHistory.push(this.currentLocation);
    this.currentLocation = locationId;

    audioService.playNeuralSync();
    return { 
      success: true, 
      message: `Fast traveled to ${location.name}` 
    };
  }

  // Location discovery and unlocking
  discoverLocation(locationId: string): boolean {
    const location = this.locations.get(locationId);
    if (location) {
      location.discovered = true;
      audioService.playSuccessSound();
      return true;
    }
    return false;
  }

  unlockLocation(locationId: string): boolean {
    const location = this.locations.get(locationId);
    if (location) {
      location.unlocked = true;
      location.discovered = true;
      audioService.playSuccessSound();
      return true;
    }
    return false;
  }

  // Marker management
  getMarkersForLocation(locationId: string): MapMarker[] {
    return Array.from(this.markers.values()).filter(marker => 
      marker.locationId === locationId && marker.visible
    );
  }

  getAllMarkers(): MapMarker[] {
    return Array.from(this.markers.values()).filter(marker => marker.visible);
  }

  addMarker(marker: MapMarker): void {
    this.markers.set(marker.id, marker);
  }

  removeMarker(markerId: string): void {
    this.markers.delete(markerId);
  }

  completeMarker(markerId: string): void {
    const marker = this.markers.get(markerId);
    if (marker) {
      marker.completed = true;
      marker.visible = false;
    }
  }

  // Navigation helpers
  getConnectedLocations(): Location[] {
    const currentLoc = this.getCurrentLocation();
    if (!currentLoc) return [];

    return currentLoc.connectedLocations
      .map(id => this.locations.get(id))
      .filter(loc => loc !== undefined) as Location[];
  }

  getTravelHistory(): Location[] {
    return this.travelHistory
      .map(id => this.locations.get(id))
      .filter(loc => loc !== undefined) as Location[];
  }

  // District navigation
  getDistrictInfo(district: District): {
    name: string;
    locations: Location[];
    dangerLevel: DangerLevel;
    description: string;
  } {
    const districtData = {
      [District.WATSON]: {
        name: 'Watson',
        description: 'Industrial district with immigrant communities',
        dangerLevel: DangerLevel.MODERATE
      },
      [District.CITY_CENTER]: {
        name: 'City Center',
        description: 'Corporate and commercial heart of Night City',
        dangerLevel: DangerLevel.LOW
      },
      [District.WESTBROOK]: {
        name: 'Westbrook',
        description: 'Entertainment and nightlife district',
        dangerLevel: DangerLevel.MODERATE
      },
      [District.HEYWOOD]: {
        name: 'Heywood',
        description: 'Suburban residential and business district',
        dangerLevel: DangerLevel.LOW
      },
      [District.SANTO_DOMINGO]: {
        name: 'Santo Domingo',
        description: 'Industrial manufacturing district',
        dangerLevel: DangerLevel.HIGH
      },
      [District.PACIFICA]: {
        name: 'Pacifica',
        description: 'Abandoned combat zone',
        dangerLevel: DangerLevel.EXTREME
      },
      [District.BADLANDS]: {
        name: 'The Badlands',
        description: 'Wasteland beyond the city limits',
        dangerLevel: DangerLevel.EXTREME
      },
      [District.CORPO_PLAZA]: {
        name: 'Corpo Plaza',
        description: 'Corporate headquarters and government buildings',
        dangerLevel: DangerLevel.RESTRICTED
      }
    };

    const info = districtData[district];
    const locations = this.getLocationsByDistrict(district);

    return {
      ...info,
      locations
    };
  }

  // Save/Load functionality
  saveGameState(): string {
    const gameState = {
      currentLocation: this.currentLocation,
      travelHistory: this.travelHistory,
      locations: Array.from(this.locations.entries()).map(([id, location]) => [id, {
        ...location,
        // Only save the state that can change
        unlocked: location.unlocked,
        discovered: location.discovered
      }]),
      markers: Array.from(this.markers.entries()).map(([id, marker]) => [id, {
        ...marker,
        visible: marker.visible,
        completed: marker.completed
      }])
    };
    
    return JSON.stringify(gameState);
  }

  loadGameState(saveData: string): boolean {
    try {
      const gameState = JSON.parse(saveData);
      
      if (gameState.currentLocation) {
        this.currentLocation = gameState.currentLocation;
      }
      
      if (gameState.travelHistory) {
        this.travelHistory = gameState.travelHistory;
      }
      
      if (gameState.locations) {
        // Update location states
        for (const [id, locationData] of gameState.locations) {
          const existingLocation = this.locations.get(id);
          if (existingLocation) {
            existingLocation.unlocked = locationData.unlocked;
            existingLocation.discovered = locationData.discovered;
          }
        }
      }
      
      if (gameState.markers) {
        // Clear existing markers and load saved ones
        this.markers.clear();
        for (const [id, markerData] of gameState.markers) {
          this.markers.set(id, markerData);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Failed to load map state:', error);
      return false;
    }
  }

  // Reset map state (new game)
  resetMapState(): void {
    this.currentLocation = 'apartment_v';
    this.travelHistory = [];
    
    // Reset location states
    for (const location of this.locations.values()) {
      if (location.id === 'apartment_v') {
        location.unlocked = true;
        location.discovered = true;
      } else {
        location.unlocked = false;
        location.discovered = false;
      }
    }
    
    // Reset markers
    this.initializeMarkers();
  }

  // Update apartment name based on character
  updateApartmentForCharacter(characterName: string): void {
    const apartment = this.locations.get('apartment_v');
    if (apartment) {
      apartment.name = `${characterName}'s Apartment`;
      apartment.description = `${characterName}'s modest apartment in Watson. Not much, but it's yours. The place where you start each day in Night City.`;
    }
  }

  // Utility methods
  getLocationName(locationId: string): string {
    const location = this.locations.get(locationId);
    return location ? location.name : 'Unknown Location';
  }

  getDangerLevelColor(dangerLevel: DangerLevel): string {
    const colors = {
      [DangerLevel.SAFE]: 'text-green-400',
      [DangerLevel.LOW]: 'text-blue-400',
      [DangerLevel.MODERATE]: 'text-yellow-400',
      [DangerLevel.HIGH]: 'text-orange-400',
      [DangerLevel.EXTREME]: 'text-red-400',
      [DangerLevel.RESTRICTED]: 'text-purple-400'
    };
    return colors[dangerLevel];
  }

  getServiceIcon(service: ServiceType): string {
    const icons = {
      [ServiceType.RIPPERDOC]: '🔧',
      [ServiceType.WEAPONS_VENDOR]: '🔫',
      [ServiceType.ARMOR_VENDOR]: '🛡️',
      [ServiceType.NETRUNNER_SHOP]: '💻',
      [ServiceType.BAR]: '🍺',
      [ServiceType.HOTEL]: '🏨',
      [ServiceType.GARAGE]: '🚗',
      [ServiceType.BLACK_MARKET]: '🕶️',
      [ServiceType.CORPO_OFFICE]: '🏢',
      [ServiceType.DATA_FORTRESS]: '🏰'
    };
    return icons[service] || '📍';
  }
}

// Export singleton instance
export const mapService = new MapService();
