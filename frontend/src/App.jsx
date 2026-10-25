import { BrowserRouter, Routes, Route } from 'react-router-dom'

import Home from './pages/Home'
import Programs from './pages/Programs'
import ProgramDetails from './pages/ProgramDetails'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Dashboard from './pages/Dashboard'
import TraineeDashboard from './pages/TraineeDashboard'
import TrainerDashboard from './pages/TrainerDashboard'
import TrainerCourses from './pages/TrainerCourses'
import CreateCourse from './pages/CreateCourse'
import EditCourse from './pages/EditCourse'
import TrainerApplication from './pages/TrainerApplication'
import EvaluationPage from './pages/EvaluationPage'
import EvaluationList from './pages/EvaluationList'
import EvaluationManagement from './pages/EvaluationManagement'
import About from './pages/About'

function Paths() {
  return (
    <main dir="rtl">
      <h1>المسارات التدريبية</h1>
      <p>سيتم تطوير صفحة المسارات التدريبية.</p>
    </main>
  )
}



function CertificateVerification() {
  return (
    <main dir="rtl">
      <h1>التحقق من الشهادات</h1>
      <p>
        يمكن التحقق من صحة الشهادات التدريبية الصادرة
        عن نظام أثر باستخدام رقم الشهادة.
      </p>
    </main>
  )
}

function FAQ() {
  return (
    <main dir="rtl">
      <h1>الأسئلة الشائعة</h1>
      <p>سيتم تطوير صفحة الأسئلة الشائعة.</p>
    </main>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/programs" element={<Programs />} />
        <Route path="/programs/:id" element={<ProgramDetails />} />
        <Route path="/paths" element={<Paths />} />
        <Route path="/about" element={<About />} />

        <Route
          path="/verify-certificate"
          element={<CertificateVerification />}
        />

        <Route path="/faq" element={<FAQ />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />

        <Route
          path="/reset-password"
          element={<ResetPassword />}
        />

        <Route
          path="/trainer-application"
          element={<TrainerApplication />}
        />

        {/* لوحة الإدارة */}
        <Route path="/admin" element={<Dashboard />} />

        {/* إدارة التقييمات */}
        <Route
          path="/admin/evaluations"
          element={<EvaluationManagement />}
        />

        {/* مساحة المدرب */}
        <Route path="/trainer" element={<TrainerDashboard />} />
        <Route path="/trainer/courses" element={<TrainerCourses />} />

        {/* مساحة المتدرب */}
        <Route path="/trainee" element={<TraineeDashboard />} />

        {/* تقييمات المتدرب */}
        <Route
          path="/trainee/evaluations"
          element={<EvaluationList />}
        />

        <Route
          path="/trainee/evaluations/:courseId"
          element={<EvaluationPage />}
        />

        {/* إدارة الدورات */}
        <Route
          path="/admin/courses/new"
          element={<CreateCourse />}
        />

        <Route
          path="/admin/courses/:id/edit"
          element={<EditCourse />}
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App