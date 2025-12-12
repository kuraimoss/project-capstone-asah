import React from "react";
import {
  Cpu,
  Thermometer,
  AlertTriangle,
  CheckCircle,
  Zap,
  ChevronRight,
} from "lucide-react";
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

const DashboardContent = ({
  machines,
  selectedMachine,
  chartData,
  dashboardStats,
  onSelectMachine,
}) => {
  const avgTempDisplay = `${dashboardStats.avgTempCurrent.toFixed(1)} K`;
  const tempTrendDisplay = `${dashboardStats.tempTrendPct >= 0 ? "+" : ""}${dashboardStats.tempTrendPct.toFixed(1)}%`;
  const criticalCountDisplay = dashboardStats.criticalCount.toString();
  const healthyScoreDisplay = `${dashboardStats.healthyScore.toFixed(0)}%`;

  return (
    <>
      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Machines"
          value={machines.length.toString()}
          trend="+2 Active"
          icon={Cpu}
          color="bg-blue-500"
          trendUp={true}
        />
        <StatCard
          title="Avg. Temperature"
          value={avgTempDisplay}
          trend={tempTrendDisplay}
          icon={Thermometer}
          color="bg-indigo-500"
          trendUp={dashboardStats.tempTrendPct < 0}
        />
        <StatCard
          title="Critical Alerts"
          value={criticalCountDisplay}
          trend="Needs Attention"
          icon={AlertTriangle}
          color="bg-rose-500"
          trendUp={false}
        />
        <StatCard
          title="Healthy Status"
          value={healthyScoreDisplay}
          trend="Model-based"
          icon={CheckCircle}
          color="bg-emerald-500"
          trendUp={dashboardStats.healthyScore >= 50}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Col: Charts + table */}
        <div className="lg:col-span-2 space-y-8">
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
                    <th className="px-6 py-3 font-semibold">
                      Temperature
                    </th>
                    <th className="px-6 py-3 font-semibold">Rotation</th>
                    <th className="px-6 py-3 font-semibold">Status</th>
                    <th className="px-6 py-3 font-semibold">
                      Risk Prediction
                    </th>
                    <th className="px-6 py-3 font-semibold"></th>
                  </tr>
                </thead>
                <tbody>
                  {machines.map((machine) => (
                    <MachineRow
                      key={machine.id}
                      machine={machine}
                      onSelect={onSelectMachine}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Col: Detail panel + actions */}
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
                    : selectedMachine.status === "Warning"
                    ? "bg-amber-100 text-amber-600"
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
                    {selectedMachine.wear.toFixed(2)} min
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className="bg-purple-500 h-2 rounded-full"
                    style={{
                      width: `${Math.min(
                        (selectedMachine.wear / 250) * 100,
                        100
                      )}%`,
                    }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-500">Torque Load</span>
                  <span className="font-medium">
                    {selectedMachine.torque.toFixed(2)} Nm
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className="bg-orange-500 h-2 rounded-full"
                    style={{
                      width: `${Math.min(
                        (selectedMachine.torque / 80) * 100,
                        100
                      )}%`,
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
                {selectedMachine.status === "Critical" ? (
                  <>
                    ⚠️ <strong>PERHATIAN:</strong> Model LSTM memprediksi
                    risiko kegagalan tinggi ({selectedMachine.risk}
                    %). Pola tekanan, getaran, dan RPM menunjukkan
                    anomali signifikan. Lakukan inspeksi dan maintenance
                    secepatnya untuk mencegah downtime tidak terencana.
                  </>
                ) : selectedMachine.status === "Warning" ? (
                  <>
                    ⚠️ <strong>Warning:</strong> Pola sensor menunjukkan
                    peningkatan risiko ({selectedMachine.risk}
                    %). Jadwalkan pemeriksaan komponen dan evaluasi trend
                    dalam 24–48 jam ke depan.
                  </>
                ) : (
                  <>
                    ✅ <strong>Status stabil:</strong> Pola sensor
                    konsisten dan risiko kegagalan rendah (
                    {selectedMachine.risk}
                    %). Lanjutkan pemantauan rutin dan lakukan maintenance
                    preventif sesuai jadwal.
                  </>
                )}
              </div>
            </div>
          </div>

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
    </>
  );
};

export default DashboardContent;