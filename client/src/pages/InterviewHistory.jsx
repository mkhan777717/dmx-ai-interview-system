import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from "axios"
import { ServerUrl } from '../App'
import { FaHistory, FaCalendarAlt, FaCheckCircle, FaSpinner } from 'react-icons/fa'
import { BsArrowRight } from 'react-icons/bs'
import V2Layout from '../components/V2Layout'

function InterviewHistory() {
    const [interviews, setInterviews] = useState([])
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()

    useEffect(() => {
        const getMyInterviews = async () => {
            try {
                const result = await axios.get(ServerUrl + "/api/v2/interview/history", { withCredentials: true })
                setInterviews(result.data)
            } catch (error) {
                console.log(error)
            } finally {
                setLoading(false)
            }
        }

        getMyInterviews()

    }, [])

    return (
        <V2Layout title="Interview History" subtitle="Review your past mock interviews and detailed performance reports">
            <div className="flex-1 w-full p-4 lg:p-8">
                <div className="max-w-5xl mx-auto space-y-6">
                    
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                            <FaSpinner className="animate-spin text-3xl mb-4 text-green-500" />
                            <p>Loading history...</p>
                        </div>
                    ) : interviews.length === 0 ? (
                        <div className="bg-white border border-gray-100 p-12 rounded-2xl shadow-sm text-center flex flex-col items-center justify-center">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                <FaHistory className="text-gray-300 text-2xl" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-800 mb-2">No interviews found</h3>
                            <p className="text-gray-500 max-w-sm mb-6">You haven't completed any mock interviews yet. Start your first session to see your progress here.</p>
                            <button onClick={() => navigate('/v2/interview')} className="px-6 py-2.5 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition">
                                Start Interview
                            </button>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {interviews.map((item, index) => (
                                <div key={index}
                                    onClick={() => navigate(`/report/${item._id}`)}
                                    className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-green-200 transition-all duration-300 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg
                                            ${item.status === 'completed' ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'}`}>
                                            {item.role.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900 group-hover:text-green-600 transition-colors">
                                                {item.role}
                                            </h3>
                                            <div className="flex items-center gap-3 text-xs font-medium text-gray-500 mt-1">
                                                <span className="flex items-center gap-1"><FaCalendarAlt className="text-gray-400" /> {new Date(item.createdAt).toLocaleDateString()}</span>
                                                <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                                <span>{item.mode} Mode</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6 border-t md:border-t-0 border-gray-50 pt-4 md:pt-0 mt-2 md:mt-0">
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-gray-900">
                                                {item.finalScore || 0} / 100
                                            </p>
                                            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">
                                                Final Score
                                            </p>
                                        </div>
                                        <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5
                                            ${item.status === "completed" ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"}`}>
                                            {item.status === "completed" ? <FaCheckCircle/> : <FaSpinner className="animate-spin" />}
                                            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-green-50 group-hover:text-green-600 transition-colors">
                                            <BsArrowRight />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </V2Layout>
    )
}

export default InterviewHistory
