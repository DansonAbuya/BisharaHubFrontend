/**
 * Tier-specific onboarding and verification requirements.
 * Backend document types: national_id, passport, business_registration, location_details, kra_pin_certificate, compliance_documentation, other.
 */

export const TIER_IDS = ['tier1', 'tier2', 'tier3'] as const
export type TierId = (typeof TIER_IDS)[number]

export const TIER_LABELS: Record<TierId, string> = {
  tier1: 'Informal (Tier 1)',
  tier2: 'Registered SME (Tier 2)',
  tier3: 'Corporate (Tier 3)',
}

export const DOC_TYPE_IDS = [
  'national_id',
  'passport',
  'business_registration',
  'location_details',
  'kra_pin_certificate',
  'compliance_documentation',
  'other',
] as const
export type DocumentTypeId = (typeof DOC_TYPE_IDS)[number]

export const DOC_TYPE_LABELS: Record<DocumentTypeId, string> = {
  national_id: 'National ID',
  passport: 'Passport',
  business_registration: 'Business registration certificate',
  location_details: 'Location / address details',
  kra_pin_certificate: 'KRA PIN certificate',
  compliance_documentation: 'Compliance documentation',
  other: 'Other document',
}

/** Required document types per tier. Owner must upload at least these to be eligible for that tier. */
export const REQUIRED_DOCS_BY_TIER: Record<TierId, DocumentTypeId[]> = {
  /** Tier 1: Informal — ID (or passport), phone/email are account data. */
  tier1: ['national_id'], // at least one of national_id or passport accepted
  /** Tier 2: Registered SME — business reg + location. */
  tier2: ['business_registration', 'location_details'],
  /** Tier 3: Corporate — KRA PIN + compliance. */
  tier3: ['kra_pin_certificate', 'compliance_documentation'],
}

/** For Tier 1 we accept either national_id OR passport. */
export const TIER1_ACCEPTED_DOCS: DocumentTypeId[] = ['national_id', 'passport']

/** Human-readable requirement summary per tier (for UI). */
export const TIER_REQUIREMENTS_SUMMARY: Record<TierId, string> = {
  tier1: 'National ID or Passport. Phone and email are from your account.',
  tier2: 'Business registration certificate and location/address details.',
  tier3: 'KRA PIN certificate and compliance documentation.',
}

/** Check if uploaded document types satisfy the required set for a tier. */
export function hasRequiredDocsForTier(
  uploadedTypes: string[],
  tier: TierId
): { satisfied: boolean; missing: string[] } {
  const required = REQUIRED_DOCS_BY_TIER[tier]
  if (tier === 'tier1') {
    const hasId = uploadedTypes.some((t) => TIER1_ACCEPTED_DOCS.includes(t as DocumentTypeId))
    return { satisfied: hasId, missing: hasId ? [] : ['National ID or Passport'] }
  }
  const set = new Set(uploadedTypes)
  const missing = required.filter((r) => !set.has(r)).map((r) => DOC_TYPE_LABELS[r])
  return { satisfied: missing.length === 0, missing }
}
