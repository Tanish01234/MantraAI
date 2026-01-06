/**
 * 🌐 LANGUAGE CONTROL CONTEXT
 * 
 * Purpose: Centralized language management with fallback, auto-repair, and voice mapping
 * This is the main interface for the entire language control system
 */

'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { LanguageMode, detectLanguage, isValidLanguageMode, getFallbackLanguage, validateLanguage } from './detector'
import { autoRepairResponse, validateBeforeSend } from './autoRepair'
import { processVoiceTranscript, getVoiceOutputLanguage, VOICE_RULES } from './voiceMapping'

interface LanguageContextType {
    // Current selected language
    selectedLanguage: LanguageMode

    // Set language (with validation)
    setLanguage: (language: LanguageMode) => void

    // Fallback detection active
    isFallbackActive: boolean

    // Process voice input
    handleVoiceInput: (transcript: string) => {
        text: string
        detectedLanguage: LanguageMode
        outputLanguage: LanguageMode
    }

    // Validate and repair response before sending
    prepareResponse: (response: string) => {
        finalResponse: string
        hadViolations: boolean
        violations: string[]
    }

    // Manual validation
    validateResponse: (response: string) => string[]
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [selectedLanguage, setSelectedLanguageState] = useState<LanguageMode>('English')
    const [isFallbackActive, setIsFallbackActive] = useState(false)

    // Load saved language preference
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('mentraai_language')
            if (saved && isValidLanguageMode(saved)) {
                setSelectedLanguageState(saved as LanguageMode)
                setIsFallbackActive(false)
            } else {
                // No saved preference - activate fallback
                setIsFallbackActive(true)
            }
        }
    }, [])

    // Set language with validation and persistence
    const setLanguage = useCallback((language: LanguageMode) => {
        if (!isValidLanguageMode(language)) {
            console.error(`Invalid language mode: ${language}`)
            return
        }

        setSelectedLanguageState(language)
        setIsFallbackActive(false)

        if (typeof window !== 'undefined') {
            localStorage.setItem('mentraai_language', language)
        }
    }, [])

    // Handle voice input
    const handleVoiceInput = useCallback((transcript: string) => {
        const voiceData = processVoiceTranscript(transcript)

        // Determine output language
        const outputLanguage = getVoiceOutputLanguage(
            voiceData,
            isFallbackActive ? null : selectedLanguage
        )

        // If fallback was active and we detected language, set it
        if (isFallbackActive && voiceData.confidence > 0.7) {
            setLanguage(voiceData.detectedLanguage)
        }

        return {
            text: voiceData.text,
            detectedLanguage: voiceData.detectedLanguage,
            outputLanguage
        }
    }, [selectedLanguage, isFallbackActive, setLanguage])

    // Prepare response with auto-repair
    const prepareResponse = useCallback((response: string) => {
        // Determine which language to use
        let targetLanguage = selectedLanguage

        // If fallback is active, try to detect from response
        if (isFallbackActive) {
            targetLanguage = getFallbackLanguage(response)
            setLanguage(targetLanguage)
        }

        // Auto-repair the response
        const repairResult = autoRepairResponse(response, targetLanguage)

        return {
            finalResponse: repairResult.repaired,
            hadViolations: repairResult.hadViolations,
            violations: repairResult.violations
        }
    }, [selectedLanguage, isFallbackActive, setLanguage])

    // Manual validation
    const validateResponse = useCallback((response: string) => {
        return validateLanguage(response, selectedLanguage)
    }, [selectedLanguage])

    return (
        <LanguageContext.Provider value={{
            selectedLanguage,
            setLanguage,
            isFallbackActive,
            handleVoiceInput,
            prepareResponse,
            validateResponse
        }}>
            {children}
        </LanguageContext.Provider>
    )
}

export function useLanguage() {
    const context = useContext(LanguageContext)
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider')
    }
    return context
}

/**
 * 🏁 USAGE EXAMPLES
 * 
 * 1️⃣ Basic Language Selection:
 * ```tsx
 * const { selectedLanguage, setLanguage } = useLanguage()
 * setLanguage('Hinglish')
 * ```
 * 
 * 2️⃣ Voice Input Handling:
 * ```tsx
 * const { handleVoiceInput } = useLanguage()
 * const result = handleVoiceInput("Photosynthesis kya hai?")
 * // result.detectedLanguage = 'Hinglish'
 * // result.outputLanguage = 'English' (if English is selected)
 * ```
 * 
 * 3️⃣ Response Validation & Auto-Repair:
 * ```tsx
 * const { prepareResponse } = useLanguage()
 * const { finalResponse, hadViolations } = prepareResponse(aiResponse)
 * // finalResponse is guaranteed to match selected language
 * ```
 * 
 * 4️⃣ Fallback Detection:
 * ```tsx
 * const { isFallbackActive } = useLanguage()
 * if (isFallbackActive) {
 *   // Language will be auto-detected from user input
 * }
 * ```
 */
