/**
 * 🌐 LANGUAGE CONTROL SYSTEM - Main Export
 * 
 * Complete multilingual system with:
 * ✅ Language detection & fallback
 * ✅ Auto-repair & validation
 * ✅ Voice input mapping
 * ✅ Production-ready enforcement
 */

// Context & Hooks
export { LanguageProvider, useLanguage } from './LanguageContext'

// Detection & Validation
export {
    detectLanguage,
    validateLanguage,
    isValidLanguageMode,
    getFallbackLanguage,
    type LanguageMode
} from './detector'

// Auto-Repair
export {
    autoRepairResponse,
    validateBeforeSend
} from './autoRepair'

// Voice Mapping
export {
    processVoiceTranscript,
    getVoiceOutputLanguage,
    VOICE_RULES,
    type VoiceTranscript
} from './voiceMapping'
