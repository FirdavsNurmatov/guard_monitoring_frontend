import {
  Shield,
  Radio,
  Map,
  Bell,
  Camera,
  Check,
  Smartphone,
  Wifi,
  Activity,
  LogIn,
  Send,
  Mail,
  X,
} from "lucide-react";
import { useState } from "react";
import { Modal } from "antd";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
} from "react-leaflet";
import L from "leaflet";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../components/common/LanguageSwitcher";
import { CheckpointMarker } from "../components/map/CheckpointMarker";

const invisibleIcon = L.divIcon({
  className: "",
  html: `<div style="width:0;height:0;"></div>`,
  iconSize: [0, 0],
});

// Mock GPS tracking data - crosses checkpoint 1 and checkpoint 2
const mockGpsPoints = [
  [41.2995, 69.2401], // Checkpoint 1
  [41.3005, 69.238],
  [41.3015, 69.235],
  [41.302, 69.23],
  [41.3031, 69.2272], // Checkpoint 2
  [41.304, 69.229],
  [41.305, 69.231],
];

const checkpoints = [
  {
    id: 1,
    nameKey: "landing.checkpoints.checkpoint1",
    location: { lat: 41.2995, lng: 69.2401 },
    normalTime: 5,
    passTime: 2,
    infoStyle: "TOP",
  },
  {
    id: 2,
    nameKey: "landing.checkpoints.checkpoint2",
    location: { lat: 41.3031, lng: 69.2272 },
    normalTime: 5,
    passTime: 2,
    infoStyle: "LEFT",
  },
  {
    id: 3,
    nameKey: "landing.checkpoints.checkpoint3",
    location: { lat: 41.297, lng: 69.2432 },
    normalTime: 10,
    passTime: 3,
    infoStyle: "BOTTOM",
  },
  {
    id: 4,
    nameKey: "landing.checkpoints.checkpoint4",
    location: { lat: 41.3062, lng: 69.2359 },
    normalTime: 8,
    passTime: 2,
    infoStyle: "TOP",
  },
  {
    id: 5,
    nameKey: "landing.checkpoints.checkpoint5",
    location: { lat: 41.294, lng: 69.25 },
    normalTime: 6,
    passTime: 2,
    infoStyle: "TOP",
  },
];

const mockLatestLogs = {
  1: {
    createdAtRaw: Date.now() - 5 * 60 * 1000,
    guardKey: "landing.guards.guard1",
    status: "MISSED",
  },
  2: {
    createdAtRaw: Date.now() - 3 * 60 * 1000,
    guardKey: "landing.guards.guard2",
    status: "ON_TIME",
  },
  3: {
    createdAtRaw: Date.now() - 15 * 60 * 1000,
    guardKey: "landing.guards.guard3",
    status: "LATE",
  },
  4: {
    createdAtRaw: Date.now() - 2 * 60 * 1000,
    guardKey: "landing.guards.guard4",
    status: "ON_TIME",
  },
  5: {
    createdAtRaw: Date.now() - 8 * 60 * 1000,
    guardKey: "landing.guards.guard5",
    status: "ON_TIME",
  },
};

