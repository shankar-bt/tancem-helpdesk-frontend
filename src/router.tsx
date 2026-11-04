import { Navigate, Route, Routes } from 'react-router-dom';
import { paths } from '@/app/paths';
import { AuthLayout, LoginPage, RegisterPage } from '@/modules/core/auth';
import { DashboardPage } from '@/modules/core/dashboard';
import { DepartmentPage } from '@/modules/core/departments';
import { DesignationPage } from '@/modules/core/designation';
import { MasterPage } from '@/modules/core/masters';
import { ReportPage } from '@/modules/core/reports';
import { RolePage } from '@/modules/core/roles';
import { SlaPage } from '@/modules/core/sla';
import { CreateTicketPage, TicketPage } from '@/modules/core/tickets';
import { UserPage } from '@/modules/core/user';
import RootLayout from '@/RootLayout';
import ProtectedRoute, { GuestRoute } from '@/shared/routes/ProtectedRoute';

export default function AppRouter() {
  return (
    <Routes>
      <Route element={<GuestRoute />}>
        <Route element={<AuthLayout />}>
          <Route path={paths.login} element={<LoginPage />} />
          <Route path={paths.register} element={<RegisterPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<RootLayout />}>
          <Route path={paths.dashboard} element={<DashboardPage />} />
          <Route path={paths.tickets} element={<TicketPage />} />
          <Route path={paths.createTicket} element={<CreateTicketPage />} />
          <Route path={paths.reports} element={<ReportPage />} />
          <Route path={paths.departments} element={<DepartmentPage />} />
          <Route path={paths.users} element={<UserPage />} />
          <Route path={paths.userCreate} element={<UserPage />} />
          <Route path="/users/:id/edit" element={<UserPage />} />
          <Route path={paths.roles} element={<RolePage />} />
          <Route path={paths.sla} element={<SlaPage />} />
          <Route path={paths.designations} element={<DesignationPage />} />
          <Route path={paths.masters} element={<MasterPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to={paths.dashboard} replace />} />
    </Routes>
  );
}
