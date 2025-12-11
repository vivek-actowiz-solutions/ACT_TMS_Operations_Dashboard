import { BrowserRouter as Router, Routes, Route,Navigate } from "react-router";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Dashboard from "./components/ecommerce/Dashboard";
import CreateTaskUI from "./components/ecommerce/CreatTask";
import EditTaskUI from "./components/ecommerce/EditTask";
import SubmitTaskUI from "./components/ecommerce/Submit";
import TaskDetail from "./components/ecommerce/TaskDetail";
import TaskPage from "./components/ecommerce/TaskPage";
import EditSubmitPage from "./components/ecommerce/EditSubmit"
import Login from "./pages/Auth/Login";
import AdminDashboard from "./components/ecommerce/AdminDashboard";

import ForgotPassword from "./components/ecommerce/ForgotPassword";
import PrivateRoute from "./pages/Auth/PrivateRoute";
import AdminRoute from "./pages/Auth/AdminRoute";
import ReopenTask from "./components/ecommerce/ReopenTask";
import POC from "./components/ecommerce/POC";
import GeneratePOC from "./components/ecommerce/GeneratePOC";

import TaskDetailRD from "./components/ecommerce/TaskDetailRD";
import TaskPageRD from "./components/ecommerce/TaskPageRD";
import AssignTasksPage from "./components/ecommerce/AssignTasksPage";

export default function App() {
  return (
    <>
      <Router>
        <ScrollToTop />
        <Routes>
          <Route path="/TMS-operations/login" element={<Login />} />
          <Route path="/TMS-operations/forgot-password" element={<ForgotPassword />} />

          {/* Protected Routes */}
          <Route  element={<PrivateRoute />}>
            <Route element={<AppLayout />}>
              <Route index path="/TMS-operations/tasks" element={<TaskPage />} />
              <Route path="/TMS-operations" element={<Dashboard />} />
              <Route path="/TMS-operations/create" element={<CreateTaskUI />} />
              <Route path="/TMS-operations/edit/:id" element={<EditTaskUI />} />
              <Route path="/TMS-operations/submit/:id" element={<SubmitTaskUI />} />
              <Route path="/TMS-operations/tasks/:id" element={<TaskDetail />} />
              <Route path="/TMS-operations/tasks/:id/edit-submit" element={<EditSubmitPage />} />
              <Route path="/TMS-operations/tasks/:id/reopen" element={<ReopenTask />} />
              <Route path="/TMS-operations/poc/create/:taskId" element={<POC />} />
              <Route path="/TMS-operations/generate-poc" element={<GeneratePOC />} />
              <Route path="/TMS-operations/assign-tasks" element={<AssignTasksPage />} />


              {/* Routes for RD tasks */}
              <Route index path="/TMS-operations/tasks-rd" element={<TaskPageRD />} />
              <Route path="/TMS-operations/tasks-rd/:id" element={<TaskDetailRD />} />
              
              <Route element={<AdminRoute />}>
               <Route path="/TMS-operations/admin" element={<AdminDashboard />} />
              </Route>
              
            </Route>
          </Route>
           <Route path="*" element={<Navigate to="/TMS-operations/" replace />} />
         
        </Routes>
      </Router>
    </>
  );
}
