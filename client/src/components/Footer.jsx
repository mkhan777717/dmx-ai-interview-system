import React from 'react'
import { BsRobot } from 'react-icons/bs'

function Footer() {
  return (
    <div className='bg-[#f3f3f3] flex justify-center px-4 pb-10 py-4 pt-10'>
      <div className='w-full max-w-6xl bg-white rounded-[24px] shadow-sm border border-gray-200 py-8 px-3 text-center'>
        <div className='flex justify-center items-center gap-3 mb-3'>
            <div className='bg-slate-950 border border-cyan-500/30 p-1.5 rounded-xl w-8 h-8 flex items-center justify-center'>
              <img src="/logo.png" alt="InterviewIQ Logo" className="w-full h-full object-contain aspect-square" />
            </div>
            <h2 className='font-semibold text-slate-900'>InterviewIQ.AI</h2>
        </div>
        <p className='text-gray-500 text-sm max-w-xl mx-auto'>
  AI-powered interview preparation platform designed to improve
          communication skills, technical depth and professional confidence.
        </p>


      </div>
    </div>
  )
}

export default Footer
