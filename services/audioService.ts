// Audio Service for Night City Adventures
// Handles typing sounds, UI feedback, and dynamic ambient music

export enum SoundType {
  TYPING = 'typing',
  ENTER = 'enter',
  UI_CLICK = 'ui_click',
  ERROR = 'error',
  SUCCESS = 'success',
  LOADING = 'loading',
  NEURAL_SYNC = 'neural_sync'
}

export enum MusicMood {
  NEUTRAL = 'neutral',
  TENSE = 'tense',
  DRAMATIC = 'dramatic',
  CHILL = 'chill',
  FUNKY = 'funky',
  DARK = 'dark',
  COMBAT = 'combat',
  MYSTERY = 'mystery'
}

interface AudioConfig {
  volume: number;
  loop?: boolean;
  fadeIn?: boolean;
  fadeOut?: boolean;
}

class AudioService {
  private audioElements: Map<string, HTMLAudioElement> = new Map();
  private currentAmbientMusic: HTMLAudioElement | null = null;
  private currentMood: MusicMood = MusicMood.NEUTRAL;
  private masterVolume: number = 0.3;
  private sfxVolume: number = 0.4;
  private musicVolume: number = 0.15;
  private isEnabled: boolean = true;
  private typingCooldown: boolean = false;

  // Audio data URLs (base64 encoded short audio clips)
  private audioData = {
    [SoundType.TYPING]: [
      "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhATN+wfPfoCsAAA==",
      "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhATN+wfPfoCsAAA==",
      "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhATN+wfPfoCsAAA=="
    ],
    [SoundType.ENTER]: "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhATN+wfPfoCsAAA==",
    [SoundType.UI_CLICK]: "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhATN+wfPfoCsAAA==",
    [SoundType.ERROR]: "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhATN+wfPfoCsAAA==",
    [SoundType.SUCCESS]: "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhATN+wfPfoCsAAA==",
    [SoundType.LOADING]: "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhATN+wfPfoCsAAA==",
    [SoundType.NEURAL_SYNC]: "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhATN+wfPfoCsAAA=="
  };

  // Ambient music tracks with different moods
  // TODO: Add actual music files for each mood
  // Place audio files in a public/audio/music/ directory and update the paths below
  private musicTracks = {
    tense: {
      name: 'Neural Tension',
      // TODO: Replace with actual audio file path or URL
      // Recommended: Dark, suspenseful cyberpunk track with heavy synths
      // Duration: 3-5 minutes, seamless loop
      // Example: '/audio/music/neural-tension.mp3'
      data: null // Set to null until actual music files are added
    },
    dramatic: {
      name: 'Corporate Shadows',
      // TODO: Replace with actual audio file path or URL
      // Recommended: Epic orchestral cyberpunk with electronic elements
      // Duration: 4-6 minutes, seamless loop
      // Example: '/audio/music/corporate-shadows.mp3'
      data: null // Set to null until actual music files are added
    },
    chill: {
      name: 'Neon Nights',
      // TODO: Replace with actual audio file path or URL
      // Recommended: Smooth synthwave with ambient pads
      // Duration: 4-7 minutes, seamless loop
      // Example: '/audio/music/neon-nights.mp3'
      data: null // Set to null until actual music files are added
    },
    funky: {
      name: 'Street Pulse',
      // TODO: Replace with actual audio file path or URL
      // Recommended: Groovy cyberpunk with funk basslines
      // Duration: 3-5 minutes, seamless loop
      // Example: '/audio/music/street-pulse.mp3'
      data: null // Set to null until actual music files are added
    },
    dark: {
      name: 'Data Corruption',
      // TODO: Replace with actual audio file path or URL
      // Recommended: Dark industrial cyberpunk with distorted elements
      // Duration: 5-8 minutes, seamless loop
      // Example: '/audio/music/data-corruption.mp3'
      data: null // Set to null until actual music files are added
    },
    combat: {
      name: 'Chrome Combat',
      // TODO: Replace with actual audio file path or URL
      // Recommended: High-energy combat music with driving beats
      // Duration: 2-4 minutes, seamless loop
      // Example: '/audio/music/chrome-combat.mp3'
      data: null // Set to null until actual music files are added
    },
    mystery: {
      name: 'Digital Enigma',
      // TODO: Replace with actual audio file path or URL
      // Recommended: Mysterious atmospheric track with subtle tension
      // Duration: 4-6 minutes, seamless loop
      // Example: '/audio/music/digital-enigma.mp3'
      data: null // Set to null until actual music files are added
    },
    neutral: {
      name: 'City Ambiance',
      // TODO: Replace with actual audio file path or URL
      // Recommended: General cyberpunk city atmosphere
      // Duration: 5-10 minutes, seamless loop
      // Example: '/audio/music/city-ambiance.mp3'
      data: null // Set to null until actual music files are added
    }
  };

