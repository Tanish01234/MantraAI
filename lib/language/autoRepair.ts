/**
 * 🧠 AUTO-REPAIR RESPONSE SYSTEM
 * 
 * Purpose: Automatically fix language violations before sending to user
 * Ensures responses strictly follow selected language mode
 */

import { LanguageMode, validateLanguage } from './detector'

interface RepairResult {
    repaired: string
    hadViolations: boolean
    violations: string[]
    repairCount: number
}

/**
 * Auto-repair response to match selected language
 * This runs BEFORE sending response to user
 */
export function autoRepairResponse(
    response: string,
    selectedLanguage: LanguageMode
): RepairResult {
    const violations = validateLanguage(response, selectedLanguage)

    if (violations.length === 0) {
        return {
            repaired: response,
            hadViolations: false,
            violations: [],
            repairCount: 0
        }
    }

    // Violations found - repair the response
    let repaired = response
    let repairCount = 0

    if (selectedLanguage === 'English') {
        // Remove Hindi words and replace with English equivalents
        const hindiToEnglish: Record<string, string> = {
            'hai': 'is',
            'hain': 'are',
            'ho': 'are',
            'tha': 'was',
            'thi': 'was',
            'the': 'were',
            'ka': 'of',
            'ki': 'of',
            'ke': 'of',
            'ko': 'to',
            'se': 'from',
            'me': 'in',
            'pe': 'on',
            'par': 'but',
            'kya': 'what',
            'kaise': 'how',
            'kab': 'when',
            'kahan': 'where',
            'kyun': 'why',
            'kaun': 'who',
            'kitna': 'how much',
            'aur': 'and',
            'ya': 'or',
            'lekin': 'but',
            'kyunki': 'because',
            'agar': 'if',
            'to': 'then',
            'samajh': 'understand',
            'bhai': 'friend',
            'yaar': 'friend',
            'dekh': 'see',
            'sun': 'listen',
            'bol': 'say',
            'kar': 'do',
            'le': 'take',
            'de': 'give',
            'nahi': 'no',
            'nahin': 'not',
            'mat': 'don\'t',
            'mujhe': 'me',
            'tumhe': 'you',
            'usko': 'him/her',
            'isko': 'this',
            'achha': 'good',
            'thik': 'okay',
            'sahi': 'correct',
            'galat': 'wrong',
            'badiya': 'great',
            'mast': 'awesome'
        }

        Object.entries(hindiToEnglish).forEach(([hindi, english]) => {
            const regex = new RegExp(`\\b${hindi}\\b`, 'gi')
            if (regex.test(repaired)) {
                repaired = repaired.replace(regex, english)
                repairCount++
            }
        })

        // Remove Devanagari script
        if (/[\u0900-\u097F]/g.test(repaired)) {
            repaired = repaired.replace(/[\u0900-\u097F]/g, '')
            repairCount++
        }

        // Remove Gujarati script
        if (/[\u0A80-\u0AFF]/g.test(repaired)) {
            repaired = repaired.replace(/[\u0A80-\u0AFF]/g, '')
            repairCount++
        }
    }

    if (selectedLanguage === 'Hinglish') {
        // Remove Devanagari script (convert to Roman if possible)
        if (/[\u0900-\u097F]/g.test(repaired)) {
            repaired = repaired.replace(/[\u0900-\u097F]/g, '')
            repairCount++
        }

        // Remove Gujarati script
        if (/[\u0A80-\u0AFF]/g.test(repaired)) {
            repaired = repaired.replace(/[\u0A80-\u0AFF]/g, '')
            repairCount++
        }

        // Convert pure English sentences to Hinglish
        // This is a simplified approach - in production, use LLM for better conversion
        const sentences = repaired.split(/([.!?]+)/)
        const repairedSentences = sentences.map(sentence => {
            if (sentence.match(/[.!?]+/)) return sentence // Keep punctuation

            const words = sentence.trim().split(/\s+/)
            if (words.length > 15) {
                const hindiWordCount = (sentence.match(/\b(hai|hain|ho|ka|ki|ke|ko|se|me|pe|par|kya|kaise|samajh|bhai|yaar|dekh|sun|bol|kar|le|de|nahi|mujhe|tumhe|aur|ya|lekin)\b/gi) || []).length

                if (hindiWordCount === 0) {
                    // Add some Hinglish flavor
                    repairCount++
                    return sentence
                        .replace(/\bunderstand\b/gi, 'samajh')
                        .replace(/\bfriend\b/gi, 'yaar')
                        .replace(/\bis\b/gi, 'hai')
                        .replace(/\bare\b/gi, 'hain')
                        .replace(/\band\b/gi, 'aur')
                        .replace(/\bor\b/gi, 'ya')
                        .replace(/\bbut\b/gi, 'lekin')
                }
            }
            return sentence
        })
        repaired = repairedSentences.join('')
    }

    if (selectedLanguage === 'Gujarati') {
        // Remove Hindi (Devanagari)
        if (/[\u0900-\u097F]/g.test(repaired)) {
            repaired = repaired.replace(/[\u0900-\u097F]/g, '')
            repairCount++
        }

        // Remove Roman Hindi words
        const hindiWords = [
            'hai', 'hain', 'ho', 'tha', 'thi', 'the', 'ka', 'ki', 'ke', 'ko', 'se', 'me', 'pe', 'par',
            'kya', 'kaise', 'kab', 'kahan', 'kyun', 'kaun', 'kitna',
            'samajh', 'bhai', 'yaar', 'dekh', 'sun', 'bol', 'kar', 'le', 'de'
        ]

        hindiWords.forEach(word => {
            const regex = new RegExp(`\\b${word}\\b`, 'gi')
            if (regex.test(repaired)) {
                repaired = repaired.replace(regex, '')
                repairCount++
            }
        })
    }

    // Clean up extra spaces
    repaired = repaired.replace(/\s+/g, ' ').trim()

    return {
        repaired,
        hadViolations: true,
        violations,
        repairCount
    }
}

/**
 * Internal validation checklist (runs before sending response)
 * Returns true if response is clean, false if violations found
 */
export function validateBeforeSend(
    response: string,
    selectedLanguage: LanguageMode
): boolean {
    const violations = validateLanguage(response, selectedLanguage)
    return violations.length === 0
}
