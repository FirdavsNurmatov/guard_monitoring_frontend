import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/AdminPanel/Dashboard";
import User from "./pages/AdminPanel/users/Users";
import Organizations from "./pages/SuperAdminPanel/Organizations/Organizations";
import SuperAdminLayout from "./components/SuperAdminLayout";
import MainLayout from "./components/MainLayout";
import RoleChecker from "./components/RoleChecker";
import Objects from "./pages/SuperAdminPanel/objects/Objects";
import Users from "./pages/SuperAdminPanel/Users/Users";

function App() {
  return (
    <Routes>
      <Route index element={<Login />} />
      <Route
        path="monitoring"
        element={
          <RoleChecker roles={["ADMIN", "OPERATOR"]}>
            <Dashboard />
          </RoleChecker>
        }
      ></Route>
      <Route path="superadmin" element={<SuperAdminLayout />}>
        <Route index element={<Navigate to="organizations" replace />} />
        <Route
          path="organizations"
          element={
            <RoleChecker roles={["SUPERADMIN"]}>
              <Organizations />
            </RoleChecker>
          }
        />
        <Route
          path="objects"
          element={
            <RoleChecker roles={["SUPERADMIN"]}>
              <Objects />
            </RoleChecker>
          }
        />
        <Route
          path="users"
          element={
            <RoleChecker roles={["SUPERADMIN"]}>
              <Users />
            </RoleChecker>
          }
        />
      </Route>
      <Route path="admin" element={<MainLayout />}>
        <Route index element={<Navigate to="users" replace />} />
        {/*
        <Route
          key={2}
          path="object"
          element={
            <RoleChecker roles={["ADMIN"]}>
              <Objects />
            </RoleChecker>
          }
        /> */}
        <Route
          key={3}
          path="users"
          element={
            <RoleChecker roles={["ADMIN"]}>
              <User />
            </RoleChecker>
          }
        />
      </Route>

      <Route
        path="/*"
        element={
          <h1 className="text-[red] text-3xl text-center">Page not found!</h1>
        }
      ></Route>
    </Routes>
  );
}

export default App;