  constructor() {
    this.preloadAudio();
  }

  private preloadAudio() {
    // Preload sound effects
    Object.entries(this.audioData).forEach(([soundType, audioSrc]) => {
      if (Array.isArray(audioSrc)) {
        // Multiple typing sounds
        audioSrc.forEach((src, index) => {
          const audio = new Audio(src);
          audio.preload = 'auto';
          this.audioElements.set(`${soundType}_${index}`, audio);
        });
      } else {
        const audio = new Audio(audioSrc);
        audio.preload = 'auto';
        this.audioElements.set(soundType, audio);
      }
    });

    // TODO: Preload ambient music when audio files are added
    // Object.entries(this.musicTracks).forEach(([mood, track]) => {
    //   if (track.data) {
    //     const audio = new Audio(track.data);
    //     audio.preload = 'auto';
    //     audio.loop = true;
    //     this.audioElements.set(`music_${mood}`, audio);
    //   }
    // });
  }

  public setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    if (!enabled) {
      this.stopAmbientMusic();
    }
  }

  public setMasterVolume(volume: number) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
  }

  public setSfxVolume(volume: number) {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
  }

  public setMusicVolume(volume: number) {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    if (this.currentAmbientMusic) {
      this.currentAmbientMusic.volume = this.musicVolume * this.masterVolume;
    }
  }

  public playSound(soundType: SoundType, config: AudioConfig = { volume: 1 }) {
    if (!this.isEnabled) return;

    try {
      let audio: HTMLAudioElement | undefined;

      if (soundType === SoundType.TYPING) {
        // Cooldown for typing sounds to prevent spam
        if (this.typingCooldown) return;
        this.typingCooldown = true;
        setTimeout(() => { this.typingCooldown = false; }, 50);

        // Use random typing sound
        const randomIndex = Math.floor(Math.random() * 3);
        audio = this.audioElements.get(`${soundType}_${randomIndex}`);
      } else {
        audio = this.audioElements.get(soundType);
      }

      if (audio) {
        audio.currentTime = 0;
        audio.volume = config.volume * this.sfxVolume * this.masterVolume;
        const playPromise = audio.play();
        if (playPromise && playPromise.catch) {
          playPromise.catch(() => {
            // Audio play failed - not critical
          });
        }
      }
    } catch (error) {
      // Audio error - not critical for gameplay
    }
  }

  public playTypingSound() {
    this.playSound(SoundType.TYPING, { volume: 0.3 });
  }

  public playEnterSound() {
    this.playSound(SoundType.ENTER, { volume: 0.6 });
  }

  public playUIClick() {
    this.playSound(SoundType.UI_CLICK, { volume: 0.4 });
  }

  public playErrorSound() {
    this.playSound(SoundType.ERROR, { volume: 0.7 });
  }

  public playSuccessSound() {
    this.playSound(SoundType.SUCCESS, { volume: 0.5 });
  }

  public playLoadingSound() {
    this.playSound(SoundType.LOADING, { volume: 0.4 });
  }

  public playNeuralSync() {
    this.playSound(SoundType.NEURAL_SYNC, { volume: 0.5 });
  }

  public setAmbientMusic(mood: MusicMood, fadeDuration: number = 2000) {
    if (!this.isEnabled) return;

    if (this.currentMood === mood && this.currentAmbientMusic) return;

    // TODO: Implement ambient music when audio files are added
    // Currently disabled since no music files are loaded
    console.log(`Would set ambient music to ${mood} mood: ${this.musicTracks[mood as keyof typeof this.musicTracks]?.name || 'Unknown'}`);
    this.currentMood = mood;

    // try {
    //   const newMusic = this.audioElements.get(`music_${mood}`);
    //   if (!newMusic) return;

    //   // Fade out current music
    //   if (this.currentAmbientMusic) {
    //     this.fadeAudio(this.currentAmbientMusic, 0, fadeDuration, () => {
    //       if (this.currentAmbientMusic) {
    //         this.currentAmbientMusic.pause();
    //         this.currentAmbientMusic.currentTime = 0;
    //       }
    //     });
    //   }

    //   // Fade in new music
    //   this.currentAmbientMusic = newMusic;
    //   this.currentMood = mood;
    //   newMusic.volume = 0;
    //   newMusic.currentTime = 0;
      
    //   const playPromise = newMusic.play();
    //   if (playPromise && playPromise.catch) {
    //     playPromise.catch(() => {
    //       // Audio play failed - not critical
    //     });
    //   }

    //   this.fadeAudio(newMusic, this.musicVolume * this.masterVolume, fadeDuration);
    // } catch (error) {
    //   // Audio error - not critical
    // }
  }

  public stopAmbientMusic(fadeDuration: number = 1000) {
    if (this.currentAmbientMusic) {
      this.fadeAudio(this.currentAmbientMusic, 0, fadeDuration, () => {
        if (this.currentAmbientMusic) {
          this.currentAmbientMusic.pause();
          this.currentAmbientMusic = null;
        }
      });
    }
  }

  private fadeAudio(audio: HTMLAudioElement, targetVolume: number, duration: number, onComplete?: () => void) {
    const startVolume = audio.volume;
    const volumeChange = targetVolume - startVolume;
    const steps = duration / 50; // 20 FPS fade
    let currentStep = 0;

    const fadeInterval = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      
      if (progress >= 1) {
        audio.volume = targetVolume;
        clearInterval(fadeInterval);
        if (onComplete) onComplete();
      } else {
        audio.volume = startVolume + (volumeChange * progress);
      }
    }, 50);
  }

  // Analyze story content to determine appropriate mood
  public analyzeStoryMood(storyContent: string): MusicMood {
    const content = storyContent.toLowerCase();
    
    // Combat/action keywords
    if (content.includes('fight') || content.includes('battle') || content.includes('combat') || 
        content.includes('gun') || content.includes('shoot') || content.includes('attack') ||
        content.includes('violence') || content.includes('explosion')) {
      return MusicMood.COMBAT;
    }
    
    // Tense/dangerous keywords
    if (content.includes('danger') || content.includes('threat') || content.includes('warning') ||
        content.includes('alert') || content.includes('trap') || content.includes('enemy') ||
        content.includes('suspicious') || content.includes('nervous')) {
      return MusicMood.TENSE;
    }
    
    // Dark/cyberpunk keywords
    if (content.includes('dark') || content.includes('shadow') || content.includes('corp') ||
        content.includes('underground') || content.includes('dystopia') || content.includes('neon') ||
        content.includes('cyber') || content.includes('hacker')) {
      return MusicMood.DARK;
    }
    
    // Mystery keywords
    if (content.includes('mystery') || content.includes('investigate') || content.includes('clue') ||
        content.includes('secret') || content.includes('hidden') || content.includes('discover') ||
        content.includes('unknown') || content.includes('puzzle')) {
      return MusicMood.MYSTERY;
    }
    
    // Chill/peaceful keywords
    if (content.includes('relax') || content.includes('calm') || content.includes('peaceful') ||
        content.includes('rest') || content.includes('safe') || content.includes('comfortable') ||
        content.includes('gentle') || content.includes('quiet')) {
      return MusicMood.CHILL;
    }
    
    // Funky/upbeat keywords
    if (content.includes('party') || content.includes('club') || content.includes('dance') ||
        content.includes('music') || content.includes('fun') || content.includes('celebrate') ||
        content.includes('jazz') || content.includes('vibrant')) {
      return MusicMood.FUNKY;
    }
    
    // Dramatic keywords
    if (content.includes('dramatic') || content.includes('intense') || content.includes('climax') ||
        content.includes('revelation') || content.includes('shocking') || content.includes('important') ||
        content.includes('crucial') || content.includes('epic')) {
      return MusicMood.DRAMATIC;
    }
    
    return MusicMood.NEUTRAL;
  }

  public getCurrentMood(): MusicMood {
    return this.currentMood;
  }

  public isAudioEnabled(): boolean {
    return this.isEnabled;
  }

  // Get available music track names for UI display
  public getMusicTrackNames(): { [key: string]: string } {
    const names: { [key: string]: string } = {};
    Object.entries(this.musicTracks).forEach(([mood, track]) => {
      names[mood] = track.name;
    });
    return names;
  }
}

// Export singleton instance
export const audioService = new AudioService();
