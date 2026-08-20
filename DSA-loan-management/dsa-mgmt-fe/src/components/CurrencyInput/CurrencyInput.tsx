import React, { useMemo } from 'react'
import {
  formatIndianCurrency,
  numberToFullIndianWords,
  numberToShortIndianWords,
  parseRawDigits,
} from '../../utils/currency'

export interface CurrencyInputProps {
  label?: string
  required?: boolean
  value: string | number | null | undefined
  onChange: (rawValue: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  inputClassName?: string
  showWords?: boolean
  error?: string
  min?: number
  max?: number
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  label,
  required = false,
  value,
  onChange,
  placeholder = 'e.g. 50,00,000',
  disabled = false,
  className = '',
  inputClassName = '',
  showWords = true,
  error,
}) => {
  const rawString = useMemo(() => {
    if (value === null || value === undefined) return ''
    return String(value)
  }, [value])

  const formattedDisplay = useMemo(() => {
    return formatIndianCurrency(rawString)
  }, [rawString])

  const shortWords = useMemo(() => {
    return numberToShortIndianWords(rawString)
  }, [rawString])

  const fullWords = useMemo(() => {
    return numberToFullIndianWords(rawString)
  }, [rawString])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextRaw = parseRawDigits(e.target.value)
    onChange(nextRaw)
  }

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="text-xs font-bold text-slate-700 block">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        <span className="absolute left-3.5 text-slate-400 font-semibold text-sm select-none">
          ₹
        </span>
        <input
          type="text"
          inputMode="numeric"
          disabled={disabled}
          placeholder={placeholder}
          value={formattedDisplay}
          onChange={handleChange}
          className={`w-full rounded-2xl border ${
            error ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300 bg-white'
          } pl-8 pr-4 py-3.5 text-sm text-slate-900 font-medium outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100 transition disabled:bg-slate-100 disabled:text-slate-400 ${inputClassName}`}
        />
      </div>

      {showWords && rawString && parseInt(rawString, 10) > 0 && (
        <div className="flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50/80 border border-blue-100/80 px-2.5 py-1 rounded-lg animate-fadeIn">
          <span className="font-bold">{shortWords}</span>
          <span className="text-slate-400">•</span>
          <span className="text-slate-600 truncate">{fullWords}</span>
        </div>
      )}

      {error && <p className="text-xs font-semibold text-rose-500">{error}</p>}
    </div>
  )
}
