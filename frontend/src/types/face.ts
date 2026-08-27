/**
 * Result of a face-recognition scan as consumed by the patient UI.
 * The AI engine's full contract is finalized in Phase 4; this is the shape
 * the interface renders today.
 */
export interface FaceScanResult {
  name: string;
  relationship: string;
  confidence: string;
  last_interaction: string;
}
