import React, { useState, useEffect, useRef } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import {
  Activity,
  Zap,
  Thermometer,
  AlertTriangle,
  CheckCircle,
  Bot,
  Send,
  Menu,
  Search,
  Bell,
  Settings,
  Cpu,
  Database,
  MessageSquare,
  ChevronRight,
  MoreVertical,
  LayoutDashboard,
} from "lucide-react";

// --- MOCK DATA (Diambil dari CSV Kamu untuk simulasi) ---
const INITIAL_MACHINES = [
  {
    id: 1,
    uid: "M14860",
    type: "M",
    airTemp: 298.1,
    processTemp: 308.6,
    rpm: 1551,
    torque: 42.8,
    wear: 0,
    status: "Normal",
    risk: 2,
  },
  {
    id: 2,
    uid: "L47181",
    type: "L",
    airTemp: 298.2,
    processTemp: 308.7,
    rpm: 1408,
    torque: 46.3,
    wear: 3,
    status: "Normal",
    risk: 5,
  },
  {
    id: 3,
    uid: "L47182",
    type: "L",
    airTemp: 302.1,
    processTemp: 310.5,
    rpm: 1498,
    torque: 49.4,
    wear: 5,
    status: "Warning",
    risk: 45,
  },
  {
    id: 4,
    uid: "L57154",
    type: "L",
    airTemp: 305.6,
    processTemp: 315.2,
    rpm: 1361,
    torque: 68.2,
    wear: 172,
    status: "Critical",
    risk: 92,
    failureType: "Power Failure",
  },
  {
    id: 5,
    uid: "H39392",
    type: "H",
    airTemp: 298.6,
    processTemp: 308.3,
    rpm: 1377,
    torque: 52.1,
    wear: 181,
    status: "Normal",
    risk: 12,
  },
];

// Data historis palsu untuk grafik
const generateHistory = () => {
  return Array.from({ length: 20 }, (_, i) => ({
    time: `${10 + i}:00`,
    temp: 300 + Math.random() * 10,
    rpm: 1400 + Math.random() * 200,
  }));
};

// --- COMPONENTS ---

