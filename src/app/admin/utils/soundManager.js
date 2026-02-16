/**
 * Sound Manager - Handles notification sounds for the admin panel
 * Supports both audio files and Web Audio API generation
 */

class SoundManager {
  constructor() {
    this.audioContext = null;
    this.isMuted = localStorage.getItem('appointmentNotificationMuted') === 'true';
  }

  /**
   * Initialize audio context on user interaction
   */
  initializeAudioContext() {
    if (!this.audioContext) {
      try {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      } catch (error) {
        console.log('Audio context not supported:', error);
      }
    }
  }

  /**
   * Toggle notification sound mute status
   */
  toggleMute() {
    this.isMuted = !this.isMuted;
    localStorage.setItem('appointmentNotificationMuted', this.isMuted);
    return this.isMuted;
  }

  /**
   * Check if notifications are muted
   */
  isSoundMuted() {
    return this.isMuted;
  }

  /**
   * Play appointment notification sound
   */
  playAppointmentSound() {
    if (this.isMuted) return;

    try {
      // Try to use audio file first
      const notificationAudio = new Audio('/sounds/notification.mp3');
      notificationAudio.volume = 0.7;

      notificationAudio.play().catch((error) => {
        console.log('Audio file not available, using Web Audio API');
        this.playWebAudioNotification('appointment');
      });
    } catch (error) {
      console.log('Audio element not available, using Web Audio API:', error);
      this.playWebAudioNotification('appointment');
    }
  }

  /**
   * Play success sound
   */
  playSuccessSound() {
    if (this.isMuted) return;

    try {
      const successAudio = new Audio('/sounds/success.mp3');
      successAudio.volume = 0.6;

      successAudio.play().catch(() => {
        this.playWebAudioNotification('success');
      });
    } catch (error) {
      this.playWebAudioNotification('success');
    }
  }

  /**
   * Play error sound
   */
  playErrorSound() {
    if (this.isMuted) return;

    try {
      const errorAudio = new Audio('/sounds/error.mp3');
      errorAudio.volume = 0.6;

      errorAudio.play().catch(() => {
        this.playWebAudioNotification('error');
      });
    } catch (error) {
      this.playWebAudioNotification('error');
    }
  }

  /**
   * Web Audio API sound generation with different types
   */
  playWebAudioNotification(type = 'appointment') {
    try {
      this.initializeAudioContext();

      if (!this.audioContext) {
        console.log('Audio context not available');
        return;
      }

      const now = this.audioContext.currentTime;

      switch (type) {
        case 'appointment':
          this.playAppointmentTone(now);
          break;
        case 'success':
          this.playSuccessTone(now);
          break;
        case 'error':
          this.playErrorTone(now);
          break;
        default:
          this.playAppointmentTone(now);
      }
    } catch (error) {
      console.log('Could not play Web Audio notification:', error);
    }
  }

  /**
   * Pleasant two-tone notification sound for appointments
   */
  playAppointmentTone(now) {
    // First tone
    const osc1 = this.audioContext.createOscillator();
    const gain1 = this.audioContext.createGain();
    osc1.connect(gain1);
    gain1.connect(this.audioContext.destination);

    osc1.frequency.value = 850;
    osc1.type = 'sine';
    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.1, now + 0.15);
    gain1.gain.setValueAtTime(0.1, now + 0.15);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    osc1.start(now);
    osc1.stop(now + 0.3);

    // Second tone (higher pitch)
    const osc2 = this.audioContext.createOscillator();
    const gain2 = this.audioContext.createGain();
    osc2.connect(gain2);
    gain2.connect(this.audioContext.destination);

    osc2.frequency.value = 1100;
    osc2.type = 'sine';
    gain2.gain.setValueAtTime(0, now + 0.3);
    gain2.gain.exponentialRampToValueAtTime(0.3, now + 0.35);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

    osc2.start(now + 0.3);
    osc2.stop(now + 0.6);
  }

  /**
   * Upward three-tone success sound
   */
  playSuccessTone(now) {
    const frequencies = [600, 800, 1000];
    const duration = 0.15;

    frequencies.forEach((freq, index) => {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();

      osc.connect(gain);
      gain.connect(this.audioContext.destination);

      osc.frequency.value = freq;
      osc.type = 'sine';

      const startTime = now + index * duration;
      gain.gain.setValueAtTime(0.2, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

      osc.start(startTime);
      osc.stop(startTime + duration);
    });
  }

  /**
   * Downward two-tone error sound
   */
  playErrorTone(now) {
    // First tone (higher)
    const osc1 = this.audioContext.createOscillator();
    const gain1 = this.audioContext.createGain();
    osc1.connect(gain1);
    gain1.connect(this.audioContext.destination);

    osc1.frequency.value = 900;
    osc1.type = 'sine';
    gain1.gain.setValueAtTime(0.2, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    osc1.start(now);
    osc1.stop(now + 0.2);

    // Second tone (lower)
    const osc2 = this.audioContext.createOscillator();
    const gain2 = this.audioContext.createGain();
    osc2.connect(gain2);
    gain2.connect(this.audioContext.destination);

    osc2.frequency.value = 600;
    osc2.type = 'sine';
    gain2.gain.setValueAtTime(0, now + 0.2);
    gain2.gain.exponentialRampToValueAtTime(0.2, now + 0.25);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

    osc2.start(now + 0.2);
    osc2.stop(now + 0.45);
  }
}

// Export singleton instance
export const soundManager = new SoundManager();
