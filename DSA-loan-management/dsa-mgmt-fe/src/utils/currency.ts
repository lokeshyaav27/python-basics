/**
 * Indian Currency Number Formatting and In-Words Conversion Utilities
 */

const ONES = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen',
]

const TENS = [
  '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety',
]

function convertBelowThousand(num: number): string {
  if (num === 0) return ''
  if (num < 20) return ONES[num] + ' '
  if (num < 100) return TENS[Math.floor(num / 10)] + (num % 10 !== 0 ? ' ' + ONES[num % 10] : '') + ' '
  return ONES[Math.floor(num / 100)] + ' Hundred ' + convertBelowThousand(num % 100)
}

/**
 * Converts a number to full Indian English words.
 * E.g., 500000 -> "Five Lakh Rupees"
 *       1250005 -> "Twelve Lakh Fifty Thousand Five Rupees"
 *       15000000 -> "One Crore Fifty Lakh Rupees"
 */
export function numberToFullIndianWords(val: number | string | null | undefined): string {
  if (val === null || val === undefined || val === '') return ''
  const num = typeof val === 'string' ? parseInt(val.replace(/,/g, ''), 10) : Math.floor(val)
  if (isNaN(num) || num <= 0) return ''

  if (num === 0) return 'Zero Rupees'

  const crore = Math.floor(num / 10000000)
  const lakh = Math.floor((num % 10000000) / 100000)
  const thousand = Math.floor((num % 100000) / 1000)
  const remainder = num % 1000

  let words = ''
  if (crore > 0) {
    words += convertBelowThousand(crore).trim() + ' Crore '
  }
  if (lakh > 0) {
    words += convertBelowThousand(lakh).trim() + ' Lakh '
  }
  if (thousand > 0) {
    words += convertBelowThousand(thousand).trim() + ' Thousand '
  }
  if (remainder > 0) {
    words += convertBelowThousand(remainder).trim() + ' '
  }

  return words.trim() + ' Rupees'
}

/**
 * Converts a number to short Indian denomination format.
 * E.g., 500000 -> "₹ 5 Lakh"
 *       1250005 -> "₹ 12.50 Lakh"
 *       15000000 -> "₹ 1.50 Crore"
 *       50000 -> "₹ 50 Thousand"
 */
export function numberToShortIndianWords(val: number | string | null | undefined): string {
  if (val === null || val === undefined || val === '') return ''
  const num = typeof val === 'string' ? parseFloat(val.replace(/,/g, '')) : val
  if (isNaN(num) || num <= 0) return ''

  if (num >= 10000000) {
    const cr = num / 10000000
    return `₹ ${cr % 1 === 0 ? cr : cr.toFixed(2)} Crore`
  }
  if (num >= 100000) {
    const lk = num / 100000
    return `₹ ${lk % 1 === 0 ? lk : lk.toFixed(2)} Lakh`
  }
  if (num >= 1000) {
    const th = num / 1000
    return `₹ ${th % 1 === 0 ? th : th.toFixed(1)} Thousand`
  }
  return `₹ ${num.toLocaleString('en-IN')}`
}

/**
 * Returns formatted Indian currency with commas (e.g. 500000 -> "5,00,000")
 */
export function formatIndianCurrency(val: number | string | null | undefined): string {
  if (val === null || val === undefined || val === '') return ''
  const cleanDigits = String(val).replace(/[^\d]/g, '')
  if (!cleanDigits) return ''

  const num = parseInt(cleanDigits, 10)
  if (isNaN(num)) return ''
  return num.toLocaleString('en-IN')
}

/**
 * Strips all non-digit characters from formatted currency string.
 */
export function parseRawDigits(val: string): string {
  return val.replace(/[^\d]/g, '')
}
