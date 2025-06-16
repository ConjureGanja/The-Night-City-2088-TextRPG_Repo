import React, { useState, useEffect } from 'react';
import { 
  characterProgressionService, 
  CharacterAttributes, 
  CharacterSkills, 
  CharacterStats,
  Perk,
  ProgressionEvent,
  ProgressionEventType
} from '../services/characterProgressionService';

interface CharacterProgressionPanelProps {
  isVisible: boolean;
  onToggle: () => void;
}

const CharacterProgressionPanel: React.FC<CharacterProgressionPanelProps> = ({ isVisible, onToggle }) => {
  const [attributes, setAttributes] = useState<CharacterAttributes>(characterProgressionService.getAttributes());
  const [skills, setSkills] = useState<CharacterSkills>(characterProgressionService.getSkills());
  const [stats, setStats] = useState<CharacterStats>(characterProgressionService.getStats());
  const [perks, setPerks] = useState<Perk[]>(characterProgressionService.getPerks());
  const [recentEvents, setRecentEvents] = useState<ProgressionEvent[]>([]);
  const [activeTab, setActiveTab] = useState<'attributes' | 'skills' | 'perks' | 'stats'>('stats');

  useEffect(() => {
    if (isVisible) {
      refreshData();
    }
  }, [isVisible]);

  const refreshData = () => {
    setAttributes(characterProgressionService.getAttributes());
    setSkills(characterProgressionService.getSkills());
    setStats(characterProgressionService.getStats());
    setPerks(characterProgressionService.getPerks());
    setRecentEvents(characterProgressionService.getProgressionHistory().slice(-5));
  };

  const handleAttributeIncrease = (attribute: keyof CharacterAttributes) => {
    const result = characterProgressionService.increaseAttribute(attribute);
    if (result.success) {
      refreshData();
    }
  };

  const handleSkillIncrease = (skill: keyof CharacterSkills) => {
    const result = characterProgressionService.increaseSkill(skill);
    if (result.success) {
      refreshData();
    }
  };

  const handlePerkLearn = (perkId: string) => {
    const result = characterProgressionService.learnPerk(perkId);
    if (result.success) {
      refreshData();
    }
  };

  const getAttributeColor = (value: number): string => {
    if (value >= 15) return 'text-red-400';
    if (value >= 10) return 'text-yellow-400';
    if (value >= 6) return 'text-green-400';
    return 'text-gray-400';
  };

  const getSkillColor = (value: number): string => {
    if (value >= 15) return 'text-purple-400';
    if (value >= 10) return 'text-blue-400';
    if (value >= 5) return 'text-cyan-400';
    return 'text-gray-400';
  };

  const getProgressBarColor = (current: number, max: number): string => {
    const percentage = (current / max) * 100;
    if (percentage >= 75) return 'bg-green-400';
    if (percentage >= 50) return 'bg-yellow-400';
    if (percentage >= 25) return 'bg-orange-400';
    return 'bg-red-400';
  };

  const getEventTypeIcon = (type: ProgressionEventType): string => {
    const icons = {
      [ProgressionEventType.LEVEL_UP]: '⭐',
      [ProgressionEventType.SKILL_INCREASE]: '📈',
      [ProgressionEventType.ATTRIBUTE_INCREASE]: '💪',
      [ProgressionEventType.PERK_UNLOCKED]: '🧠',
      [ProgressionEventType.ACHIEVEMENT]: '🏆'
    };
    return icons[type] || '📝';
  };
  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="bg-gray-900 border-2 border-cyan-400 rounded-lg w-full max-w-6xl h-full max-h-screen m-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gray-800 border-b border-cyan-400 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse"></div>
            <h2 className="text-cyan-400 font-bold text-xl">CHARACTER MATRIX v1.3</h2>
            <div className="text-sm text-gray-400">
              Level {stats.level} | XP: {stats.experience}/{stats.experienceToNext}
            </div>
          </div>
          <button
            onClick={onToggle}
            className="text-cyan-400 hover:text-white transition-colors text-xl"
          >
            ✕
          </button>
        </div>

        <div className="flex h-full">
          {/* Left Panel - Navigation */}
          <div className="w-64 border-r border-cyan-400 p-4 bg-gray-800">            {/* Character Summary */}
            <div className="mb-6 p-3 border border-gray-600 rounded bg-gray-900">
              <h3 className="text-cyan-400 font-bold mb-3">{characterProgressionService.getBackground().name.toUpperCase()} - {characterProgressionService.getBackground().role}</h3>
              
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">Level:</span>
                  <span className="text-cyan-400 font-bold">{stats.level}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Health:</span>
                  <span className={getProgressBarColor(stats.health, stats.maxHealth)}>
                    {stats.health}/{stats.maxHealth}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Stamina:</span>
                  <span className={getProgressBarColor(stats.stamina, stats.maxStamina)}>
                    {stats.stamina}/{stats.maxStamina}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Eddies:</span>
                  <span className="text-yellow-400">{stats.eddies.toLocaleString()} €$</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Street Cred:</span>
                  <span className="text-green-400">{stats.credRating}/100</span>
                </div>
              </div>

              {/* Experience Bar */}
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Experience</span>
                  <span>{Math.round((stats.experience / stats.experienceToNext) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">                  <div 
                    className="bg-cyan-400 h-2 rounded-full transition-all" 
                    style={{ width: `${(stats.experience / stats.experienceToNext) * 100}%` }} // eslint-disable-line react/forbid-dom-props
                  />
                </div>
              </div>
            </div>

            {/* Points Available */}
            <div className="mb-6 p-3 border border-yellow-600 rounded bg-yellow-900 bg-opacity-20">
              <h4 className="text-yellow-400 font-bold text-sm mb-2">AVAILABLE POINTS</h4>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">Attribute Points:</span>
                  <span className="text-yellow-400 font-bold">{stats.attributePoints}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Skill Points:</span>
                  <span className="text-blue-400 font-bold">{stats.skillPoints}</span>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="space-y-2">
              {[
                { key: 'stats', label: 'Overview', icon: '📊' },
                { key: 'attributes', label: 'Attributes', icon: '💪' },
                { key: 'skills', label: 'Skills', icon: '🛠️' },
                { key: 'perks', label: 'Perks', icon: '🧠' }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`w-full text-left p-2 rounded transition-all ${
                    activeTab === tab.key 
                      ? 'bg-cyan-600 text-white' 
                      : 'bg-gray-700 text-cyan-400 hover:bg-gray-600'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Recent Events */}
            {recentEvents.length > 0 && (
              <div className="mt-6 p-3 border border-green-600 rounded bg-green-900 bg-opacity-20">
                <h4 className="text-green-400 font-bold text-sm mb-2">RECENT PROGRESS</h4>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {recentEvents.reverse().map((event, index) => (
                    <div key={index} className="text-xs">
                      <div className="flex items-center space-x-1">
                        <span>{getEventTypeIcon(event.type)}</span>
                        <span className="text-gray-300">{event.title}</span>
                      </div>
                      <div className="text-gray-500 text-xs ml-4">{event.timestamp}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Main Content Area */}
          <div className="flex-1 p-6 overflow-y-auto">
            {activeTab === 'stats' && (
              <div className="space-y-6">
                <h3 className="text-cyan-400 font-bold text-2xl mb-4">CHARACTER OVERVIEW</h3>
                
                {/* Combat Stats */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="border border-gray-600 rounded p-4 bg-gray-800">
                    <h4 className="text-cyan-400 font-bold mb-3">COMBAT RATING</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Damage:</span>
                        <span className="text-red-400 font-bold">{stats.damage}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Defense:</span>
                        <span className="text-blue-400 font-bold">{stats.defense}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Hacking Power:</span>
                        <span className="text-purple-400 font-bold">{stats.hackingPower}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Stealth Rating:</span>
                        <span className="text-green-400 font-bold">{stats.stealthRating}</span>
                      </div>
                    </div>
                  </div>

                  <div className="border border-gray-600 rounded p-4 bg-gray-800">
                    <h4 className="text-cyan-400 font-bold mb-3">PHYSICAL STATUS</h4>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-400">Health</span>
                          <span className="text-white">{stats.health}/{stats.maxHealth}</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">                          <div 
                            className={`h-2 rounded-full transition-all ${getProgressBarColor(stats.health, stats.maxHealth)}`}
                            style={{ width: `${(stats.health / stats.maxHealth) * 100}%` }} // eslint-disable-line react/forbid-dom-props
                          />
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-400">Stamina</span>
                          <span className="text-white">{stats.stamina}/{stats.maxStamina}</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">                          <div 
                            className={`h-2 rounded-full transition-all ${getProgressBarColor(stats.stamina, stats.maxStamina)}`}
                            style={{ width: `${(stats.stamina / stats.maxStamina) * 100}%` }} // eslint-disable-line react/forbid-dom-props
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-400">Humanity</span>
                          <span className="text-white">{stats.maxHumanity - stats.humanityLoss}/{stats.maxHumanity}</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-cyan-400 h-2 rounded-full transition-all"
                            style={{ width: `${((stats.maxHumanity - stats.humanityLoss) / stats.maxHumanity) * 100}%` }} // eslint-disable-line react/forbid-dom-props
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Attribute Summary */}
                <div className="border border-gray-600 rounded p-4 bg-gray-800">
                  <h4 className="text-cyan-400 font-bold mb-3">ATTRIBUTE SUMMARY</h4>
                  <div className="grid grid-cols-5 gap-4">
                    {Object.entries(attributes).map(([key, value]) => (
                      <div key={key} className="text-center">
                        <div className="text-gray-400 text-xs uppercase">{key}</div>
                        <div className={`text-2xl font-bold ${getAttributeColor(value)}`}>{value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'attributes' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-cyan-400 font-bold text-2xl">ATTRIBUTES</h3>
                  <div className="text-yellow-400 font-bold">
                    Points Available: {stats.attributePoints}
                  </div>
                </div>

                <div className="grid gap-4">
                  {Object.entries(attributes).map(([key, value]) => (
                    <div key={key} className="border border-gray-600 rounded p-4 bg-gray-800">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className={`font-bold text-lg capitalize ${getAttributeColor(value)}`}>
                            {key} - {value}
                          </h4>
                          <div className="text-sm text-gray-400">
                            {key === 'body' && 'Physical strength, health, and resilience'}
                            {key === 'intelligence' && 'Problem-solving and technical knowledge'}
                            {key === 'reflexes' && 'Speed, dexterity, and reaction time'}
                            {key === 'technical' && 'Engineering, crafting, and technical skills'}
                            {key === 'cool' && 'Mental resilience, stealth, and composure'}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <div className="text-right">
                            <div className="text-xs text-gray-400">Level {value}/20</div>
                            <div className="w-20 bg-gray-700 rounded-full h-2 mt-1">                              <div 
                                className={`h-2 rounded-full transition-all ${getAttributeColor(value).replace('text-', 'bg-')}`}
                                style={{ width: `${(value / 20) * 100}%` }} // eslint-disable-line react/forbid-dom-props
                              />
                            </div>
                          </div>
                          
                          <button
                            onClick={() => handleAttributeIncrease(key as keyof CharacterAttributes)}
                            disabled={stats.attributePoints <= 0 || value >= 20}
                            className="bg-yellow-600 hover:bg-yellow-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-3 py-1 rounded transition-colors"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'skills' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-cyan-400 font-bold text-2xl">SKILLS</h3>
                  <div className="text-blue-400 font-bold">
                    Points Available: {stats.skillPoints}
                  </div>
                </div>

                <div className="grid gap-4">
                  {Object.entries(skills).map(([key, value]) => (
                    <div key={key} className="border border-gray-600 rounded p-4 bg-gray-800">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className={`font-bold text-lg capitalize ${getSkillColor(value)}`}>
                            {key.replace(/([A-Z])/g, ' $1')} - {value}
                          </h4>
                          <div className="text-sm text-gray-400">
                            {key.includes('athletics') && 'Physical fitness and endurance'}
                            {key.includes('annihilation') && 'Heavy weapons and explosives'}
                            {key.includes('streetBrawler') && 'Hand-to-hand combat'}
                            {key.includes('breach') && 'Breaking through security systems'}
                            {key.includes('quickhacking') && 'Real-time cybernetic attacks'}
                            {key.includes('assault') && 'Assault rifles and SMGs'}
                            {key.includes('handguns') && 'Pistols and revolvers'}
                            {key.includes('blades') && 'Melee weapons and swords'}
                            {key.includes('crafting') && 'Creating and upgrading items'}
                            {key.includes('engineering') && 'Technical device manipulation'}
                            {key.includes('stealth') && 'Staying hidden and undetected'}
                            {key.includes('coldBlood') && 'Composure under pressure'}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <div className="text-right">
                            <div className="text-xs text-gray-400">Level {value}/20</div>
                            <div className="w-20 bg-gray-700 rounded-full h-2 mt-1">                              <div 
                                className={`h-2 rounded-full transition-all ${getSkillColor(value).replace('text-', 'bg-')}`}
                                style={{ width: `${(value / 20) * 100}%` }} // eslint-disable-line react/forbid-dom-props
                              />
                            </div>
                          </div>
                          
                          <button
                            onClick={() => handleSkillIncrease(key as keyof CharacterSkills)}
                            disabled={stats.skillPoints <= 0 || value >= 20}
                            className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-3 py-1 rounded transition-colors"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'perks' && (
              <div className="space-y-6">
                <h3 className="text-cyan-400 font-bold text-2xl">PERKS & ABILITIES</h3>

                {/* Available Perks */}
                <div>
                  <h4 className="text-green-400 font-bold mb-3">AVAILABLE PERKS</h4>
                  <div className="grid gap-3">
                    {perks.filter(perk => perk.unlocked && !perk.learned).map(perk => (
                      <div key={perk.id} className="border border-green-600 rounded p-4 bg-green-900 bg-opacity-20">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h5 className="text-green-400 font-bold">{perk.name}</h5>
                            <p className="text-gray-300 text-sm mt-1">{perk.description}</p>
                            <div className="mt-2 text-xs text-gray-400">
                              Cost: {perk.cost} skill points
                            </div>
                            <div className="mt-1 text-xs text-cyan-400">
                              Effects: {perk.effects.map(effect => effect.description).join(', ')}
                            </div>
                          </div>
                          <button
                            onClick={() => handlePerkLearn(perk.id)}
                            disabled={stats.skillPoints < perk.cost}
                            className="bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded ml-4 transition-colors"
                          >
                            LEARN
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Learned Perks */}
                <div>
                  <h4 className="text-cyan-400 font-bold mb-3">LEARNED PERKS</h4>
                  <div className="grid gap-3">
                    {perks.filter(perk => perk.learned).map(perk => (
                      <div key={perk.id} className="border border-cyan-600 rounded p-4 bg-cyan-900 bg-opacity-20">
                        <h5 className="text-cyan-400 font-bold">{perk.name}</h5>
                        <p className="text-gray-300 text-sm mt-1">{perk.description}</p>
                        <div className="mt-2 text-xs text-green-400">
                          Active: {perk.effects.map(effect => effect.description).join(', ')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Locked Perks */}
                <div>
                  <h4 className="text-gray-400 font-bold mb-3">LOCKED PERKS</h4>
                  <div className="grid gap-3">
                    {perks.filter(perk => !perk.unlocked).map(perk => (
                      <div key={perk.id} className="border border-gray-600 rounded p-4 bg-gray-800 opacity-60">
                        <h5 className="text-gray-400 font-bold">{perk.name}</h5>
                        <p className="text-gray-500 text-sm mt-1">{perk.description}</p>
                        <div className="mt-2 text-xs text-red-400">
                          Requirements: {perk.attributeRequirement && 
                            `${perk.attributeRequirement.attribute} ${perk.attributeRequirement.level}`}
                          {perk.skillRequirement && 
                            `${perk.skillRequirement.skill} ${perk.skillRequirement.level}`}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CharacterProgressionPanel;
