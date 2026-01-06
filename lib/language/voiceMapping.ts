/**
 * 🎤 VOICE → LANGUAGE MAPPING SYSTEM
 * 
 * Purpose: Handle voice input and map to correct output language
 * Rule: Voice language ≠ Output language
 */

import { LanguageMode, detectLanguage } from './detector'

export interface VoiceTranscript {
    text: string
    detectedLanguage: LanguageMode
    confidence: number
}

/**
 * Process voice transcript and detect spoken language
 * Returns transcript with detected language
 */
export function processVoiceTranscript(transcript: string): VoiceTranscript {
    const detectedLanguage = detectLanguage(transcript)

    // Calculate confidence based on pattern matches
    let confidence = 0.5 // Base confidence

    if (detectedLanguage === 'Gujarati') {
        const gujaratiMatches = transcript.match(/[\u0A80-\u0AFF]/g)
        if (gujaratiMatches && gujaratiMatches.length > 10) {
            confidence = 0.95
        } else if (gujaratiMatches && gujaratiMatches.length > 5) {
            confidence = 0.8
        }
    } else if (detectedLanguage === 'Hinglish') {
        const hindiPatterns = /\b(hai|hain|ho|ka|ki|ke|ko|se|me|pe|par|kya|kaise|samajh|bhai|yaar|dekh|sun|bol|kar|le|de)\b/gi
        const matches = transcript.match(hindiPatterns)
        if (matches && matches.length > 5) {
            confidence = 0.9
        } else if (matches && matches.length > 2) {
            confidence = 0.75
        }
    } else if (detectedLanguage === 'English') {
        const englishPatterns = /\b(the|is|are|was|were|have|has|had|will|would|should|could|what|when|where|why|how)\b/gi
        const matches = transcript.match(englishPatterns)
        if (matches && matches.length > 5) {
            confidence = 0.85
        } else if (matches && matches.length > 2) {
            confidence = 0.7
        }
    }

    return {
        text: transcript,
        detectedLanguage,
        confidence
    }
}

/**
 * Get output language for voice input
 * IMPORTANT: Output language is ALWAYS controlled by user selection
 * Voice language is ONLY for understanding, NOT for output
 */
export function getVoiceOutputLanguage(
    voiceTranscript: VoiceTranscript,
    selectedLanguage: LanguageMode | null
): LanguageMode {
    // Rule: selected_language takes absolute priority
    if (selectedLanguage) {
        return selectedLanguage
    }

    // Fallback: Use detected language from voice
    return voiceTranscript.detectedLanguage
}

/**
 * Voice input handling rules
 */
export interface VoiceHandlingRules {
    // Convert voice → text
    transcribe: boolean

    // Detect spoken language (for understanding only)
    detectLanguage: boolean

    // IGNORE spoken language for output
    ignoreForOutput: boolean

    // Respond strictly in selected_language
    useSelectedLanguage: boolean
}

export const VOICE_RULES: VoiceHandlingRules = {
    transcribe: true,
    detectLanguage: true,
    ignoreForOutput: true,
    useSelectedLanguage: true
}

/**
 * Example usage:
 * 
 * Selected language: English
 * Voice input: "Photosynthesis kya hai?" (Hinglish)
 * → Detected language: Hinglish (for understanding)
 * → Response language: English (from selection)
 * → Response: "Photosynthesis is the process by which plants make their food using sunlight."
 */
