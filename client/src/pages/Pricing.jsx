import React, { useState } from 'react'
import { FaArrowLeft, FaCheckCircle } from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import axios from 'axios'
import { ServerUrl } from '../App'
import { useDispatch } from 'react-redux'
import { setUserData } from '../redux/userSlice'

function Pricing() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [selectedPlan, setSelectedPlan] = useState('basic')
  const [loadingPlan, setLoadingPlan] = useState(null)

  const plans = [
    {
      id: 'free',
      name: 'Free Starter',
      price: '₹0',
      credits: 100,
      description: 'Perfect for beginners trying out AI interview practice.',
      features: [
        '100 AI Interview Credits',
        'Standard Technical & HR Questions',
        'Basic Performance Report',
        'Voice & Text Practice',
      ],
      default: true,
    },
    {
      id: 'basic',
      name: 'Starter Pack',
      price: '₹100',
      credits: 150,
      description: 'Great for focused practice and skill improvement.',
      features: [
        '150 AI Interview Credits',
        'Detailed Communication & Delivery Report',
        'Full Performance Analytics',
        'Unlimited Interview History',
      ],
      badge: 'Popular',
    },
    {
      id: 'pro',
      name: 'Pro Pack',
      price: '₹500',
      credits: 650,
      description: 'Best value for active job seekers & intensive practice.',
      features: [
        '650 AI Interview Credits',
        'Human-like AI Avatar Interviewer',
        'Deep Rubric & Integrity Flags',
        'Priority AI Processing Speed',
      ],
      badge: 'Best Value',
    },
  ]

  const handlePayment = async (plan) => {
    try {
      setLoadingPlan(plan.id)

      const amount = plan.id === 'basic' ? 100 : plan.id === 'pro' ? 500 : 0

      const result = await axios.post(
        ServerUrl + '/api/payment/order',
        { planId: plan.id, amount, credits: plan.credits },
        { withCredentials: true }
      )

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: result.data.amount,
        currency: 'INR',
        name: 'InterviewIQ.AI',
        description: `${plan.name} - ${plan.credits} Credits`,
        order_id: result.data.id,
        handler: async function (response) {
          const verifypay = await axios.post(
            ServerUrl + '/api/payment/verify',
            response,
            { withCredentials: true }
          )
          dispatch(setUserData(verifypay.data.user))
          alert('Payment Successful 🎉 Credits Added!')
          navigate('/dashboard')
        },
        theme: {
          color: '#10b981',
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.open()

      setLoadingPlan(null)
    } catch (error) {
      console.error(error)
      setLoadingPlan(null)
    }
  }

  return (
    <div className="min-h-screen bg-[#f4f6f8] text-gray-900 py-12 px-6 font-['Inter',sans-serif]">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-12 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="p-2.5 rounded-xl bg-white border border-gray-200 shadow-xs hover:bg-gray-50 transition cursor-pointer text-gray-700 flex items-center gap-2 text-xs font-semibold"
        >
          <FaArrowLeft /> Back
        </button>

        <div className="text-center flex-1 max-w-xl">
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 uppercase tracking-wide">
            Pricing Plans
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-2">
            Simple, Transparent Pricing
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Choose the right plan to get additional AI credits for practice sessions.
          </p>
        </div>

        <div className="w-16" />
      </div>

      {/* Cards */}
      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {plans.map((plan) => {
          const isSelected = selectedPlan === plan.id

          return (
            <motion.div
              key={plan.id}
              whileHover={{ y: -4 }}
              onClick={() => !plan.default && setSelectedPlan(plan.id)}
              className={`relative rounded-3xl p-8 transition-all border ${
                isSelected
                  ? 'border-emerald-500 shadow-xl bg-white ring-2 ring-emerald-500/20'
                  : 'border-gray-200 bg-white shadow-xs'
              } ${plan.default ? 'cursor-default' : 'cursor-pointer'}`}
            >
              {plan.badge && (
                <div className="absolute top-6 right-6 bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-xs">
                  {plan.badge}
                </div>
              )}

              {plan.default && (
                <div className="absolute top-6 right-6 bg-gray-100 text-gray-600 text-xs font-bold px-3 py-1 rounded-full">
                  Default
                </div>
              )}

              <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>

              <div className="mt-4">
                <span className="text-3xl font-extrabold text-emerald-600">
                  {plan.price}
                </span>
                <p className="text-gray-500 text-xs font-semibold mt-1">
                  {plan.credits} AI Credits
                </p>
              </div>

              <p className="text-gray-600 text-xs mt-3 leading-relaxed">
                {plan.description}
              </p>

              <div className="mt-6 space-y-3">
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <FaCheckCircle className="text-emerald-500 text-xs shrink-0" />
                    <span className="text-gray-700 text-xs font-medium">{feature}</span>
                  </div>
                ))}
              </div>

              {!plan.default && (
                <button
                  disabled={loadingPlan === plan.id}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (!isSelected) {
                      setSelectedPlan(plan.id)
                    } else {
                      handlePayment(plan)
                    }
                  }}
                  className={`w-full mt-8 py-3 rounded-xl font-bold text-xs transition cursor-pointer shadow-xs ${
                    isSelected
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                      : 'bg-gray-100 text-gray-800 hover:bg-emerald-50 hover:text-emerald-700'
                  }`}
                >
                  {loadingPlan === plan.id
                    ? 'Processing...'
                    : isSelected
                    ? 'Proceed to Pay'
                    : 'Select Plan'}
                </button>
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

export default Pricing
