type BuildSubscriptionPlanCodeInput = {
  name?: string | null
  targetName?: string | null
  speed?: string | null
  price?: string | number | null
}

const GENERIC_NAME_TOKENS = new Set([
  'AN',
  'AND',
  'THE',
  'PLAN',
  'PACKAGE',
  'PROMO',
])

const toTokens = (value: string | null | undefined) =>
  (value ?? '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)

const toSegment = (token: string, maxLength: number) => token.slice(0, maxLength)

const dedupeSegments = (segments: string[]) => {
  const seen = new Set<string>()

  return segments.filter((segment) => {
    if (!segment || seen.has(segment)) return false

    seen.add(segment)
    return true
  })
}

const extractSpeedSegment = (speed: string | null | undefined, nameTokens: string[]) => {
  const speedMatch = (speed ?? '').match(/\d+/)

  if (speedMatch) return speedMatch[0]

  return nameTokens.find((token) => /^\d+$/.test(token)) ?? ''
}

const extractPriceSegment = (price: string | number | null | undefined) => {
  const numericPrice =
    typeof price === 'number'
      ? price
      : Number(String(price ?? '').replace(/[^0-9.]+/g, ''))

  if (!Number.isFinite(numericPrice) || numericPrice <= 0) return ''

  return String(Math.round(numericPrice))
}

export function buildSubscriptionPlanCode({
  name,
  targetName,
  speed,
  price,
}: BuildSubscriptionPlanCodeInput) {
  const targetTokens = toTokens(targetName)
  const nameTokens = toTokens(name)
  const filteredNameTokens = nameTokens.filter(
    (token) => !GENERIC_NAME_TOKENS.has(token) && !targetTokens.includes(token),
  )

  const prefix = targetTokens.map((token) => toSegment(token, 3)).join('').slice(0, 6)
  const labelSegments = filteredNameTokens
    .filter((token) => !/^\d+$/.test(token))
    .slice(0, 2)
    .map((token) => toSegment(token, 4))
  const speedSegment = extractSpeedSegment(speed, nameTokens)
  const priceSegment = extractPriceSegment(price)
  const segments = dedupeSegments([prefix, ...labelSegments, speedSegment, priceSegment])

  return segments.join('-').slice(0, 48)
}
