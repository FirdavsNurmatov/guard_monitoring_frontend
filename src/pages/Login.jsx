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
    <div className="flex min-h-screen bg-gray-950 relative overflow-hidden">
      {/* Animated background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-950 to-black"></div>
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/30 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
      </div>

      {/* IMAGE */}
      <div className="hidden lg:flex lg:w-3/5 relative">
        <img
          src="/GuardMonitoring.png"
          alt="Security guard monitoring"
          className="object-cover w-full h-full"
        />
        <div className="absolute inset-0 bg-gradient-to-l from-gray-950 via-gray-950/50 to-transparent"></div>
      </div>

      {/* LOGIN FORM */}
      <div className="flex-1 flex items-center justify-center p-8 relative z-10">
        <div className="w-full max-w-md">
          <div className="bg-gray-900/80 backdrop-blur-xl rounded-3xl border border-gray-700 p-8 shadow-2xl">
            <div className="mb-8 flex items-center gap-3 justify-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <span className="text-2xl font-semibold text-white">
                Guard Monitoring
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* LOGIN */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Login
                </label>
                <input
                  type="text"
                  value={formData.login}
                  onChange={(e) =>
                    setFormData({ ...formData, login: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-white placeholder-gray-500 transition-all"
                  required
                />
              </div>

              {/* PASSWORD */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Parol
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-white placeholder-gray-500 pr-12 transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-400 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* ERROR */}
              {apiError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-sm text-red-400">{apiError}</p>
                </div>
              )}

              {/* SUBMIT */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg transition-all hover:shadow-lg hover:shadow-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Davom etayabdi..." : "Davom etish"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
