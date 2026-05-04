const BLOCKED_WORDS = ['slur1', 'slur2', 'kill yourself', 'buy followers', 'scam now']

export function evaluateModerationText(input = '') {
  const text = String(input || '').trim().toLowerCase()
  if (!text) return { safe: false, reason: 'Caption is empty.' }
  if (text.length < 4) return { safe: false, reason: 'Caption is too short.' }

  const blockedWord = BLOCKED_WORDS.find((word) => text.includes(word))
  if (blockedWord) return { safe: false, reason: 'Blocked language detected.' }

  if (/(.)\1{7,}/.test(text)) {
    return { safe: false, reason: 'Spammy repeated characters detected.' }
  }

  if (/https?:\/\/(bit\.ly|tinyurl|t\.co|rb\.gy|shorturl)/.test(text)) {
    return { safe: false, reason: 'Suspicious shortened link detected.' }
  }

  const hashtags = (text.match(/#/g) || []).length
  if (hashtags > 10) return { safe: false, reason: 'Too many hashtags.' }

  return { safe: true, reason: null }
}
