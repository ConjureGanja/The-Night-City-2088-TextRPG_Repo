import React, { useState, useEffect } from 'react';
import { 
  characterProgressionService, 
  CharacterOrigin, 
  CharacterRole, 
  CharacterSpecialization,
  CharacterBackground
} from '../services/characterProgressionService';
import { 
  CHARACTER_ORIGINS, 
  CHARACTER_ROLES, 
  CHARACTER_CREATION_PROMPTS,
  CHARACTER_STORY_INTEGRATION
} from '../constants';

interface CharacterCreationPanelProps {
  isVisible: boolean;
  onComplete: () => void;
  onCancel: () => void;
}

const CharacterCreationPanel: React.FC<CharacterCreationPanelProps> = ({ isVisible, onComplete, onCancel }) => {
  // Character creation steps: name, creation mode, origin, role, specialization, background story, appearance
  const [step, setStep] = useState<number>(0);
  const [characterName, setCharacterName] = useState<string>('');
  const [creationMode, setCreationMode] = useState<'manual' | 'auto'>('manual');
  const [origin, setOrigin] = useState<CharacterOrigin>('STREET_KID');
  const [role, setRole] = useState<CharacterRole>('SOLO');
  const [specialization, setSpecialization] = useState<CharacterSpecialization | null>(null);
  const [backgroundStory, setBackgroundStory] = useState<string>('');
  const [appearance, setAppearance] = useState<CharacterBackground['appearance']>({
    gender: '',
    hairStyle: '',
    hairColor: '',
    eyeColor: '',
    facialFeatures: '',
    clothing: '',
    distinguishingMarks: ''
  });
  
  // Appearance options
  const genderOptions = ['Male', 'Female', 'Non-binary', 'Other'];
  const hairStyleOptions = ['Short', 'Medium', 'Long', 'Shaved', 'Mohawk', 'Dreadlocks', 'Other'];
  const hairColorOptions = ['Black', 'Brown', 'Blonde', 'Red', 'Gray', 'White', 'Blue', 'Pink', 'Green', 'Other'];
  const eyeColorOptions = ['Brown', 'Blue', 'Green', 'Gray', 'Hazel', 'Amber', 'Cybernetic', 'Other'];
  
  // Custom input states for "Other" options
  const [customGender, setCustomGender] = useState<string>('');
  const [customHairStyle, setCustomHairStyle] = useState<string>('');
  const [customHairColor, setCustomHairColor] = useState<string>('');
  const [customEyeColor, setCustomEyeColor] = useState<string>('');
  const [isGeneratingCharacter, setIsGeneratingCharacter] = useState<boolean>(false);
  
  const [availableSpecializations, setAvailableSpecializations] = useState<CharacterSpecialization[]>([]);
  const [originBackgroundHooks, setOriginBackgroundHooks] = useState<string[]>([]);

  useEffect(() => {
    if (isVisible) {
      // Load hooks for the selected origin
      const hooks = CHARACTER_STORY_INTEGRATION.ORIGIN_BACKSTORY_HOOKS[origin] || [];
      setOriginBackgroundHooks(hooks);
    }
  }, [isVisible, origin]);

  useEffect(() => {
    // Update available specializations when role changes
    const specs = CHARACTER_STORY_INTEGRATION.ROLE_SPECIALIZATION_OPTIONS[role] || [];
    setAvailableSpecializations(specs);
    // Reset specialization when role changes
    setSpecialization(null);  }, [role]);

  const generateRandomCharacter = async () => {
    setIsGeneratingCharacter(true);
    try {
      // Randomly select character attributes
      const randomOrigin = Object.keys(CHARACTER_ORIGINS)[Math.floor(Math.random() * Object.keys(CHARACTER_ORIGINS).length)] as CharacterOrigin;
      const randomRole = Object.keys(CHARACTER_ROLES)[Math.floor(Math.random() * Object.keys(CHARACTER_ROLES).length)] as CharacterRole;
      const randomGender = genderOptions[Math.floor(Math.random() * (genderOptions.length - 1))]; // Exclude "Other"
      const randomHairStyle = hairStyleOptions[Math.floor(Math.random() * (hairStyleOptions.length - 1))];
      const randomHairColor = hairColorOptions[Math.floor(Math.random() * (hairColorOptions.length - 1))];
      const randomEyeColor = eyeColorOptions[Math.floor(Math.random() * (eyeColorOptions.length - 1))];
      
      // Generate random name based on gender
      const maleNames = ['Marcus', 'Jake', 'Rex', 'Dante', 'Victor', 'Phoenix', 'Kai', 'Zane'];
      const femaleNames = ['Nova', 'Raven', 'Maya', 'Zara', 'Aria', 'Nyx', 'Echo', 'Storm'];
      const neutralNames = ['River', 'Sage', 'Quinn', 'Ash', 'Blade', 'Cipher', 'Ghost', 'Zero'];
      
      let namePool = neutralNames;
      if (randomGender === 'Male') namePool = maleNames;
      else if (randomGender === 'Female') namePool = femaleNames;
      
      const randomName = namePool[Math.floor(Math.random() * namePool.length)];
      
      // Set all the random values
      setCharacterName(randomName);
      setOrigin(randomOrigin);
      setRole(randomRole);
      setAppearance({
        gender: randomGender,
        hairStyle: randomHairStyle,
        hairColor: randomHairColor,
        eyeColor: randomEyeColor,
        facialFeatures: 'Sharp jawline with subtle cybernetic enhancement around the eyes',
        clothing: 'Dark tactical gear with neon accent lighting',
        distinguishingMarks: 'Small scar above left eyebrow and neural jack ports behind ears'
      });
      
      // Generate background story using AI would go here
      setBackgroundStory(`A ${randomOrigin.toLowerCase().replace('_', ' ')} turned ${randomRole.toLowerCase()} with a mysterious past in Night City.`);
      
      // Skip to final step
      setStep(6);
    } catch (error) {
      console.error('Error generating character:', error);
    } finally {
      setIsGeneratingCharacter(false);
    }
  };

  const handleNextStep = () => {
    if (step === 0) { // After character name
      if (!characterName.trim()) return;
    } else if (step === 1) { // After creation mode selection
      if (creationMode === 'auto') {
        generateRandomCharacter();
        return;
      }
    } else if (step === 2) { // After origin selection
      characterProgressionService.setOrigin(origin);
    } else if (step === 3) { // After role selection
      characterProgressionService.setRole(role);
    } else if (step === 4) { // After specialization selection
      if (specialization) {
        characterProgressionService.setSpecialization(specialization);
      }
    } else if (step === 5) { // After background story
      characterProgressionService.setBackgroundStory(backgroundStory);
    } else if (step === 6) { // After appearance - Final step
      // Get final appearance values, using custom inputs where "Other" is selected
      const finalAppearance = {
        ...appearance,
        gender: appearance.gender === 'Other' ? customGender : appearance.gender,
        hairStyle: appearance.hairStyle === 'Other' ? customHairStyle : appearance.hairStyle,
        hairColor: appearance.hairColor === 'Other' ? customHairColor : appearance.hairColor,
        eyeColor: appearance.eyeColor === 'Other' ? customEyeColor : appearance.eyeColor
      };
      
      characterProgressionService.setAppearance(finalAppearance);
      characterProgressionService.setCharacterName(characterName);
      
      // Complete character creation
      onComplete();
      return;
    }
    // Move to next step
    setStep(prevStep => prevStep + 1);
  };const handlePreviousStep = () => {
    if (step === 0) {
      onCancel();
    } else {
      setStep(prevStep => prevStep - 1);
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-green-700 rounded-lg w-11/12 max-w-4xl max-h-[90vh] overflow-y-auto p-6">        <div className="flex justify-between items-center mb-6 border-b border-green-700 pb-2">
          <h2 className="text-2xl font-bold text-yellow-400">CHARACTER CREATION</h2>
          <div className="flex space-x-2">
            <span className={`px-2 rounded text-xs ${step >= 0 ? 'bg-green-700' : 'bg-gray-800'}`}>Name</span>
            <span className={`px-2 rounded text-xs ${step >= 1 ? 'bg-green-700' : 'bg-gray-800'}`}>Mode</span>
            <span className={`px-2 rounded text-xs ${step >= 2 ? 'bg-green-700' : 'bg-gray-800'}`}>Origin</span>
            <span className={`px-2 rounded text-xs ${step >= 3 ? 'bg-green-700' : 'bg-gray-800'}`}>Role</span>
            <span className={`px-2 rounded text-xs ${step >= 4 ? 'bg-green-700' : 'bg-gray-800'}`}>Spec</span>
            <span className={`px-2 rounded text-xs ${step >= 5 ? 'bg-green-700' : 'bg-gray-800'}`}>Story</span>
            <span className={`px-2 rounded text-xs ${step >= 6 ? 'bg-green-700' : 'bg-gray-800'}`}>Look</span>
          </div>
        </div>
        
        {/* Character Name */}
        {step === 0 && (
          <div className="mb-6">
            <h3 className="text-xl mb-4 text-cyan-400">What is your character's name?</h3>
            <input 
              type="text" 
              className="w-full bg-gray-800 text-green-300 border border-gray-700 rounded p-3 text-lg"
              placeholder="Enter character name..."
              value={characterName}
              onChange={(e) => setCharacterName(e.target.value)}
              autoFocus
            />
            <p className="text-gray-400 text-sm mt-2">This will be your character's name throughout the adventure.</p>
          </div>
        )}

        {/* Creation Mode Selection */}
        {step === 1 && (
          <div className="mb-6">
            <h3 className="text-xl mb-4 text-cyan-400">How would you like to create your character?</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div 
                className={`border p-6 rounded-lg cursor-pointer transition-all ${
                  creationMode === 'manual' ? 'border-green-500 bg-green-900 bg-opacity-30' : 'border-gray-700 hover:border-gray-500'
                }`}
                onClick={() => setCreationMode('manual')}
              >
                <h4 className="text-lg font-bold mb-3 text-cyan-400">🎮 Manual Creation</h4>
                <p className="text-sm text-gray-400 mb-4">
                  Step through each choice to craft your unique character. Choose your origin, role, appearance, and write your own background story.
                </p>
                <div className="text-xs text-green-400">
                  ✓ Full customization control<br/>
                  ✓ Write your own backstory<br/>
                  ✓ Choose every detail
                </div>
              </div>
              
              <div 
                className={`border p-6 rounded-lg cursor-pointer transition-all ${
                  creationMode === 'auto' ? 'border-green-500 bg-green-900 bg-opacity-30' : 'border-gray-700 hover:border-gray-500'
                }`}
                onClick={() => setCreationMode('auto')}
              >
                <h4 className="text-lg font-bold mb-3 text-purple-400">🤖 AI Generation</h4>
                <p className="text-sm text-gray-400 mb-4">
                  Let our AI create a complete character for you. Perfect for quick starts or inspiration.
                </p>
                <div className="text-xs text-purple-400">
                  ✓ Instant character creation<br/>
                  ✓ AI-generated backstory<br/>
                  ✓ Balanced attributes
                </div>
              </div>
            </div>
            {isGeneratingCharacter && (
              <div className="mt-4 text-center">
                <div className="text-purple-400 animate-pulse">🤖 Generating your character...</div>
              </div>
            )}
          </div>
        )}

        {/* Origin Selection */}
        {step === 2 && (
          <div className="mb-6">
            <h3 className="text-xl mb-4 text-cyan-400">{CHARACTER_CREATION_PROMPTS.ORIGIN}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(CHARACTER_ORIGINS).map(([key, _]) => (
                <div 
                  key={key} 
                  className={`border p-4 rounded-lg cursor-pointer transition-all ${
                    origin === key ? 'border-green-500 bg-green-900 bg-opacity-30' : 'border-gray-700 hover:border-gray-500'
                  }`}
                  onClick={() => setOrigin(key as CharacterOrigin)}
                >
                  <h4 className="text-lg font-bold mb-2">{key.replace('_', ' ')}</h4>
                  <p className="text-sm mb-4 text-gray-400">
                    {key === 'CORPO' && 'You worked in the corporate world, enjoying its privileges until something went wrong.'}
                    {key === 'STREET_KID' && 'You grew up on the streets of Night City, learning its rules to survive.'}
                    {key === 'NOMAD' && 'You belonged to a nomad clan, living outside the city until circumstances changed.'}
                  </p>
                  <div className="text-xs text-gray-500">
                    <p>Unique Background Hooks:</p>
                    <ul className="list-disc list-inside">
                      {CHARACTER_STORY_INTEGRATION.ORIGIN_BACKSTORY_HOOKS[key as CharacterOrigin].slice(0, 2).map((hook, index) => (
                        <li key={index} className="truncate">{hook}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}        {/* Role Selection */}
        {step === 3 && (
          <div className="mb-6">
            <h3 className="text-xl mb-4 text-cyan-400">{CHARACTER_CREATION_PROMPTS.ROLE}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(CHARACTER_ROLES).map(([key, _]) => (
                <div 
                  key={key} 
                  className={`border p-4 rounded-lg cursor-pointer transition-all ${
                    role === key ? 'border-green-500 bg-green-900 bg-opacity-30' : 'border-gray-700 hover:border-gray-500'
                  }`}
                  onClick={() => setRole(key as CharacterRole)}
                >
                  <h4 className="text-lg font-bold mb-2">{key.replace('_', ' ')}</h4>
                  <p className="text-sm mb-3 text-gray-400">
                    {key === 'SOLO' && 'A mercenary and combat specialist, hired for dangerous jobs.'}
                    {key === 'NETRUNNER' && 'A digital infiltrator who can hack into systems and networks.'}
                    {key === 'TECHIE' && 'An engineer specialized in creating and maintaining technology.'}
                    {key === 'ROCKERBOY' && 'A charismatic performer who uses art to fight the system.'}
                    {key === 'FIXER' && 'A deal-maker and middleman connecting people with what they need.'}
                    {key === 'NOMAD' && 'A technical expert and driver from the nomad clans.'}
                    {key === 'MEDIA' && 'A journalist uncovering the truth behind Night City stories.'}
                    {key === 'MEDTECH' && 'A street doctor providing medical care outside the system.'}
                    {key === 'EXEC' && 'A corporate officer using business skills to navigate power.'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}        {/* Specialization Selection */}
        {step === 4 && (
          <div className="mb-6">
            <h3 className="text-xl mb-4 text-cyan-400">Choose your {role} specialization:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableSpecializations.map((spec) => (
                <div 
                  key={spec} 
                  className={`border p-4 rounded-lg cursor-pointer transition-all ${
                    specialization === spec ? 'border-green-500 bg-green-900 bg-opacity-30' : 'border-gray-700 hover:border-gray-500'
                  }`}
                  onClick={() => setSpecialization(spec)}
                >
                  <h4 className="text-lg font-bold mb-2">{spec}</h4>
                  <p className="text-sm text-gray-400">
                    Specialized in {spec.toLowerCase()} techniques and approaches.
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}        {/* Background Story */}
        {step === 5 && (
          <div className="mb-6">
            <h3 className="text-xl mb-4 text-cyan-400">{CHARACTER_CREATION_PROMPTS.BACKGROUND}</h3>
            <div className="mb-4">
              <h4 className="text-md font-bold mb-2">Origin Story Hooks:</h4>
              <ul className="list-disc list-inside mb-4 text-gray-400">
                {originBackgroundHooks.map((hook, index) => (
                  <li key={index}>{hook}</li>
                ))}
              </ul>
            </div>
            <textarea 
              className="w-full bg-gray-800 text-green-300 border border-gray-700 rounded-lg p-3 h-40"
              placeholder="Write your character's background story here..."
              value={backgroundStory}
              onChange={(e) => setBackgroundStory(e.target.value)}
            />
          </div>
        )}        {/* Appearance */}
        {step === 6 && (
          <div className="mb-6">
            <h3 className="text-xl mb-4 text-cyan-400">{CHARACTER_CREATION_PROMPTS.APPEARANCE}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Gender Selection */}
              <div className="mb-3">
                <label className="block text-sm text-gray-400 mb-1" htmlFor="gender-select">Gender</label>
                <select 
                  id="gender-select"
                  className="w-full bg-gray-800 text-green-300 border border-gray-700 rounded p-2"
                  value={appearance.gender}
                  onChange={(e) => setAppearance({...appearance, gender: e.target.value})}
                >
                  <option value="">Select gender...</option>
                  {genderOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                {appearance.gender === 'Other' && (
                  <input
                    type="text"
                    className="w-full bg-gray-800 text-green-300 border border-gray-700 rounded p-2 mt-2"
                    placeholder="Specify gender..."
                    value={customGender}
                    onChange={(e) => setCustomGender(e.target.value)}
                  />
                )}
              </div>

              {/* Hair Style Selection */}
              <div className="mb-3">
                <label className="block text-sm text-gray-400 mb-1" htmlFor="hair-style-select">Hair Style</label>
                <select 
                  id="hair-style-select"
                  className="w-full bg-gray-800 text-green-300 border border-gray-700 rounded p-2"
                  value={appearance.hairStyle}
                  onChange={(e) => setAppearance({...appearance, hairStyle: e.target.value})}
                >
                  <option value="">Select hair style...</option>
                  {hairStyleOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                {appearance.hairStyle === 'Other' && (
                  <input
                    type="text"
                    className="w-full bg-gray-800 text-green-300 border border-gray-700 rounded p-2 mt-2"
                    placeholder="Describe hair style..."
                    value={customHairStyle}
                    onChange={(e) => setCustomHairStyle(e.target.value)}
                  />
                )}
              </div>

              {/* Hair Color Selection */}
              <div className="mb-3">
                <label className="block text-sm text-gray-400 mb-1" htmlFor="hair-color-select">Hair Color</label>
                <select 
                  id="hair-color-select"
                  className="w-full bg-gray-800 text-green-300 border border-gray-700 rounded p-2"
                  value={appearance.hairColor}
                  onChange={(e) => setAppearance({...appearance, hairColor: e.target.value})}
                >
                  <option value="">Select hair color...</option>
                  {hairColorOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                {appearance.hairColor === 'Other' && (
                  <input
                    type="text"
                    className="w-full bg-gray-800 text-green-300 border border-gray-700 rounded p-2 mt-2"
                    placeholder="Specify hair color..."
                    value={customHairColor}
                    onChange={(e) => setCustomHairColor(e.target.value)}
                  />
                )}
              </div>

              {/* Eye Color Selection */}
              <div className="mb-3">
                <label className="block text-sm text-gray-400 mb-1" htmlFor="eye-color-select">Eye Color</label>
                <select 
                  id="eye-color-select"
                  className="w-full bg-gray-800 text-green-300 border border-gray-700 rounded p-2"
                  value={appearance.eyeColor}
                  onChange={(e) => setAppearance({...appearance, eyeColor: e.target.value})}
                >
                  <option value="">Select eye color...</option>
                  {eyeColorOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                {appearance.eyeColor === 'Other' && (
                  <input
                    type="text"
                    className="w-full bg-gray-800 text-green-300 border border-gray-700 rounded p-2 mt-2"
                    placeholder="Specify eye color..."
                    value={customEyeColor}
                    onChange={(e) => setCustomEyeColor(e.target.value)}
                  />
                )}
              </div>

              {/* Facial Features */}
              <div className="mb-3">
                <label className="block text-sm text-gray-400 mb-1" htmlFor="facial-features">Facial Features</label>
                <input 
                  id="facial-features"
                  type="text" 
                  className="w-full bg-gray-800 text-green-300 border border-gray-700 rounded p-2"
                  placeholder="e.g., Sharp jawline, cybernetic eyes..."
                  value={appearance.facialFeatures}
                  onChange={(e) => setAppearance({...appearance, facialFeatures: e.target.value})}
                />
              </div>

              {/* Clothing Style */}
              <div className="mb-3">
                <label className="block text-sm text-gray-400 mb-1" htmlFor="clothing-style">Clothing Style</label>
                <input 
                  id="clothing-style"
                  type="text" 
                  className="w-full bg-gray-800 text-green-300 border border-gray-700 rounded p-2"
                  placeholder="e.g., Dark tactical gear, neon streetwear..."
                  value={appearance.clothing}
                  onChange={(e) => setAppearance({...appearance, clothing: e.target.value})}
                />
              </div>

              {/* Distinguishing Marks */}
              <div className="mb-3 md:col-span-2">
                <label className="block text-sm text-gray-400 mb-1" htmlFor="distinguishing-marks">Distinguishing Marks</label>
                <input 
                  id="distinguishing-marks"
                  type="text" 
                  className="w-full bg-gray-800 text-green-300 border border-gray-700 rounded p-2"
                  placeholder="e.g., Scars, tattoos, cybernetic implants..."
                  value={appearance.distinguishingMarks}
                  onChange={(e) => setAppearance({...appearance, distinguishingMarks: e.target.value})}
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between mt-6 pt-4 border-t border-gray-700">
          <button
            onClick={handlePreviousStep}
            className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded border border-gray-600"
          >
            {step === 0 ? 'Cancel' : 'Back'}
          </button>          <button
            onClick={handleNextStep}
            className="px-6 py-2 bg-green-800 hover:bg-green-700 text-white rounded border border-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed"
            disabled={
              (step === 0 && !characterName.trim()) ||
              (step === 4 && !specialization) ||
              isGeneratingCharacter
            }
            title={
              step === 0 ? "Enter a character name" :
              step === 4 ? "Choose a specialization" :
              "Continue to next step"
            }
          >
            {step === 6 ? 'Complete Character' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CharacterCreationPanel;
