/**
 * 🌐 LANGUAGE DETECTION & VALIDATION SYSTEM
 * 
 * Purpose: Detect language from user input text/voice
 * Used for: Fallback when selected_language is missing
 */

export type LanguageMode = 'English' | 'Hinglish' | 'Gujarati'

interface LanguagePattern {
    name: LanguageMode
    patterns: RegExp[]
    scriptCheck?: (text: string) => boolean
    minConfidence: number
}

/**
 * Detect language from input text
 * Returns the most likely language mode
 */
export function detectLanguage(text: string): LanguageMode {
    if (!text || text.trim().length === 0) {
        return 'English' // Default fallback
    }

    const scores: Record<LanguageMode, number> = {
        'English': 0,
        'Hinglish': 0,
        'Gujarati': 0
    }

    // 1️⃣ GUJARATI DETECTION (Highest Priority - Script-based)
    const gujaratiScript = /[\u0A80-\u0AFF]/g // Gujarati Unicode range
    const gujaratiMatches = text.match(gujaratiScript)
    if (gujaratiMatches && gujaratiMatches.length > 5) {
        scores['Gujarati'] += 100 // Very high confidence
    }

    // 2️⃣ HINGLISH DETECTION (Roman Hindi patterns)
    const hinglishPatterns = [
        /\b(hai|hain|ho|tha|thi|the|ka|ki|ke|ko|se|me|pe|par)\b/gi,
        /\b(kya|kaise|kab|kahan|kyun|kaun|kitna)\b/gi,
        /\b(aur|ya|lekin|par|kyunki|agar|to)\b/gi,
        /\b(samajh|bhai|yaar|dekh|sun|bol|kar|le|de)\b/gi,
        /\b(nahi|nahin|mat|mujhe|tumhe|usko|isko)\b/gi,
        /\b(achha|thik|sahi|galat|badiya|mast)\b/gi
    ]

    let hinglishMatchCount = 0
    hinglishPatterns.forEach(pattern => {
        const matches = text.match(pattern)
        if (matches) {
            hinglishMatchCount += matches.length
        }
    })

    if (hinglishMatchCount > 2) {
        scores['Hinglish'] += hinglishMatchCount * 10
    }

    // 3️⃣ ENGLISH DETECTION (Pure English patterns)
    const englishPatterns = [
        /\b(the|is|are|was|were|have|has|had|will|would|should|could)\b/gi,
        /\b(what|when|where|why|how|who|which)\b/gi,
        /\b(and|or|but|because|if|then|so)\b/gi,
        /\b(explain|understand|help|learn|study|teach)\b/gi
    ]

    let englishMatchCount = 0
    englishPatterns.forEach(pattern => {
        const matches = text.match(pattern)
        if (matches) {
            englishMatchCount += matches.length
        }
    })

    // Check if text is predominantly English (no Hindi/Gujarati words)
    const totalWords = text.split(/\s+/).length
    const isPureEnglish = hinglishMatchCount === 0 && gujaratiMatches === null && englishMatchCount > totalWords * 0.3

    if (isPureEnglish) {
        scores['English'] += 50
    } else if (englishMatchCount > 0) {
        scores['English'] += englishMatchCount * 5
    }

    // 4️⃣ DETERMINE WINNER
    const winner = Object.entries(scores).reduce((prev, curr) =>
        curr[1] > prev[1] ? curr : prev
    )[0] as LanguageMode

    // If all scores are very low, default to English
    if (scores[winner] < 10) {
        return 'English'
    }

    return winner
}

/**
 * Validate if text contains forbidden language words
 * Returns array of violations
 */
export function validateLanguage(text: string, selectedLanguage: LanguageMode): string[] {
    const violations: string[] = []

    if (selectedLanguage === 'English') {
        // ❌ NO Hindi words (Roman or Devanagari)
        const hindiPatterns = [
            /\b(hai|hain|ho|tha|thi|the|ka|ki|ke|ko|se|me|pe|par)\b/gi,
            /\b(kya|kaise|kab|kahan|kyun|kaun|kitna)\b/gi,
            /\b(samajh|bhai|yaar|dekh|sun|bol|kar|le|de)\b/gi,
            /[\u0900-\u097F]/g // Devanagari script
        ]

        hindiPatterns.forEach(pattern => {
            if (pattern.test(text)) {
                violations.push('Contains Hindi words (forbidden in English mode)')
            }
        })

        // ❌ NO Gujarati script
        if (/[\u0A80-\u0AFF]/g.test(text)) {
            violations.push('Contains Gujarati script (forbidden in English mode)')
        }
    }

    if (selectedLanguage === 'Hinglish') {
        // ❌ NO Devanagari script
        if (/[\u0900-\u097F]/g.test(text)) {
            violations.push('Contains Devanagari script (forbidden in Hinglish mode - use Roman Hindi only)')
        }

        // ❌ NO Gujarati script
        if (/[\u0A80-\u0AFF]/g.test(text)) {
            violations.push('Contains Gujarati script (forbidden in Hinglish mode)')
        }

        // ❌ NO fully English paragraphs (check for long English-only sentences)
        const sentences = text.split(/[.!?]+/)
        sentences.forEach(sentence => {
            const words = sentence.trim().split(/\s+/)
            if (words.length > 10) {
                const hindiWordCount = (sentence.match(/\b(hai|hain|ho|ka|ki|ke|ko|se|me|pe|par|kya|kaise|samajh|bhai|yaar|dekh|sun|bol|kar|le|de|nahi|mujhe|tumhe|aur|ya|lekin)\b/gi) || []).length
                if (hindiWordCount === 0 && words.length > 15) {
                    violations.push('Contains fully English paragraph (forbidden in Hinglish mode - mix Hindi and English)')
                }
            }
        })
    }

    if (selectedLanguage === 'Gujarati') {
        // ❌ NO Hindi (Devanagari or Roman)
        if (/[\u0900-\u097F]/g.test(text)) {
            violations.push('Contains Devanagari/Hindi script (forbidden in Gujarati mode)')
        }

        const hindiPatterns = [
            /\b(hai|hain|ho|tha|thi|the|ka|ki|ke|ko|se|me|pe|par)\b/gi,
            /\b(kya|kaise|kab|kahan|kyun|kaun|kitna)\b/gi,
            /\b(samajh|bhai|yaar|dekh|sun|bol|kar|le|de)\b/gi
        ]

        hindiPatterns.forEach(pattern => {
            if (pattern.test(text)) {
                violations.push('Contains Roman Hindi words (forbidden in Gujarati mode)')
            }
        })
    }

    return violations
}

/**
 * Check if language mode is valid
 */
export function isValidLanguageMode(mode: any): mode is LanguageMode {
    return mode === 'English' || mode === 'Hinglish' || mode === 'Gujarati'
}

/**
 * Get fallback language when selected_language is missing
 */
export function getFallbackLanguage(userInput?: string): LanguageMode {
    if (userInput && userInput.trim().length > 0) {
        return detectLanguage(userInput)
    }
    return 'English' // Ultimate fallback
}