function App() {
  const { t } = useTranslation();
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [viewType, setViewType] = useState("MAP");
  if (!localStorage.getItem("i18nextLng")) {
    localStorage.setItem("i18nextLng", "latin");
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-hidden">
      <nav className="fixed top-0 w-full z-50 bg-gray-950/80 backdrop-blur-lg border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Shield className="w-8 h-8 text-emerald-400" />
            <span className="text-xl font-bold">Guard Monitoring</span>
          </div>
          <div className="flex flex-col xl:flex-row xl:items-center gap-4">
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-1">
              <LanguageSwitcher />
            </div>
            <a
              href="/login"
              className="px-6 py-2 border border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 rounded-lg font-semibold transition-all hover:scale-105 flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              {t("common.login")}
            </a>

            <button
              onClick={() => setDemoModalOpen(true)}
              className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 cursor-pointer rounded-lg font-semibold transition-all hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/50"
            >
              {t("landing.requestDemo")}
            </button>
          </div>
        </div>
      </nav>

      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-60 xl:pt-20">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-950 to-black"></div>

        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/30 rounded-full blur-3xl animate-pulse"></div>
          <div
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "1s" }}
          ></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <h1 className="text-5xl md:text-6xl font-bold leading-tight">
              {t("landing.realTimeMonitoring")}
            </h1>
            <p className="text-xl text-gray-400">
              {t("landing.trackEveryMove")}
            </p>
          </div>

          <div className="relative">
            <div className="relative w-full aspect-square">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-blue-500/20 rounded-3xl backdrop-blur-xl border border-gray-700 p-8">
                <div className="relative h-full flex flex-col items-center justify-center gap-8">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-emerald-500/20 rounded-2xl blur-xl group-hover:bg-emerald-500/40 transition-all"></div>
                    <div className="relative bg-gray-800 p-6 rounded-2xl border border-gray-700">
                      <Smartphone className="w-16 h-16 text-emerald-400" />
                    </div>
                  </div>

                  <div className="relative flex items-center gap-4">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-ping"></div>
                    <Wifi className="w-8 h-8 text-emerald-400 animate-pulse" />
                    <div
                      className="w-2 h-2 bg-emerald-400 rounded-full animate-ping"
                      style={{ animationDelay: "0.5s" }}
                    ></div>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 bg-blue-500/20 rounded-2xl blur-xl"></div>
                    <div className="relative bg-gray-800 p-6 rounded-2xl border border-gray-700 min-w-[200px]">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
                          <div className="h-2 bg-gray-700 rounded flex-1"></div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"
                            style={{ animationDelay: "0.3s" }}
                          ></div>
                          <div className="h-2 bg-gray-700 rounded flex-1 w-3/4"></div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"
                            style={{ animationDelay: "0.6s" }}
                          ></div>
                          <div className="h-2 bg-gray-700 rounded flex-1 w-1/2"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute -top-4 -right-4 bg-emerald-500 p-4 rounded-full animate-bounce">
                <Radio className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-gray-600 rounded-full p-1">
            <div className="w-1.5 h-3 bg-emerald-400 rounded-full mx-auto animate-pulse"></div>
          </div>
        </div>
      </section>

      <section className="relative py-24 bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">
            {t("landing.howItWorks")}
          </h2>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                icon: Map,
                title: t("landing.step1Title"),
                desc: t("landing.step1Desc"),
                delay: "0s",
              },
              {
                icon: Smartphone,
                title: t("landing.step2Title"),
                desc: t("landing.step2Desc"),
                delay: "0.2s",
              },
              {
                icon: Wifi,
                title: t("landing.step3Title"),
                desc: t("landing.step3Desc"),
                delay: "0.4s",
              },
              {
                icon: Activity,
                title: t("landing.step4Title"),
                desc: t("landing.step4Desc"),
                delay: "0.6s",
              },
            ].map((step, index) => (
              <div
                key={index}
                className="relative group"
                style={{ animationDelay: step.delay }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-blue-500/10 rounded-2xl blur-xl group-hover:from-emerald-500/20 group-hover:to-blue-500/20 transition-all"></div>
                <div className="relative bg-gray-800 p-8 rounded-2xl border border-gray-700 hover:border-emerald-500/50 transition-all hover:transform hover:scale-105 h-full">
                  <div className="bg-emerald-500/10 w-16 h-16 rounded-xl flex items-center justify-center mb-4 group-hover:bg-emerald-500/20 transition-all">
                    <step.icon className="w-8 h-8 text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                  <p className="text-gray-400">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-950 to-gray-900"></div>

        <div className="relative max-w-7xl mx-auto px-6">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">
            {t("landing.liveDashboard")}
          </h2>

          <div className="relative bg-gray-800/50 backdrop-blur-xl rounded-3xl border border-gray-700 overflow-hidden">
            <div className="p-8">
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gray-900 p-6 rounded-xl border border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400">
                      {t("landing.activeGuards")}
                    </span>
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                  </div>
                  <div className="text-3xl font-bold text-emerald-400">12</div>
                </div>
                <div className="bg-gray-900 p-6 rounded-xl border border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400">
                      {t("landing.todayChecks")}
                    </span>
                    <Check className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="text-3xl font-bold text-blue-400">248</div>
                </div>
                <div className="bg-gray-900 p-6 rounded-xl border border-red-900/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400">
                      {t("landing.missedPoints")}
                    </span>
                    <Bell className="w-5 h-5 text-red-400 animate-pulse" />
                  </div>
                  <div className="text-3xl font-bold text-red-400">3</div>
                </div>
              </div>

              <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Map className="w-5 h-5 text-emerald-400" />
                      {t("landing.liveMap")}
                    </h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setViewType("MAP")}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${
                          viewType === "MAP"
                            ? "bg-emerald-500 text-white"
                            : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                        }`}
                      >
                        {t("dashboardPage.map")}
                      </button>
                      <button
                        onClick={() => setViewType("IMAGE")}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${
                          viewType === "IMAGE"
                            ? "bg-emerald-500 text-white"
                            : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                        }`}
                      >
                        {t("dashboardPage.image")}
                      </button>
                    </div>
                  </div>

                  <div
                    className="bg-gray-900 text-black rounded-xl border border-gray-700 overflow-hidden relative"
                    style={{ height: "400px" }}
                  >
                    {viewType === "IMAGE" ? (
                      <div className="relative h-full w-full">
                        <img
                          src="/GuardMonitoringLandingPage.png"
                          alt="Guard Monitoring"
                          className="h-full w-full object-cover opacity-90"
                        />
                        <div className="absolute inset-0"></div>
                        {checkpoints.map((cp) => {
                          const latestLog = mockLatestLogs[cp.id];
                          const checkpointWithTranslatedName = {
                            ...cp,
                            name: t(cp.nameKey),
                          };
                          const logWithTranslatedGuard = latestLog
                            ? {
                                ...latestLog,
                                guard: t(latestLog.guardKey),
                              }
                            : null;

                          return (
                            <CheckpointMarker
                              key={cp.id}
                              cp={checkpointWithTranslatedName}
                              latestLog={logWithTranslatedGuard}
                              direction={cp?.infoStyle}
                              objectType="IMAGE"
                              style={{
                                top: `${25 + cp.id * 10}%`,
                                left: `${15 + cp.id * 14}%`,
                              }}
                            />
                          );
                        })}
                      </div>
                    ) : (
                      <MapContainer
                        center={[41.3031, 69.2372]}
                        zoom={14}
                        style={{ height: "100%", width: "100%" }}
                        className="rounded-xl"
                        attributionControl={false}
                      >
                        <TileLayer
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          attribution="&copy; OpenStreetMap contributors"
                        />

                        {mockGpsPoints.length > 0 && (
                          <>
                            <Polyline
                              positions={mockGpsPoints}
                              color="#3b82f6"
                              weight={4}
                              opacity={0.8}
                            />
                            <Marker
                              position={mockGpsPoints[mockGpsPoints.length - 1]}
                              icon={L.divIcon({
                                className: "",
                                html: `<div style="
                                width:12px;
                                height:12px;
                                background-color:#22c55e;
                                border:2px solid white;
                                border-radius:50%;
                                box-shadow: 0 0 10px rgba(34, 197, 94, 0.5);
                              "></div>`,
                              })}
                            >
                              <Popup>
                                <div className="bg-gray-900 text-white px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap">
                                  {t("landing.guards.guard2")}
                                </div>
                              </Popup>
                            </Marker>
                          </>
                        )}

                        {checkpoints.map((cp) => {
                          if (!cp.location?.lat || !cp.location?.lng)
                            return null;

                          const latestLog = mockLatestLogs[cp.id];
                          const checkpointWithTranslatedName = {
                            ...cp,
                            name: t(cp.nameKey),
                          };
                          const logWithTranslatedGuard = latestLog
                            ? {
                                ...latestLog,
                                guard: t(latestLog.guardKey),
                              }
                            : null;

                          return (
                            <Marker
                              key={cp.id}
                              position={[cp.location?.lat, cp.location?.lng]}
                              icon={invisibleIcon}
                            >
                              <CheckpointMarker
                                cp={checkpointWithTranslatedName}
                                latestLog={logWithTranslatedGuard}
                                direction={cp?.infoStyle}
                                objectType="MAP"
                              />
                            </Marker>
                          );
                        })}
                      </MapContainer>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-gray-900 rounded-xl border border-gray-700 p-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <Camera className="w-5 h-5 text-emerald-400" />
                      {t("landing.statusLegend.title")}
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
                        <div className="w-4 h-4 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-sm text-gray-300">
                          {t("landing.statusLegend.onTime")}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
                        <div className="w-4 h-4 rounded-full bg-yellow-400"></div>
                        <span className="text-sm text-gray-300">
                          {t("landing.statusLegend.late")}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
                        <div className="w-4 h-4 rounded-full bg-red-500"></div>
                        <span className="text-sm text-gray-300">
                          {t("landing.statusLegend.missed")}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-900 rounded-xl border border-gray-700 p-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <Map className="w-5 h-5 text-blue-400" />
                      {t("landing.gpsLegend.title")}
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
                        <div className="w-8 h-1 bg-blue-500 rounded"></div>
                        <span className="text-sm text-gray-300">
                          {t("landing.gpsLegend.path")}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
                        <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white"></div>
                        <span className="text-sm text-gray-300">
                          {t("landing.gpsLegend.current")}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative py-24 bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">
            {t("landing.keyFeatures")}
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Activity,
                title: t("landing.realTimeControl"),
                desc: t("landing.trackEveryMoveDesc"),
              },
              {
                icon: Radio,
                title: t("landing.nfcCheck"),
                desc: t("landing.nfcCheckDesc"),
              },
              {
                icon: Camera,
                title: t("landing.photoTimeProof"),
                desc: t("landing.photoTimeProofDesc"),
              },
              {
                icon: Bell,
                title: t("landing.autoAlerts"),
                desc: t("landing.autoAlertsDesc"),
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="group relative bg-gray-800 p-8 rounded-2xl border border-gray-700 hover:border-emerald-500/50 transition-all hover:transform hover:scale-105"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 to-blue-500/0 group-hover:from-emerald-500/10 group-hover:to-blue-500/10 rounded-2xl transition-all"></div>
                <div className="relative">
                  <div className="bg-emerald-500/10 w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:bg-emerald-500/20 transition-all group-hover:scale-110">
                    <feature.icon className="w-7 h-7 text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/20 via-gray-950 to-blue-900/20"></div>
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>
        </div>

        <div className="relative max-w-4xl mx-auto px-6 text-center space-y-8">
          <h2 className="text-5xl md:text-6xl font-bold leading-tight">
            {t("landing.takeSecurityToNewLevel")}
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            {t("landing.modernMonitoringDesc")}
          </p>
        </div>
      </section>

      <footer className="relative py-12 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <Shield className="w-8 h-8 text-emerald-400" />
              <span className="text-xl font-bold">Guard Monitoring</span>
            </div>
            <div className="flex items-center gap-3">
              <a
                href="https://www.linkedin.com/in/firdavsnurmatov/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-gray-400 hover:text-emerald-400 transition-colors"
              >
                <span className="font-bold text-sm">in</span>
                <span className="text-sm">LinkedIn</span>
              </a>
              <a
                href="https://t.me/FirdavsNurmatov_404"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-gray-400 hover:text-blue-400 transition-colors"
              >
                <Send className="w-4 h-4" />
                <span className="text-sm">Telegram</span>
              </a>
              <a
                href="mailto:nurmatovfirdavs96@gmail.com"
                className="flex items-center gap-2 text-gray-400 hover:text-gray-300 transition-colors"
              >
                <Mail className="w-4 h-4" />
                <span className="text-sm">Email</span>
              </a>
            </div>
            <p className="text-gray-400">{t("landing.copyright")}</p>
          </div>
        </div>
      </footer>

      <Modal
        open={demoModalOpen}
        onCancel={() => setDemoModalOpen(false)}
        footer={null}
        centered
        width={500}
        closeIcon={
          <button className="w-8 h-8 bg-emerald-500 hover:bg-emerald-500 cursor-pointer rounded-full flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-emerald-500/50">
            <X className="w-4 h-4 text-gray-900 hover:text-white" />
          </button>
        }
        styles={{
          body: { background: "#1a1a2e", padding: "36px" },
          content: {
            backgroundColor: "#1a1a2e",
            borderRadius: "20px",
            border: "none",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
          },
        }}
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl shadow-emerald-500/30">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-3xl font-bold text-white mb-3 bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text">
            {t("landing.requestDemo")}
          </h3>
          <p className="text-gray-400">{t("landing.contactDescription")}</p>
        </div>

        <div className="space-y-4">
          <a
            href="https://www.linkedin.com/in/firdavsnurmatov/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 p-5 bg-gray-800/50 hover:bg-emerald-500 hover:shadow-lg hover:shadow-emerald-500/30 rounded-2xl transition-all duration-300 group transform hover:scale-105 border border-gray-700 hover:border-emerald-500"
          >
            <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center group-hover:bg-emerald-500/30 transition-all duration-300">
              <span className="text-emerald-400 font-bold text-2xl group-hover:text-white transition-colors">
                in
              </span>
            </div>
            <span className="text-white font-semibold text-lg group-hover:text-white">
              LinkedIn
            </span>
            <Activity className="w-5 h-5 text-emerald-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
          </a>

          <a
            href="https://t.me/FirdavsNurmatov_404"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 p-5 bg-gray-800/50 hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/30 rounded-2xl transition-all duration-300 group transform hover:scale-105 border border-gray-700 hover:border-blue-500"
          >
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center group-hover:bg-blue-500/30 transition-all duration-300">
              <Send className="w-6 h-6 text-blue-400 group-hover:text-white transition-colors" />
            </div>
            <span className="text-white font-semibold text-lg group-hover:text-white">
              Telegram
            </span>
            <Activity className="w-5 h-5 text-blue-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
          </a>

          <a
            href="mailto:nurmatovfirdavs96@gmail.com"
            className="flex items-center gap-4 p-5 bg-gray-800/50 hover:bg-purple-500 hover:shadow-lg hover:shadow-purple-500/30 rounded-2xl transition-all duration-300 group transform hover:scale-105 border border-gray-700 hover:border-purple-500"
          >
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center group-hover:bg-purple-500/30 transition-all duration-300">
              <Mail className="w-6 h-6 text-purple-400 group-hover:text-white transition-colors" />
            </div>
            <span className="text-white font-semibold text-lg group-hover:text-white">
              Email
            </span>
            <Activity className="w-5 h-5 text-purple-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
          </a>
        </div>
      </Modal>
    </div>
  );
}

export default App;
