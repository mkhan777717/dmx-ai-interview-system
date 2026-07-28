import React, { useEffect } from 'react'
import { Route, Routes } from 'react-router-dom'
import axios from 'axios'
import { useDispatch } from 'react-redux'
import { setUserData } from './redux/userSlice'

// Pages
import Home           from './pages/Home'
import Auth           from './pages/auth'
import Dashboard      from './pages/Dashboard'
import Analytics      from './pages/Analytics'
import InterviewHistory from './pages/InterviewHistory'
import Pricing        from './pages/Pricing'
import InterviewReport from './pages/InterviewReport'
import V2Interview    from './pages/V2Interview'
import AdminDashboard from './pages/AdminDashboard'
import RecruiterDashboard from './pages/RecruiterDashboard'
import SuperAdminDashboard from './pages/SuperAdminDashboard'
import Forbidden      from './pages/Forbidden'

// RBAC
import RoleGuard from './components/RoleGuard'
import ImpersonationBanner from './components/ImpersonationBanner'

export const ServerUrl = 'http://localhost:8000'

function App() {
  const dispatch = useDispatch()

  useEffect(() => {
    const getUser = async () => {
      try {
        const result = await axios.get(ServerUrl + '/api/user/current-user', { withCredentials: true })
        dispatch(setUserData(result.data))
      } catch {
        dispatch(setUserData(null))
      }
    }
    getUser()
  }, [dispatch])

  return (
    <>
      {/* Impersonation banner — shown globally when Super Admin is impersonating */}
      <ImpersonationBanner />

      <Routes>
        {/* ── Public ── */}
        <Route path='/'        element={<Home />} />
        <Route path='/auth'    element={<Auth />} />
        <Route path='/pricing' element={<Pricing />} />
        <Route path='/403'     element={<Forbidden />} />

        {/* ── Candidate Protected Routes (Requires Auth) ── */}
        <Route
          path='/dashboard'
          element={
            <RoleGuard>
              <Dashboard />
            </RoleGuard>
          }
        />
        <Route
          path='/analytics'
          element={
            <RoleGuard>
              <Analytics />
            </RoleGuard>
          }
        />
        <Route
          path='/history'
          element={
            <RoleGuard>
              <InterviewHistory />
            </RoleGuard>
          }
        />
        <Route
          path='/report/:id'
          element={
            <RoleGuard>
              <InterviewReport />
            </RoleGuard>
          }
        />
        <Route
          path='/interview'
          element={
            <RoleGuard>
              <V2Interview />
            </RoleGuard>
          }
        />
        <Route
          path='/v2/interview'
          element={
            <RoleGuard>
              <V2Interview />
            </RoleGuard>
          }
        />

        {/* ── Recruiter Dashboard (RECRUITER + SUPER_ADMIN) ── */}
        <Route
          path='/recruiter'
          element={
            <RoleGuard roles={['RECRUITER', 'SUPER_ADMIN']}>
              <RecruiterDashboard />
            </RoleGuard>
          }
        />

        {/* ── Admin / Recruiter Dashboard (legacy) ── */}
        <Route
          path='/admin'
          element={
            <RoleGuard roles={['RECRUITER', 'SUPER_ADMIN']}>
              <AdminDashboard />
            </RoleGuard>
          }
        />

        {/* ── Super Admin Dashboard (SUPER_ADMIN only) ── */}
        <Route
          path='/superadmin'
          element={
            <RoleGuard roles={['SUPER_ADMIN']}>
              <SuperAdminDashboard />
            </RoleGuard>
          }
        />
      </Routes>
    </>
  )
}

export default App
