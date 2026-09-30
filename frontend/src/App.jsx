import { BrowserRouter, Routes, Route } from 'react-router-dom'
import TraineeDashboard from './pages/TraineeDashboard'
import Home from './pages/Home'
import Programs from './pages/Programs'
import ProgramDetails from './pages/ProgramDetails'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import CreateCourse from './pages/CreateCourse'
import EditCourse from './pages/EditCourse'


function Paths() {
  return (
    <main dir="rtl">
      <h1>المسارات التدريبية</h1>
      <p>سيتم تطوير صفحة المسارات التدريبية.</p>
    </main>
  )
}


function About() {
  return (
    <main dir="rtl">
      <h1>عن أثر</h1>
      <p>
        أثر هو نظام إدارة الدورات التدريبية وقياس الأثر
        لمنسوبي جامعة الملك سعود.
      </p>
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

        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/programs"
          element={<Programs />}
        />

        <Route
          path="/programs/:id"
          element={<ProgramDetails />}
        />

        <Route
          path="/paths"
          element={<Paths />}
        />

        <Route
          path="/about"
          element={<About />}
        />

        <Route
          path="/verify-certificate"
          element={<CertificateVerification />}
        />

        <Route
          path="/faq"
          element={<FAQ />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/admin"
          element={<Dashboard />}
        />

        <Route
          path="/trainer"
          element={<Dashboard />}
        />




        <Route
          path="/trainee"
          element={<TraineeDashboard />}
        />

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