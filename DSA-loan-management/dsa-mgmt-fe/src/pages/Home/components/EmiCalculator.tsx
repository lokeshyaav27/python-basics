import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ROUTES } from '../../../constants'

export const EmiCalculator: React.FC = () => {
  const [amount, setAmount] = useState<number>(2500000)
  const [rate, setRate] = useState<number>(8.5)
  const [tenureYears, setTenureYears] = useState<number>(15)

  const { monthlyEmi, totalInterest, totalPayment } = useMemo(() => {
    const monthlyRate = rate / 12 / 100
    const totalMonths = tenureYears * 12
    if (monthlyRate === 0) {
      const emi = amount / totalMonths
      return { monthlyEmi: Math.round(emi), totalInterest: 0, totalPayment: amount }
    }
    const emi = (amount * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1)
    const totalPay = emi * totalMonths
    const interest = totalPay - amount
    return {
      monthlyEmi: Math.round(emi),
      totalInterest: Math.round(interest),
      totalPayment: Math.round(totalPay),
    }
  }, [amount, rate, tenureYears])

  const principalRatio = Math.round((amount / (totalPayment || 1)) * 100)
  const interestRatio = 100 - principalRatio

  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 lg:p-10 shadow-2xl shadow-blue-900/5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-5">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
            📊 Interactive Tool
          </span>
          <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-2">Loan EMI Calculator</h3>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 max-w-xs">
          Plan your monthly budget with our real-time loan interest estimator.
        </p>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-12 items-center">
        {/* Sliders Area (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Loan Amount */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Loan Amount</label>
              <span className="text-base font-extrabold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">
                ₹ {amount.toLocaleString('en-IN')}
              </span>
            </div>
            <input
              type="range"
              min={100000}
              max={10000000}
              step={50000}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full h-2.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-[11px] text-slate-400 mt-1">
              <span>₹1 Lakh</span>
              <span>₹50 Lakh</span>
              <span>₹1 Crore</span>
            </div>
          </div>

          {/* Interest Rate */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Interest Rate (% p.a.)</label>
              <span className="text-base font-extrabold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">
                {rate.toFixed(1)} %
              </span>
            </div>
            <input
              type="range"
              min={7.5}
              max={18.0}
              step={0.1}
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
              className="w-full h-2.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-[11px] text-slate-400 mt-1">
              <span>7.5%</span>
              <span>12.5%</span>
              <span>18.0%</span>
            </div>
          </div>

          {/* Tenure */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Tenure (Years)</label>
              <span className="text-base font-extrabold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">
                {tenureYears} Years ({tenureYears * 12} Months)
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={30}
              step={1}
              value={tenureYears}
              onChange={(e) => setTenureYears(Number(e.target.value))}
              className="w-full h-2.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-[11px] text-slate-400 mt-1">
              <span>1 Year</span>
              <span>15 Years</span>
              <span>30 Years</span>
            </div>
          </div>
        </div>

        {/* Results Card (5 cols) */}
        <div className="lg:col-span-5 rounded-2xl bg-gradient-to-br from-slate-900 to-blue-950 p-6 text-white shadow-xl flex flex-col justify-between">
          <div>
            <span className="text-xs uppercase tracking-widest text-blue-300 font-bold">Estimated Monthly EMI</span>
            <div className="mt-2 text-3xl sm:text-4xl font-extrabold text-emerald-400 tracking-tight">
              ₹ {monthlyEmi.toLocaleString('en-IN')}
              <span className="text-xs font-medium text-slate-300"> / month</span>
            </div>

            <div className="mt-6 space-y-3 pt-5 border-t border-white/10 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Principal Loan Amount</span>
                <span className="font-bold text-white">₹ {amount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Interest Payable</span>
                <span className="font-bold text-amber-300">₹ {totalInterest.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between font-bold text-sm pt-2 border-t border-white/10">
                <span className="text-slate-200">Total Repayment</span>
                <span className="text-white">₹ {totalPayment.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Split Bar */}
            <div className="mt-6">
              <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                <span>Principal: {principalRatio}%</span>
                <span>Interest: {interestRatio}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-amber-400 overflow-hidden flex">
                <div style={{ width: `${principalRatio}%` }} className="bg-blue-500 h-full" />
              </div>
            </div>
          </div>

          <Link
            to={ROUTES.APPLY_FOR_LOAN}
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-center text-sm font-bold text-white shadow-lg shadow-blue-600/40 hover:bg-blue-500 transition active:scale-95"
          >
            Apply with These Terms →
          </Link>
        </div>
      </div>
    </div>
  )
}

export default EmiCalculator
