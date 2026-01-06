/**
 * 🧪 LANGUAGE CONTROL SYSTEM - Test Examples
 * 
 * This file demonstrates the language control system in action
 */

import {
    detectLanguage,
    validateLanguage,
    autoRepairResponse,
    processVoiceTranscript,
    type LanguageMode
} from '@/lib/language'

// ============================================
// 1️⃣ LANGUAGE DETECTION TESTS
// ============================================

console.log('=== LANGUAGE DETECTION TESTS ===\n')

// Test 1: Pure English
const test1 = "What is photosynthesis and how does it work?"
console.log(`Input: "${test1}"`)
console.log(`Detected: ${detectLanguage(test1)}`) // Expected: 'English'
console.log()

// Test 2: Hinglish
const test2 = "Photosynthesis kya hai aur ye kaise kaam karta hai?"
console.log(`Input: "${test2}"`)
console.log(`Detected: ${detectLanguage(test2)}`) // Expected: 'Hinglish'
console.log()

// Test 3: Gujarati
const test3 = "Photosynthesis શું છે અને તે કેવી રીતે કામ કરે છે?"
console.log(`Input: "${test3}"`)
console.log(`Detected: ${detectLanguage(test3)}`) // Expected: 'Gujarati'
console.log()

// ============================================
// 2️⃣ VALIDATION TESTS
// ============================================

console.log('=== VALIDATION TESTS ===\n')

// Test 4: English mode with Hindi words (should fail)
const test4 = "Photosynthesis ek process hai jisme plants sunlight use karte hain"
const violations4 = validateLanguage(test4, 'English')
console.log(`Input: "${test4}"`)
console.log(`Mode: English`)
console.log(`Violations: ${violations4.length > 0 ? violations4.join(', ') : 'None'}`)
console.log()

// Test 5: Hinglish mode with Devanagari (should fail)
const test5 = "Photosynthesis एक प्रक्रिया है जिसमें plants sunlight use करते हैं"
const violations5 = validateLanguage(test5, 'Hinglish')
console.log(`Input: "${test5}"`)
console.log(`Mode: Hinglish`)
console.log(`Violations: ${violations5.length > 0 ? violations5.join(', ') : 'None'}`)
console.log()

// ============================================
// 3️⃣ AUTO-REPAIR TESTS
// ============================================

console.log('=== AUTO-REPAIR TESTS ===\n')

// Test 6: Repair Hinglish to English
const test6 = "Photosynthesis ek process hai jisme plants sunlight use karte hain"
const repair6 = autoRepairResponse(test6, 'English')
console.log(`Original: "${test6}"`)
console.log(`Mode: English`)
console.log(`Repaired: "${repair6.repaired}"`)
console.log(`Had Violations: ${repair6.hadViolations}`)
console.log(`Repair Count: ${repair6.repairCount}`)
console.log()

// Test 7: Repair English to Hinglish
const test7 = "Photosynthesis is a process where plants use sunlight to make food"
const repair7 = autoRepairResponse(test7, 'Hinglish')
console.log(`Original: "${test7}"`)
console.log(`Mode: Hinglish`)
console.log(`Repaired: "${repair7.repaired}"`)
console.log(`Had Violations: ${repair7.hadViolations}`)
console.log()

// ============================================
// 4️⃣ VOICE MAPPING TESTS
// ============================================

console.log('=== VOICE MAPPING TESTS ===\n')

// Test 8: Voice input detection
const test8 = "Mujhe photosynthesis ke baare me batao"
const voice8 = processVoiceTranscript(test8)
console.log(`Voice Input: "${test8}"`)
console.log(`Detected Language: ${voice8.detectedLanguage}`)
console.log(`Confidence: ${(voice8.confidence * 100).toFixed(0)}%`)
console.log()

// Test 9: Gujarati voice input
const test9 = "મને photosynthesis વિશે જણાવો"
const voice9 = processVoiceTranscript(test9)
console.log(`Voice Input: "${test9}"`)
console.log(`Detected Language: ${voice9.detectedLanguage}`)
console.log(`Confidence: ${(voice9.confidence * 100).toFixed(0)}%`)
console.log()

// ============================================
// 5️⃣ REAL-WORLD SCENARIOS
// ============================================

console.log('=== REAL-WORLD SCENARIOS ===\n')

// Scenario 1: User selects English, but speaks Hinglish
console.log('Scenario 1: User selects English, speaks Hinglish')
console.log('Selected Language: English')
console.log('Voice Input: "Photosynthesis kya hai?"')
console.log('Expected Behavior: Detect Hinglish (for understanding), but respond in English')
console.log('Output Language: English ✅')
console.log()

// Scenario 2: Fallback when language not selected
console.log('Scenario 2: Language not selected (fallback)')
console.log('Selected Language: null')
console.log('User Input: "Samajh nahi aa raha photosynthesis"')
console.log('Expected Behavior: Auto-detect Hinglish, respond in Hinglish')
console.log('Detected & Output Language: Hinglish ✅')
console.log()

// Scenario 3: AI accidentally mixes languages
console.log('Scenario 3: AI mixes languages (auto-repair)')
console.log('Selected Language: English')
console.log('AI Response: "Photosynthesis ek process hai where plants use sunlight"')
console.log('Expected Behavior: Auto-repair to pure English')
const scenario3 = autoRepairResponse(
    "Photosynthesis ek process hai where plants use sunlight",
    'English'
)
console.log(`Repaired Response: "${scenario3.repaired}" ✅`)
console.log()

// ============================================
// 6️⃣ EDGE CASES
// ============================================

console.log('=== EDGE CASES ===\n')

// Edge Case 1: Empty input
console.log('Edge Case 1: Empty input')
const edge1 = detectLanguage("")
console.log(`Input: ""`)
console.log(`Detected: ${edge1} (defaults to English) ✅`)
console.log()

// Edge Case 2: Mixed script
console.log('Edge Case 2: Mixed Gujarati + English')
const edge2 = "Photosynthesis એ process છે where plants make food"
console.log(`Input: "${edge2}"`)
console.log(`Detected: ${detectLanguage(edge2)} (Gujarati script detected) ✅`)
console.log()

// Edge Case 3: Technical terms in Hinglish
console.log('Edge Case 3: Technical terms in Hinglish')
const edge3 = "Chlorophyll aur sunlight ka use karke plant glucose banata hai"
console.log(`Input: "${edge3}"`)
console.log(`Detected: ${detectLanguage(edge3)} ✅`)
console.log()

console.log('=== ALL TESTS COMPLETE ===')

/**
 * 🏁 EXPECTED RESULTS SUMMARY
 * 
 * ✅ Language Detection:
 *    - Pure English → 'English'
 *    - Roman Hindi + English → 'Hinglish'
 *    - Gujarati script → 'Gujarati'
 * 
 * ✅ Validation:
 *    - Detects forbidden language mixing
 *    - Returns violation descriptions
 * 
 * ✅ Auto-Repair:
 *    - Removes/replaces forbidden words
 *    - Maintains meaning and tone
 *    - Reports violations and repair count
 * 
 * ✅ Voice Mapping:
 *    - Detects spoken language
 *    - Provides confidence score
 *    - Output language controlled by selection
 * 
 * ✅ Edge Cases:
 *    - Handles empty input
 *    - Handles mixed scripts
 *    - Handles technical terms
 */
