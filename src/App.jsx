import React, { useState, useEffect, useRef } from "react";
import * as tf from "@tensorflow/tfjs";
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
  Search,
  Bell,
  Settings,
  Cpu,
  Database,
  MessageSquare,
  ChevronRight,
  LayoutDashboard,
} from "lucide-react";
import MachinesAssets from "./components/MachinesAssets";
import DashboardContent from "./components/DashboardContent";
import MaintenanceLogs from "./components/MaintenanceLogs";
import SettingsPage from "./components/Settings";
import { GoogleGenAI } from "@google/genai";

// ------------------------
// Gemini / Google Gen AI CONFIG
// ------------------------

// Ambil API key dari environment Vite (buat .env -> VITE_GEMINI_API_KEY=...)
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Client global untuk Gemini
let geminiClient = null;

if (GEMINI_API_KEY) {
  geminiClient = new GoogleGenAI({
    apiKey: GEMINI_API_KEY,
    apiVersion: "v1alpha",
  });
} else {
  console.warn(
    "VITE_GEMINI_API_KEY belum di-set. Copilot akan memakai jawaban fallback."
  );
}

// ------------------------
// Helper: generate fallback chart data
// ------------------------
const generateHistory = () => {
  return Array.from({ length: 20 }, (_, i) => ({
    time: `${10 + i}:00`,
    temp: 300 + Math.random() * 10,
    rpm: 1400 + Math.random() * 200,
  }));
};

// ------------------------
// LSTM MODEL (TFJS) + CSV PROCESSING
// ------------------------

// Cache model global supaya tidak di-load berulang
let lstmModel = null;

// Load LSTM model dari public/lstm_tfjs/model.json
const loadLSTMModel = async () => {
  try {
    if (!lstmModel) {
      lstmModel = await tf.loadLayersModel("/lstm_tfjs/model.json");
      console.log("✅ LSTM model loaded successfully");
    }
    return lstmModel;
  } catch (error) {
    console.error("❌ Error loading LSTM model:", error);
    return null;
  }
};

// Siapkan sequence time-series untuk 1 mesin (30 timestep × 4 fitur)
const prepareTimeSeriesData = (machineData) => {
  // Sort berdasarkan datetime
  const sortedData = [...machineData].sort(
    (a, b) => new Date(a.datetime) - new Date(b.datetime)
  );

  // Ambil 30 record terakhir, atau semua jika < 30
  const recentData = sortedData.slice(-30);

  // Ekstrak 4 fitur: pressure, rotate, vibration, volt
  const features = recentData.map((record) => [
    parseFloat(record.pressure),
    parseFloat(record.rotate),
    parseFloat(record.vibration),
    parseFloat(record.volt),
  ]);

  // Jika kurang dari 30, pad dengan record pertama
  while (features.length < 30 && features.length > 0) {
    features.unshift([...features[0]]);
  }

  // Jika masih kosong, pakai dummy
  if (features.length === 0) {
    const dummy = [0, 0, 0, 0];
    return Array(30).fill(dummy);
  }

  return features;
};

// Prediksi risk untuk 1 mesin menggunakan model LSTM
const predictMachineRisk = async (machineData) => {
  try {
    const model = await loadLSTMModel();
    if (!model) {
      console.warn("LSTM model not available, using random fallback risk");
      return Math.floor(Math.random() * 100);
    }

    const timeSeriesData = prepareTimeSeriesData(machineData);

    // Bentuk tensor [1, 30, 4]
    const inputTensor = tf.tensor3d([timeSeriesData], [1, 30, 4]);

    // Prediksi
    const prediction = model.predict(inputTensor);

    // Ambil output sigmoid (probabilitas 0–1)
    const predictionData = await prediction.data();
    const riskProbability = predictionData[0];

    // Konversi ke persen
    const riskPercentage = Math.round(riskProbability * 100);

    // Bersihkan tensor
    inputTensor.dispose();
    prediction.dispose();

    return riskPercentage;
  } catch (error) {
    console.error("Error making LSTM prediction:", error);
    // Fallback random jika terjadi error
    return Math.floor(Math.random() * 100);
  }
};

