import { create } from 'zustand'

interface CropResult {
    recommended_crop: string
    confidence: number
}

interface SuitabilityTableRow {
    parameter: string
    recommended: number
    observed: number
    status: string
}

interface SuitabilityResult {
    crop: string
    suitability_score: number
    table: SuitabilityTableRow[]
}

interface FertilizerResult {
    fertilizer: string
    composition: string
    application: string
    nitrogen_advice?: string
    phosphorus_advice?: string
    potassium_advice?: string
}

export type PredictResult = CropResult | SuitabilityResult | FertilizerResult | null

export type PredictionMode = 'crop' | 'suitability' | 'fertilizer'

interface PredictionState {
    result: PredictResult
    mode: PredictionMode
    source: 'sensor' | 'manual'
    
    setResult: (result: PredictResult, mode: PredictionMode, source: 'sensor' | 'manual') => void
    clearResult: () => void
}

export const usePredictionStore = create<PredictionState>((set) => ({
    result: null,
    mode: 'crop',
    source: 'sensor',
    
    setResult: (result, mode, source) => set({ result, mode, source }),
    clearResult: () => set({ result: null }),
}))
