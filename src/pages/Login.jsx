import { useState } from "react";
import { Eye, EyeOff, Shield } from "lucide-react";
import { instance } from "../config/axios-instance";
import { useAuthStore } from "../store/useAuthStore";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
// import GuardMonitoring from '../../public/GuardMonitoring.png'

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState("");

  const navigate = useNavigate();
  const { setUser, setToken } = useAuthStore((store) => store);

  const [formData, setFormData] = useState({
    login: "",
    password: "",
    rememberMe: false,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setApiError("");

    try {
      localStorage.removeItem("user");
      localStorage.removeItem("token");

      const res = await instance.post("/auth/login", {
        login: formData.login,
        password: formData.password,
      });

      const data = res.data?.data;
      const accessToken = data?.access_token;
      const role = data?.role;

      if (!["SUPERADMIN", "ADMIN", "OPERATOR"].includes(role)) {
        throw new Error("Access denied");
      }

      setUser({
        username: data?.username,
        role,
      });

      setToken(accessToken);
      Cookies.set("accessToken", accessToken);

      if (role === "SUPERADMIN") {
        return navigate("/superadmin", { replace: true });
      } else {
        return navigate("/monitoring", { replace: true });
      }
    } catch (error) {
      const message = error?.response?.data?.message || "";

      if (message.includes("incorrect")) {
        setApiError("Login yoki parol noto'g'ri");
      } else if (message.includes("found")) {
        setApiError("Bunday foydalanuvchi mavjud emas");
      } else if (message.includes("inactive")) {
        setApiError("Organizatsiya aktiv emas");
      } else {
        setApiError(message || "Xatolik yuz berdi");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* LOGIN FORM */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <span className="text-2xl font-semibold text-gray-800">
              Qorovul Monitoringi
            </span>
          </div>

          {/* <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Nice to see you again
          </h1> */}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* LOGIN */}
            <div>
              <label className="block text-xl font-medium text-gray-700 mb-2">
                Login
              </label>
              <input
                type="text"
                value={formData.login}
                onChange={(e) =>
                  setFormData({ ...formData, login: e.target.value })
                }
                // placeholder="Login"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* PASSWORD */}
            <div>
              <label className="block text-xl font-medium text-gray-700 mb-2">
                Parol
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  // placeholder="Parol"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </div>

            {/* ERROR */}
            {apiError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{apiError}</p>
              </div>
            )}

            {/* SUBMIT */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? "Davom etayabdi..." : "Davom etish"}
            </button>
          </form>
        </div>
      </div>

      {/* IMAGE */}
      <div className="hidden lg:flex lg:w-3/5 relative">
        <img
          src="/GuardMonitoring.png"
          alt="Security guard monitoring"
          className="object-cover w-full h-full"
        />
      </div>
    </div>
  );
}