// Proses CSV: kumpulkan data per machineID, history, dan global stats
const processCSVDataWithPredictions = async (csvData) => {
  const lines = csvData.split("\n");
  const machineDataMap = new Map();

  // Kumpulkan semua data per machineID
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const parts = line.split(",");
    // dataset.csv: datetime, machineID, volt, rotate, pressure, vibration, model, age, failure, errorID, comp
    if (parts.length < 11) continue;

    const datetime = parts[0];
    const machineID = parts[1];
    const volt = parseFloat(parts[2]);
    const rotate = parseFloat(parts[3]);
    const pressure = parseFloat(parts[4]);
    const vibration = parseFloat(parts[5]);
    const model = parts[6];

    if (!machineDataMap.has(machineID)) {
      machineDataMap.set(machineID, []);
    }

    machineDataMap.get(machineID).push({
      datetime,
      volt,
      rotate,
      pressure,
      vibration,
      model,
    });
  }

  const machines = [];
  const historyByMachine = {};

  // Untuk global stats
  let latestTempSum = 0;
  let prevTempSum = 0;
  let latestTempCount = 0;
  let prevTempCount = 0;

  let riskSum = 0;
  let riskCount = 0;
  let criticalCount = 0;

  // Proses tiap mesin
  for (const [machineID, machineData] of machineDataMap.entries()) {
    if (machineData.length === 0) continue;

    // Sort ascending by datetime
    const sortedData = machineData.sort(
      (a, b) => new Date(a.datetime) - new Date(b.datetime)
    );

    const latestRecord = sortedData[sortedData.length - 1];
    const prevRecord =
      sortedData.length > 1 ? sortedData[sortedData.length - 2] : null;

    // Prediksi risk dengan LSTM (pakai seluruh history mesin)
    const riskPercentage = await predictMachineRisk(sortedData);
    riskSum += riskPercentage;
    riskCount += 1;

    // Tentukan status berdasarkan risk
    let status = "Normal";
    if (riskPercentage > 60) {
      status = "Critical";
    } else if (riskPercentage > 30) {
      status = "Warning";
    }
    if (status === "Critical") criticalCount += 1;

    // Global temperature stats (pakai pressure sebagai proxy temperature)
    latestTempSum += latestRecord.pressure;
    latestTempCount += 1;
    if (prevRecord) {
      prevTempSum += prevRecord.pressure;
      prevTempCount += 1;
    }

    // Simpan history untuk chart (misal 50 titik terakhir)
    const chartHistory = sortedData.slice(-50).map((record) => ({
      time: new Date(record.datetime).toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
      temp: record.pressure,
      rpm: record.rotate,
    }));
    historyByMachine[machineID] = chartHistory;

    // Buat object mesin untuk Monitored Assets
    machines.push({
      id: machines.length + 1,
      uid: machineID,
      type: latestRecord.model,
      processTemp: latestRecord.pressure, // treat as K
      rpm: latestRecord.rotate,
      wear: latestRecord.vibration, // treat as tool wear
      torque: latestRecord.volt, // treat volt as torque load proxy
      status,
      risk: riskPercentage,
      airTemp: 298 + Math.random() * 5, // just cosmetic
    });
  }

  // Hitung global stats
  const avgTempCurrent =
    latestTempCount > 0 ? latestTempSum / latestTempCount : 0;
  const avgTempPrev =
    prevTempCount > 0 ? prevTempSum / prevTempCount : avgTempCurrent;
  const tempTrendPct =
    avgTempPrev !== 0
      ? ((avgTempCurrent - avgTempPrev) / avgTempPrev) * 100
      : 0;

  const avgRisk = riskCount > 0 ? riskSum / riskCount : 0;
  const healthyScore = Math.max(0, Math.min(100, 100 - avgRisk));

  const stats = {
    avgTempCurrent,
    tempTrendPct,
    criticalCount,
    healthyScore,
  };

  return { machines, historyByMachine, stats };
};

