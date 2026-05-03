/**
 * Parses a VTT file content into an array of cues.
 * @param {string} vttText
 * @returns {Array<{start: number, end: number, text: string}>}
 */
export function parseVTT(vttText) {
  const cues = []
  const lines = vttText.split(/\r?\n/)
  let currentCue = null

  const timeRegex = /([\d:.]+)\s*-->\s*([\d:.]+)/

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line || line === 'WEBVTT') continue

    const match = timeRegex.exec(line)
    if (match) {
      if (currentCue) cues.push(currentCue)
      currentCue = {
        start: parseVTTTime(match[1]),
        end: parseVTTTime(match[2]),
        text: '',
      }
    } else if (currentCue) {
      // Basic sanitization: remove HTML tags from VTT text to prevent XSS
      const sanitizedLine = line.replace(/<\/?[^>]+(>|$)/g, "")
      currentCue.text += (currentCue.text ? '\n' : '') + sanitizedLine
    }
  }
  if (currentCue) cues.push(currentCue)
  return cues
}

/**
 * Parses a VTT timestamp (HH:MM:SS.mmm or MM:SS.mmm) into seconds.
 * @param {string} timeStr
 * @returns {number}
 */
function parseVTTTime(timeStr) {
  const parts = timeStr.split(':')
  let seconds = 0
  if (parts.length === 3) {
    seconds += parseInt(parts[0], 10) * 3600
    seconds += parseInt(parts[1], 10) * 60
    seconds += parseFloat(parts[2])
  } else {
    seconds += parseInt(parts[0], 10) * 60
    seconds += parseFloat(parts[1])
  }
  return seconds
}

/**
 * Applies Bionic Reading formatting to text.
 * Bolds the first 1-3 characters of each word based on word length.
 * @param {string} text
 * @returns {string} HTML string with <b> tags
 */
export function formatBionic(text) {
  if (!text) return ''
  return text.split(/\s+/).map(word => {
    if (!word) return ''
    const cleanWord = word.replace(/[^\w]/g, '')
    if (cleanWord.length === 0) return word

    let boldLength = 1
    if (cleanWord.length > 3) boldLength = 2
    if (cleanWord.length > 5) boldLength = 3

    // Adjust boldLength if the word starts with non-alphanumeric chars
    const prefixMatch = word.match(/^[^\w]+/)
    const prefixOffset = prefixMatch ? prefixMatch[0].length : 0

    const actualBoldLength = prefixOffset + boldLength

    return `<b>${word.slice(0, actualBoldLength)}</b>${word.slice(actualBoldLength)}`
  }).join(' ')
}
