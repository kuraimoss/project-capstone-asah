import React from "react";
import {
  Cpu,
  Thermometer,
  Zap,
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  Search,
  Plus,
  Edit,
  Trash2,
  Filter,
  Download,
} from "lucide-react";

const MachinesAssets = ({
  machines,
  onSelectMachine,
  onSearch,
  searchQuery,
}) => {
  // Filter machines based on search query
  const filteredMachines = machines.filter((machine) =>
    machine.uid.toLowerCase().includes(searchQuery.toLowerCase()) ||
    machine.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    machine.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Status filter options
  const statusFilters = ["All", "Normal", "Warning", "Critical"];
  const [selectedStatus, setSelectedStatus] = React.useState("All");

  const filteredByStatus = selectedStatus === "All"
    ? filteredMachines
    : filteredMachines.filter(machine => machine.status === selectedStatus);

  // Get status colors
  const getStatusColor = (status) => {
    switch (status) {
      case "Normal":
        return "bg-emerald-100 text-emerald-700";
      case "Warning":
        return "bg-amber-100 text-amber-700";
      case "Critical":
        return "bg-rose-100 text-rose-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  // Get risk bar color
  const getRiskBarColor = (risk) => {
    if (risk > 70) return "bg-rose-500";
    if (risk > 30) return "bg-amber-500";
    return "bg-emerald-500";
  };

  return (
    <div className="space-y-6">
      {/* Header with search and actions */}
      <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Machines Assets</h2>
            <p className="text-sm text-slate-500">
              Manage and monitor all your industrial machines
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by UID, type, or status..."
                value={searchQuery}
                onChange={(e) => onSearch(e.target.value)}
                className="pl-9 pr-4 py-2 bg-slate-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
              />
            </div>

            <div className="flex gap-2">
              <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg border border-slate-200">
                <Filter className="w-5 h-5" />
              </button>
              <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg border border-slate-200">
                <Download className="w-5 h-5" />
              </button>
              <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm">
                <Plus className="w-4 h-4" />
                Add Machine
              </button>
            </div>
          </div>
        </div>

        {/* Status filter tabs */}
        <div className="mt-6 flex flex-wrap gap-2">
          {statusFilters.map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedStatus === status
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Machines Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredByStatus.length > 0 ? (
          filteredByStatus.map((machine) => (
            <div
              key={machine.id}
              onClick={() => onSelectMachine(machine)}
              className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Cpu className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">Machine #{machine.uid}</h3>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">
                      {machine.type} Variant
                    </p>
                  </div>
                </div>

                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(machine.status)}`}>
                  {machine.status}
                </span>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Thermometer className="w-4 h-4" />
                    <span>Temperature</span>
                  </div>
                  <span className="font-medium text-slate-700">
                    {machine.processTemp.toFixed(2)} K
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Zap className="w-4 h-4" />
                    <span>Rotation</span>
                  </div>
                  <span className="font-medium text-slate-700">
                    {machine.rpm.toFixed(2)} RPM
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Risk Level</span>
                  </div>
                  <span className="font-medium text-slate-700">
                    {machine.risk}%
                  </span>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-xs text-slate-500 mb-1">Risk Prediction</p>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className={`${getRiskBarColor(machine.risk)} h-2 rounded-full`}
                    style={{ width: `${machine.risk}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                <button className="text-sm text-blue-600 font-medium hover:underline flex items-center gap-1">
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button className="text-sm text-rose-600 font-medium hover:underline flex items-center gap-1">
                  <Trash2 className="w-4 h-4" />
                  Remove
                </button>
                <ChevronRight className="w-5 h-5 text-slate-300" />
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12 bg-slate-50 rounded-xl">
            <p className="text-slate-500 mb-4">No machines found matching your criteria</p>
            <button
              onClick={() => {
                setSelectedStatus("All");
                onSearch("");
              }}
              className="text-blue-600 hover:underline font-medium"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Fleet Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-sm text-slate-500">Total Machines</p>
            <p className="text-2xl font-bold text-slate-800">{machines.length}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-slate-500">Normal</p>
            <p className="text-2xl font-bold text-emerald-600">
              {machines.filter(m => m.status === "Normal").length}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-slate-500">Warning</p>
            <p className="text-2xl font-bold text-amber-600">
              {machines.filter(m => m.status === "Warning").length}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-slate-500">Critical</p>
            <p className="text-2xl font-bold text-rose-600">
              {machines.filter(m => m.status === "Critical").length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MachinesAssets;