// Load CSV + prediksi LSTM + stats
const loadCSVDataWithPredictions = async () => {
  try {
    const response = await fetch("/datasets.csv");
    const csvData = await response.text();
    return await processCSVDataWithPredictions(csvData);
  } catch (error) {
    console.error("Error loading CSV data with predictions:", error);
    // Fallback bila gagal load (dummy, tapi seharusnya tidak kepakai)
    const mockMachines = [
      {
        id: 1,
        uid: "1",
        type: "model3",
        airTemp: 298.1,
        processTemp: 113.08,
        rpm: 418.5,
        torque: 42.8,
        wear: 45.09,
        status: "Normal",
        risk: 15,
      },
    ];
    return {
      machines: mockMachines,
      historyByMachine: {
        "1": generateHistory(),
      },
      stats: {
        avgTempCurrent: 302,
        tempTrendPct: 1.2,
        criticalCount: 1,
        healthyScore: 90,
      },
    };
  }
};

// ------------------------
// UI COMPONENTS
// ------------------------

// Sidebar
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

// Stat Card
const StatCard = ({ title, value, trend, icon: Icon, color, trendUp }) => (
  <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
      </div>
      <div className={`p-2 rounded-lg ${color}`}>
        {Icon && <Icon className="w-5 h-5 text-white" />}
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

// Machine Row
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
          <span className="text-slate-600">
            {machine.processTemp.toFixed(2)} K
          </span>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-slate-400" />
          <span className="text-slate-600">{machine.rpm.toFixed(2)} RPM</span>
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

// Copilot Chat (terhubung ke Gemini) – sekarang dapat semua mesin
const CopilotChat = ({
  isOpen,
  toggleChat,
  selectedMachine,
  dashboardStats,
  totalMachines,
  machines,
}) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "bot",
      text: "Halo Engineer! Saya Predictive Maintenance Copilot. Tanyakan apa saja tentang status mesin, risiko kegagalan, atau rekomendasi maintenance.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  // Panggil Gemini API dengan konteks dashboard + SEMUA MESIN
  const askGemini = async (conversationMessages) => {
    if (!geminiClient || !GEMINI_API_KEY) {
      return "Maaf, koneksi ke Gemini API belum dikonfigurasi. Pastikan VITE_GEMINI_API_KEY sudah diset di .env.";
    }

    // Build konteks mesin terpilih
    const machineContext = selectedMachine
      ? `Mesin terpilih:
  - ID: ${selectedMachine.uid}
  - Model: ${selectedMachine.type}
  - Status: ${selectedMachine.status}
  - Risiko: ${selectedMachine.risk}%
  - Temperatur proses: ${selectedMachine.processTemp.toFixed(2)} K
  - RPM: ${selectedMachine.rpm.toFixed(2)} RPM
  - Getaran (tool wear): ${selectedMachine.wear.toFixed(2)}
  - Torque load (proxy dari volt): ${selectedMachine.torque.toFixed(2)}`
      : "Belum ada mesin yang dipilih di UI.";

    const fleetContext =
      dashboardStats && typeof totalMachines === "number"
        ? `Ringkasan fleet:
  - Total mesin: ${totalMachines}
  - Rata-rata temperatur: ${dashboardStats.avgTempCurrent.toFixed(2)} K
  - Jumlah mesin critical: ${dashboardStats.criticalCount}
  - Healthy status (model-based): ${dashboardStats.healthyScore.toFixed(0)}%`
        : "Ringkasan fleet tidak tersedia.";

    // Daftar semua mesin untuk pertanyaan seperti "kirim semua UID"
    const machinesListContext =
      machines && machines.length
        ? `Daftar ringkas semua mesin (maksimal ${machines.length}):
  ${machines
    .map(
      (m) =>
        `- UID ${m.uid} | model ${m.type} | status ${m.status} | risk ${m.risk}% | temp ${m.processTemp.toFixed(
          1
        )} K | rpm ${m.rpm.toFixed(0)}`
    )
    .join("\n")}`
        : "Daftar mesin tidak tersedia di konteks.";

    const systemInstruction = `
  Kamu adalah "MaintenX Predictive Maintenance Copilot", asisten untuk dashboard monitoring mesin industri.

  Tujuan:
  - Membantu engineer memahami kondisi mesin, risiko kegagalan, dan prioritas maintenance.
  - Fokus hanya pada konteks predictive maintenance, sensor (pressure, RPM, vibration, volt), risk %, dan health status.
  - Kamu memiliki akses ke data SEMUA mesin pada daftar di bawah ini. Kamu boleh menjawab pertanyaan seperti:
    • "kirim semua UID"
    • "mesin mana dengan risk tertinggi"
    • "berapa banyak mesin model3 yang critical"
  - Jika user bertanya di luar konteks (misal politik, gosip, topik umum non-teknis), jawab singkat bahwa kamu hanya bisa membantu terkait status mesin dan maintenance.

  Format jawaban (WAJIB):
  1. Baris pertama: satu kalimat ringkas yang merangkum jawaban.
  2. Lanjutkan 3–8 bullet point dengan simbol "• " di awal baris.
  3. JANGAN gunakan markdown seperti **tebal**, _miring_, \`code\`, atau bullet dengan "-" / "*".
  4. Hindari paragraf panjang; utamakan poin-poin rapi.

  Bahasa:
  - Gunakan Bahasa Indonesia yang sopan dan mudah dipahami teknisi lapangan.

  Konteks data terbaru dari dashboard:
  ${machineContext}

  ${fleetContext}

  ${machinesListContext}
  `.trim();

    // Ubah riwayat chat menjadi format contents
    const historyContents = conversationMessages.map((m) => ({
      role: m.type === "user" ? "user" : "model",
      parts: [{ text: m.text }],
    }));

    const contents = [
      {
        role: "user",
        parts: [{ text: systemInstruction }],
      },
      ...historyContents,
    ];

    try {
      const response = await geminiClient.models.generateContent({
        model: "gemini-2.5-flash",
        contents,
      });

      const candidates =
        response?.candidates || response?.response?.candidates || [];
      let rawText = "";

      if (candidates.length > 0) {
        const parts = candidates[0].content?.parts || [];
        rawText =
          parts
            .map((p) => p.text || "")
            .join("")
            .trim() || "";
      }

      if (!rawText && response?.text) {
        // fallback kalau SDK punya helper .text
        rawText = response.text;
      }

      // CLEANUP: buang markdown & rapikan bullet
      const cleanText = (rawText || "")
        .replace(/\*\*/g, "") // hapus **
        .replace(/^\s*[-*]\s+/gm, "• ") // bullet rapi
        .replace(/\n{3,}/g, "\n\n") // rapikan newline
        .trim();

      return (
        cleanText ||
        "Maaf, Copilot tidak bisa mendapatkan jawaban dari model saat ini. Coba ulangi beberapa saat lagi."
      );
    } catch (error) {
      console.error("Error calling Gemini API:", error);
      return "Terjadi error saat menghubungi Gemini API. Pastikan API key valid dan koneksi internet stabil.";
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isSending) return;

    const userMsg = { id: Date.now(), type: "user", text: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsSending(true);

    const botText = await askGemini(newMessages);
    const botMsg = { id: Date.now() + 1, type: "bot", text: botText };
    setMessages((prev) => [...prev, botMsg]);
    setIsSending(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full md:w-96 bg-white shadow-2xl border-l border-slate-200 transform transition-transform duration-300 z-50 flex flex-col">
      <div className="h-16 bg-gradient-to-r from-blue-600 to-indigo-700 flex items-center justify-between px-6 text-white shrink-0">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5" />
          <h2 className="font-semibold">AI Copilot</h2>
        </div>
        <button onClick={toggleChat} className="p-1 hover:bg-white/20 rounded">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

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
                  : "bg-white text-slate-700 border border-slate-200 rounded-bl-none whitespace-pre-line"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {isSending && (
          <div className="flex justify-start">
            <div className="max-w-[80%] p-3 rounded-lg text-sm shadow-sm bg-white text-slate-500 border border-slate-200 rounded-bl-none italic">
              Copilot sedang menganalisis data mesin...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

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
            disabled={isSending}
            className={`p-2 rounded-lg text-white transition-colors ${
              isSending
                ? "bg-slate-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[10px] text-slate-400 mt-2 text-center">
          AI dapat membuat kesalahan. Selalu verifikasi data sebelum mengambil
          tindakan.
        </p>
      </form>
    </div>
  );
};

// ------------------------
// MAIN APP
// ------------------------
export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [machines, setMachines] = useState([]);
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [chartData, setChartData] = useState(generateHistory());
  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [machineHistory, setMachineHistory] = useState({});
  const [searchQuery, setSearchQuery] = useState("");

  // Load CSV + prediksi LSTM saat mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const {
          machines: machinesFromCsv,
          historyByMachine,
          stats,
        } = await loadCSVDataWithPredictions();

        setMachines(machinesFromCsv);
        setMachineHistory(historyByMachine);
        setDashboardStats(stats);

        if (machinesFromCsv.length > 0) {
          const first = machinesFromCsv[0];
          setSelectedMachine(first);
          const history = historyByMachine[first.uid];
          setChartData(history && history.length ? history : generateHistory());
        }
      } catch (error) {
        console.error("Error initializing machines:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Update chart saat selectedMachine berubah
  useEffect(() => {
    if (!selectedMachine) return;
    const history = machineHistory[selectedMachine.uid];
    if (history && history.length) {
      setChartData(history);
    }
  }, [selectedMachine, machineHistory]);

  // Settings page doesn't require machine data, so allow it to render even during loading
  if (activeTab !== "settings" && (loading || !selectedMachine || !dashboardStats)) {
    return (
      <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <div className="flex-1 flex flex-col h-screen">
          <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-slate-800">
                {activeTab === "dashboard"
                  ? "Overview Dashboard"
                  : activeTab === "machines"
                  ? "Machine Assets"
                  : activeTab === "logs"
                  ? "Maintenance Logs"
                  : "Settings"}
              </h1>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto p-8">
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              <span className="ml-4 text-slate-600">
                Loading machine data & predictions...
              </span>
            </div>
          </main>
        </div>
      </div>
    );
  }


  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div
        className={`flex-1 flex flex-col h-screen transition-all duration-300 ${
          isChatOpen && "mr-0 md:mr-96"
        }`}
      >
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-slate-800">
              {activeTab === "dashboard"
                ? "Overview Dashboard"
                : activeTab === "machines"
                ? "Machine Assets"
                : activeTab === "logs"
                ? "Maintenance Logs"
                : "Settings"}
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
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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

        <main className="flex-1 overflow-y-auto p-8">
          {activeTab === "machines" ? (
            <MachinesAssets
              machines={machines}
              onSelectMachine={setSelectedMachine}
              onSearch={setSearchQuery}
              searchQuery={searchQuery}
            />
          ) : activeTab === "logs" ? (
            <MaintenanceLogs
              machines={machines}
              searchQuery={searchQuery}
            />
          ) : activeTab === "settings" ? (
            <SettingsPage />
          ) : (
            <DashboardContent
              machines={machines}
              selectedMachine={selectedMachine}
              chartData={chartData}
              dashboardStats={dashboardStats}
              onSelectMachine={setSelectedMachine}
            />
          )}
        </main>
      </div>

      <CopilotChat
        isOpen={isChatOpen}
        toggleChat={() => setIsChatOpen(!isChatOpen)}
        selectedMachine={selectedMachine}
        dashboardStats={dashboardStats}
        totalMachines={machines.length}
        machines={machines}
      />
    </div>
  );
}
