import {
  Shield,
  Radio,
  Map,
  Bell,
  Camera,
  Clock,
  Check,
  Smartphone,
  Wifi,
  Activity,
  X,
  LogIn,
} from "lucide-react";
import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";

const defaultIcon = new L.Icon({
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const guardMarkers = [
  {
    id: 1,
    lat: 41.2995,
    lng: 69.2401,
    name: "Guard 1",
    status: "active",
    image:
      "/GuardMeasure.jpeg",
  },
  {
    id: 2,
    lat: 41.3031,
    lng: 69.2272,
    name: "Guard 2",
    status: "active",
    image:
      "/GuardMeasure.jpeg",
  },
  {
    id: 3,
    lat: 41.297,
    lng: 69.2432,
    name: "Guard 3",
    status: "inactive",
    image:
      "/GuardMeasure.jpeg",
  },
  {
    id: 4,
    lat: 41.3062,
    lng: 69.2359,
    name: "Guard 4",
    status: "active",
    image:
      "/GuardMeasure.jpeg",
  },
  {
    id: 5,
    lat: 41.294,
    lng: 69.25,
    name: "Guard 5",
    status: "active",
    image:
      "/GuardMeasure.jpeg",
  },
];

function App() {
  const [scrollY, setScrollY] = useState(0);
  const [selectedGuard, setSelectedGuard] = useState(null);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-hidden">
      <nav className="fixed top-0 w-full z-50 bg-gray-950/80 backdrop-blur-lg border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Shield className="w-8 h-8 text-emerald-400" />
            <span className="text-xl font-bold">Guard Monitoring</span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/login"
              className="px-6 py-2 border border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 rounded-lg font-semibold transition-all hover:scale-105 flex items-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              Kirish
            </a>
            <button className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg font-semibold transition-all hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/50">
              Demo so'rash
            </button>
          </div>
        </div>
      </nav>

      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
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
              Qorovullarni{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-500">
                real vaqt rejimida
              </span>{" "}
              nazorat qiling
            </h1>
            <p className="text-xl text-gray-400">
              Har bir yurishni kuzating, xavfsizlikni oshiring
            </p>
            <button className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 rounded-lg font-semibold text-lg transition-all hover:scale-105 hover:shadow-2xl hover:shadow-emerald-500/50 flex items-center gap-2 group">
              Demo so'rash
              <Activity className="w-5 h-5 group-hover:animate-pulse" />
            </button>
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
            Qanday <span className="text-emerald-400">ishlaydi</span>
          </h2>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                icon: Map,
                title: "NFC kartalar joylashtiriladi",
                desc: "Muhim nuqtalarga kartalar o'rnatiladi",
                delay: "0s",
              },
              {
                icon: Smartphone,
                title: "Qorovul planshet bilan uradi",
                desc: "Mobil qurilma orqali skanerlash",
                delay: "0.2s",
              },
              {
                icon: Wifi,
                title: "Ma'lumot tizimga yuboriladi",
                desc: "Real vaqtda axborot uzatiladi",
                delay: "0.4s",
              },
              {
                icon: Activity,
                title: "Admin real vaqtda ko'radi",
                desc: "Dashboard orqali monitoring",
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
            Live <span className="text-emerald-400">Dashboard</span>
          </h2>

          <div className="relative bg-gray-800/50 backdrop-blur-xl rounded-3xl border border-gray-700 overflow-hidden">
            <div className="p-8">
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gray-900 p-6 rounded-xl border border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400">Faol qorovullar</span>
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                  </div>
                  <div className="text-3xl font-bold text-emerald-400">12</div>
                </div>
                <div className="bg-gray-900 p-6 rounded-xl border border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400">Bugungi tekshiruvlar</span>
                    <Check className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="text-3xl font-bold text-blue-400">248</div>
                </div>
                <div className="bg-gray-900 p-6 rounded-xl border border-red-900/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400">O'tkazilgan nuqtalar</span>
                    <Bell className="w-5 h-5 text-red-400 animate-pulse" />
                  </div>
                  <div className="text-3xl font-bold text-red-400">3</div>
                </div>
              </div>

              <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <div
                    className="bg-gray-900 rounded-xl border border-gray-700 overflow-hidden"
                    style={{ height: "400px" }}
                  >
                    <MapContainer
                      center={[41.3031, 69.2272]}
                      zoom={14}
                      style={{ height: "100%", width: "100%" }}
                      className="rounded-xl"
                    >
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution="&copy; OpenStreetMap contributors"
                      />
                      {guardMarkers.map((guard) => (
                        <Marker
                          key={guard.id}
                          position={[guard.lat, guard.lng]}
                          icon={defaultIcon}
                          eventHandlers={{
                            click: () => setSelectedGuard(guard.id),
                          }}
                        >
                          <Popup>
                            <div className="text-sm">
                              <p className="font-semibold">{guard.name}</p>
                              <p
                                className={`text-xs ${guard.status === "active" ? "text-green-600" : "text-red-600"}`}
                              >
                                {guard.status === "active" ? "Faol" : "Nofaol"}
                              </p>
                            </div>
                          </Popup>
                        </Marker>
                      ))}
                    </MapContainer>
                  </div>

                  <div className="bg-gray-900 rounded-xl p-6 border border-gray-700">
                    <h3 className="font-semibold mb-4">Tekshiruv Tarixi</h3>
                    <div className="space-y-3">
                      {[
                        {
                          time: "14:32",
                          guard: "Guard 1",
                          location: "Kirish 1",
                          status: "success",
                        },
                        {
                          time: "14:28",
                          guard: "Guard 4",
                          location: "Xona 5",
                          status: "success",
                        },
                        {
                          time: "14:15",
                          guard: "Guard 2",
                          location: "Kirish 2",
                          status: "warning",
                        },
                        {
                          time: "14:02",
                          guard: "Guard 5",
                          location: "Xona 3",
                          status: "success",
                        },
                      ].map((log, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 bg-gray-800 rounded-lg border border-gray-700"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-2 h-2 rounded-full ${log.status === "success" ? "bg-emerald-400" : "bg-yellow-400"}`}
                            ></div>
                            <div className="text-sm">
                              <p className="text-gray-300">
                                {log.guard} - {log.location}
                              </p>
                              <p className="text-gray-500 text-xs">
                                {log.time}
                              </p>
                            </div>
                          </div>
                          <Camera className="w-4 h-4 text-gray-400" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-gray-900 rounded-xl border border-gray-700 overflow-hidden">
                    <div className="p-4 border-b border-gray-700">
                      <h3 className="font-semibold flex items-center gap-2">
                        <Camera className="w-5 h-5 text-emerald-400" />
                        Qorovullarni Ko'rish
                      </h3>
                    </div>
                    <div className="max-h-[500px] overflow-y-auto">
                      {guardMarkers.map((guard) => (
                        <div
                          key={guard.id}
                          onClick={() => setSelectedGuard(guard.id)}
                          className={`p-4 border-b border-gray-800 cursor-pointer transition-all ${
                            selectedGuard === guard.id
                              ? "bg-emerald-500/20 border-l-2 border-l-emerald-400"
                              : "hover:bg-gray-800"
                          }`}
                        >
                          <div className="flex gap-3 items-start">
                            <img
                              src={guard.image}
                              alt={guard.name}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm">
                                {guard.name}
                              </p>
                              <p
                                className={`text-xs ${guard.status === "active" ? "text-emerald-400" : "text-red-400"}`}
                              >
                                {guard.status === "active" ? "Faol" : "Nofaol"}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Vaqti: 14:32
                              </p>
                            </div>
                            <div
                              className={`w-2 h-2 rounded-full flex-shrink-0 mt-1 ${guard.status === "active" ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {selectedGuard && (
                    <div className="bg-gray-900 rounded-xl border border-emerald-500/30 overflow-hidden">
                      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                        <h3 className="font-semibold">Live Fotosuratlar</h3>
                        <button
                          onClick={() => setSelectedGuard(null)}
                          className="text-gray-400 hover:text-white"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="p-4 space-y-3">
                        <div className="relative group">
                          <img
                            src="/GuardMeasure.jpeg"
                            alt="Foto 1"
                            className="w-full h-32 rounded-lg object-cover border border-gray-700 group-hover:border-emerald-400/50 transition-all"
                          />
                          <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-1 rounded text-xs text-gray-300">
                            14:32
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative py-24 bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">
            Asosiy <span className="text-emerald-400">afzalliklar</span>
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Activity,
                title: "Real vaqt nazorat",
                desc: "Har bir harakatni darhol kuzating",
              },
              {
                icon: Radio,
                title: "NFC orqali tekshiruv",
                desc: "Zamonaviy texnologiya bilan himoya",
              },
              {
                icon: Camera,
                title: "Foto va vaqt isboti",
                desc: "Har bir tekshiruv hujjatlashtiriladi",
              },
              {
                icon: Bell,
                title: "Avtomatik ogohlantirish",
                desc: "Muammolarni darhol aniqlash",
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
            Xavfsizlikni yangi{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-500">
              darajaga
            </span>{" "}
            olib chiqing
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Zamonaviy monitoring tizimi bilan qorovullarni real vaqtda kuzatib
            boring va xavfsizlikni maksimal darajada oshiring
          </p>
          <button className="px-10 py-5 bg-emerald-500 hover:bg-emerald-600 rounded-xl font-semibold text-lg transition-all hover:scale-105 hover:shadow-2xl hover:shadow-emerald-500/50 inline-flex items-center gap-3 group">
            Demo olish
            <Clock className="w-6 h-6 group-hover:rotate-12 transition-transform" />
          </button>
        </div>
      </section>

      <footer className="relative py-12 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <Shield className="w-8 h-8 text-emerald-400" />
              <span className="text-xl font-bold">Guard Monitoring</span>
            </div>
            <p className="text-gray-400">
              © 2025 Guard Monitoring. Barcha huquqlar himoyalangan.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