// 1. Sidebar Component
const Sidebar = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { id: "machines", icon: Cpu, label: "Machines Assets" },
    { id: "logs", icon: Database, label: "Maintenance Logs" },
    { id: "settings", icon: Settings, label: "Settings" },
  ];

  return (
    <div className="w-20 lg:w-64 bg-slate-900 text-white flex flex-col h-screen transition-all duration-300 shadow-xl z-20 sticky top-0">
      <div className="h-16 flex items-center justify-center lg:justify-start lg:px-6 border-b border-slate-800">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-0 lg:mr-3">
          <Activity className="w-5 h-5 text-white" />
        </div>
        <span className="hidden lg:block font-bold text-lg tracking-tight">
          Mainten<span className="text-blue-400">X</span>
        </span>
      </div>

      <nav className="flex-1 py-6">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center px-4 lg:px-6 py-3 transition-colors ${
              activeTab === item.id
                ? "bg-blue-600/10 text-blue-400 border-r-4 border-blue-600"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <item.icon className="w-6 h-6 lg:w-5 lg:h-5" />
            <span className="hidden lg:block ml-3 font-medium text-sm">
              {item.label}
            </span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center justify-center lg:justify-start gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center text-xs font-bold">
            FE
          </div>
          <div className="hidden lg:block">
            <p className="text-sm font-medium">Team A25-CS057</p>
            <p className="text-xs text-slate-500">Admin Access</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// 2. Stat Card Component
const StatCard = ({ title, value, trend, icon: Icon, color, trendUp }) => (
  <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
      </div>
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
    </div>
    <div className="mt-4 flex items-center text-xs">
      <span
        className={`font-medium ${
          trendUp ? "text-emerald-600" : "text-rose-600"
        } flex items-center`}
      >
        {trend}
      </span>
      <span className="text-slate-400 ml-2">vs last week</span>
    </div>
  </div>
);

// 3. Machine Row Component
const MachineRow = ({ machine, onSelect }) => {
  const statusColor =
    machine.status === "Normal"
      ? "bg-emerald-100 text-emerald-700"
      : machine.status === "Warning"
      ? "bg-amber-100 text-amber-700"
      : "bg-rose-100 text-rose-700";

  return (
    <tr
      onClick={() => onSelect(machine)}
      className="hover:bg-slate-50 cursor-pointer border-b border-slate-100 transition-colors"
    >
      <td className="px-6 py-4 font-medium text-slate-700">#{machine.uid}</td>
      <td className="px-6 py-4 text-slate-500">{machine.type} Variant</td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <Thermometer className="w-4 h-4 text-slate-400" />
          <span className="text-slate-600">{machine.processTemp} K</span>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-slate-400" />
          <span className="text-slate-600">{machine.rpm} RPM</span>
        </div>
      </td>
      <td className="px-6 py-4">
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor}`}
        >
          {machine.status}
        </span>
      </td>
      <td className="px-6 py-4">
        <div className="w-full bg-slate-200 rounded-full h-2 max-w-[80px]">
          <div
            className={`h-2 rounded-full ${
              machine.risk > 70
                ? "bg-rose-500"
                : machine.risk > 30
                ? "bg-amber-500"
                : "bg-emerald-500"
            }`}
            style={{ width: `${machine.risk}%` }}
          ></div>
        </div>
        <span className="text-xs text-slate-400 mt-1 block">
          {machine.risk}% Risk
        </span>
      </td>
      <td className="px-6 py-4 text-right">
        <ChevronRight className="w-5 h-5 text-slate-300 inline" />
      </td>
    </tr>
  );
};

// 4. Copilot Chat Interface
const CopilotChat = ({ isOpen, toggleChat }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "bot",
      text: "Halo Engineer! Saya Predictive Maintenance Copilot. Ada yang bisa saya bantu terkait status mesin hari ini?",
    },
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { id: Date.now(), type: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    // Simulasi AI Response
    setTimeout(() => {
      let botResponse = "Maaf, saya sedang menganalisis data...";
      const lowerInput = userMsg.text.toLowerCase();

      if (lowerInput.includes("risiko") || lowerInput.includes("bahaya")) {
        botResponse =
          "Berdasarkan analisis sensor real-time, Mesin #L57154 memiliki risiko kegagalan 92% (Critical) dikarenakan anomali Torque dan Tool Wear. Disarankan inspeksi segera.";
      } else if (lowerInput.includes("rekomendasi")) {
        botResponse =
          "Rekomendasi tindakan: Jadwalkan penggantian komponen 'Tool' pada Mesin #L57154 dalam 24 jam ke depan untuk mencegah downtime tidak terencana.";
      } else {
        botResponse = `Saya mengerti Anda menanyakan tentang "${userMsg.text}". Bisa lebih spesifik mengenai ID mesin yang dimaksud?`;
      }

      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, type: "bot", text: botResponse },
      ]);
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full md:w-96 bg-white shadow-2xl border-l border-slate-200 transform transition-transform duration-300 z-50 flex flex-col">
      {/* Header */}
      <div className="h-16 bg-gradient-to-r from-blue-600 to-indigo-700 flex items-center justify-between px-6 text-white shrink-0">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5" />
          <h2 className="font-semibold">AI Copilot</h2>
        </div>
        <button onClick={toggleChat} className="p-1 hover:bg-white/20 rounded">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${
              msg.type === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg text-sm shadow-sm ${
                msg.type === "user"
                  ? "bg-blue-600 text-white rounded-br-none"
                  : "bg-white text-slate-700 border border-slate-200 rounded-bl-none"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSend}
        className="p-4 bg-white border-t border-slate-200 shrink-0"
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tanya tentang status mesin..."
            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          <button
            type="submit"
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[10px] text-slate-400 mt-2 text-center">
          AI dapat membuat kesalahan. Selalu verifikasi data.
        </p>
      </form>
    </div>
  );
};

// --- MAIN APP ---
export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [selectedMachine, setSelectedMachine] = useState(INITIAL_MACHINES[0]);
  const [chartData, setChartData] = useState(generateHistory());

  // Simulasi Real-time Data Update
  useEffect(() => {
    const interval = setInterval(() => {
      setChartData((prev) => {
        const newData = [
          ...prev.slice(1),
          {
            time: new Date().toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            }),
            temp: 300 + Math.random() * 10,
            rpm: 1400 + Math.random() * 200,
          },
        ];
        return newData;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content */}
      <div
        className={`flex-1 flex flex-col h-screen transition-all duration-300 ${
          isChatOpen && "mr-0 md:mr-96"
        }`}
      >
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-slate-800">
              {activeTab === "dashboard"
                ? "Overview Dashboard"
                : "Machine Assets"}
            </h1>
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              System Live
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search asset ID..."
                className="pl-9 pr-4 py-2 bg-slate-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
              />
            </div>
            <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-lg">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
            </button>
            {!isChatOpen && (
              <button
                onClick={() => setIsChatOpen(true)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm"
              >
                <MessageSquare className="w-4 h-4" />
                Open Copilot
              </button>
            )}
          </div>
        </header>

        {/* Dashboard Content - Scrollable */}
        <main className="flex-1 overflow-y-auto p-8">
          {/* Top Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Machines"
              value="124"
              trend="+2 Active"
              icon={Cpu}
              color="bg-blue-500"
              trendUp={true}
            />
            <StatCard
              title="Avg. Temperature"
              value="302 K"
              trend="+1.2%"
              icon={Thermometer}
              color="bg-indigo-500"
              trendUp={false}
            />
            <StatCard
              title="Critical Alerts"
              value="3"
              trend="Needs Attention"
              icon={AlertTriangle}
              color="bg-rose-500"
              trendUp={false}
            />
            <StatCard
              title="Healthy Status"
              value="94%"
              trend="Optimal"
              icon={CheckCircle}
              color="bg-emerald-500"
              trendUp={true}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Col: Charts */}
            <div className="lg:col-span-2 space-y-8">
              {/* Main Chart */}
              <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">
                      Real-time Telemetry: #{selectedMachine.uid}
                    </h3>
                    <p className="text-sm text-slate-500">
                      Monitoring RPM & Process Temperature
                    </p>
                  </div>
                  <select className="px-3 py-1 border border-slate-200 rounded-lg text-sm bg-slate-50">
                    <option>Last 1 Hour</option>
                    <option>Last 24 Hours</option>
                  </select>
                </div>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient
                          id="colorRpm"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#3b82f6"
                            stopOpacity={0.1}
                          />
                          <stop
                            offset="95%"
                            stopColor="#3b82f6"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#f1f5f9"
                      />
                      <XAxis
                        dataKey="time"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#94a3b8", fontSize: 12 }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#94a3b8", fontSize: 12 }}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "8px",
                          border: "none",
                          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="rpm"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorRpm)"
                      />
                      <Line
                        type="monotone"
                        dataKey="temp"
                        stroke="#ef4444"
                        strokeWidth={2}
                        dot={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Machine List Table */}
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="font-bold text-slate-800">Monitored Assets</h3>
                  <button className="text-sm text-blue-600 font-medium hover:underline">
                    View All
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500">
                      <tr>
                        <th className="px-6 py-3 font-semibold">UID</th>
                        <th className="px-6 py-3 font-semibold">Type</th>
                        <th className="px-6 py-3 font-semibold">Temperature</th>
                        <th className="px-6 py-3 font-semibold">Rotation</th>
                        <th className="px-6 py-3 font-semibold">Status</th>
                        <th className="px-6 py-3 font-semibold">
                          Risk Prediction
                        </th>
                        <th className="px-6 py-3 font-semibold"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {INITIAL_MACHINES.map((machine) => (
                        <MachineRow
                          key={machine.id}
                          machine={machine}
                          onSelect={setSelectedMachine}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right Col: Details Panel */}
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-4">
                  Selected Asset Detail
                </h3>
                <div className="flex items-center justify-between mb-6 p-4 bg-slate-50 rounded-lg">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">
                      Machine ID
                    </p>
                    <p className="text-xl font-mono font-bold text-slate-700">
                      {selectedMachine.uid}
                    </p>
                  </div>
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      selectedMachine.status === "Critical"
                        ? "bg-rose-100 text-rose-600"
                        : "bg-emerald-100 text-emerald-600"
                    }`}
                  >
                    {selectedMachine.status.toUpperCase()}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-500">Tool Wear</span>
                      <span className="font-medium">
                        {selectedMachine.wear} min
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div
                        className="bg-purple-500 h-2 rounded-full"
                        style={{
                          width: `${(selectedMachine.wear / 250) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-500">Torque Load</span>
                      <span className="font-medium">
                        {selectedMachine.torque} Nm
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div
                        className="bg-orange-500 h-2 rounded-full"
                        style={{
                          width: `${(selectedMachine.torque / 80) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-100">
                  <h4 className="font-semibold text-sm mb-3">
                    AI Prediction Analysis
                  </h4>
                  <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800 leading-relaxed">
                    {selectedMachine.risk > 50
                      ? `⚠️ PERHATIAN: Pola sensor menunjukkan indikasi ${
                          selectedMachine.failureType || "kerusakan"
                        }. Disarankan maintenance dalam 24 jam.`
                      : "✅ Analisis pola normal. Tidak ada anomali signifikan yang terdeteksi untuk 7 hari ke depan."}
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white p-6 rounded-xl shadow-lg">
                <h3 className="font-bold mb-4">Maintenance Actions</h3>
                <div className="space-y-3">
                  <button className="w-full py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors border border-white/10">
                    Create Maintenance Ticket
                  </button>
                  <button className="w-full py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors border border-white/10">
                    View Technical Schematic
                  </button>
                  <button className="w-full py-2 bg-rose-500/80 hover:bg-rose-600 rounded-lg text-sm transition-colors font-medium">
                    Emergency Shutdown
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Floating/Fixed Chat Interface */}
      <CopilotChat
        isOpen={isChatOpen}
        toggleChat={() => setIsChatOpen(!isChatOpen)}
      />
    </div>
  );
}
