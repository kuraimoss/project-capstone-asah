import React, { useState, useEffect, Fragment } from "react";
import { Search, Filter, Calendar, Clock, User, Wrench, CheckCircle, AlertTriangle, XCircle, ChevronDown, ChevronUp, Plus, Database } from "lucide-react";

const MaintenanceLogs = ({ machines, searchQuery }) => {
  // Generate mock maintenance logs data
  const generateMockLogs = () => {
    const statuses = ["Completed", "Pending", "Overdue", "In Progress"];
    const types = ["Preventive", "Corrective", "Predictive", "Routine"];
    const technicians = ["John D.", "Sarah M.", "Mike T.", "Anna K.", "David L."];

    const logs = [];
    const now = new Date();

    // Create logs for each machine
    machines.forEach((machine) => {
      // Create 2-5 logs per machine
      const logCount = Math.floor(Math.random() * 4) + 2;

      for (let i = 0; i < logCount; i++) {
        const daysAgo = Math.floor(Math.random() * 30);
        const logDate = new Date(now);
        logDate.setDate(now.getDate() - daysAgo);

        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const type = types[Math.floor(Math.random() * types.length)];
        const technician = technicians[Math.floor(Math.random() * technicians.length)];

        // Determine duration based on status
        let durationHours;
        if (status === "Completed") {
          durationHours = Math.floor(Math.random() * 8) + 1;
        } else if (status === "In Progress") {
          durationHours = Math.floor(Math.random() * 4) + 1;
        } else {
          durationHours = Math.floor(Math.random() * 3) + 1;
        }

        logs.push({
          id: `LOG-${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
          machineId: machine.uid,
          machineName: `${machine.type} #${machine.uid}`,
          status,
          type,
          technician,
          date: logDate,
          duration: durationHours,
          description: getRandomDescription(type, machine),
          priority: getPriority(status, machine.status),
        });
      }
    });

    // Sort by date (newest first)
    return logs.sort((a, b) => b.date - a.date);
  };

  const getRandomDescription = (type, machine) => {
    const descriptions = {
      Preventive: [
        `Scheduled ${type} maintenance for ${machine.type} machine. Included lubrication, filter replacement, and system diagnostics.`,
        `${type} maintenance performed on ${machine.type}. All components inspected and calibrated according to manufacturer specifications.`,
        `Routine ${type} maintenance completed. Replaced wear parts, checked alignments, and verified sensor calibrations.`,
      ],
      Corrective: [
        `Emergency ${type} maintenance due to ${machine.status.toLowerCase()} status. Replaced faulty sensor and recalibrated system.`,
        `${type} maintenance to address unexpected vibration. Found and replaced worn bearing assembly.`,
        `Urgent ${type} maintenance performed. Resolved hydraulic pressure issue and replaced damaged seals.`,
      ],
      Predictive: [
        `AI-driven ${type} maintenance based on LSTM predictions (${machine.risk}% risk). Prevented potential failure.`,
        `${type} maintenance triggered by anomaly detection. Addressed early signs of component degradation.`,
        `Data-driven ${type} maintenance. Replaced components showing abnormal wear patterns before failure.`,
      ],
      Routine: [
        `Daily ${type} inspection and cleaning. Verified all systems operational.`,
        `${type} maintenance check. Lubricated moving parts and verified safety systems.`,
        `Standard ${type} maintenance procedure completed. All readings within normal parameters.`,
      ],
    };

    return descriptions[type][Math.floor(Math.random() * descriptions[type].length)];
  };

  const getPriority = (status, machineStatus) => {
    if (status === "Overdue" || (status === "Pending" && machineStatus === "Critical")) {
      return "High";
    } else if (status === "In Progress" || machineStatus === "Warning") {
      return "Medium";
    } else if (status === "Pending") {
      return "Low";
    } else {
      return "Completed";
    }
  };

  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [sortConfig, setSortConfig] = useState({ key: "date", direction: "desc" });
  const [expandedLog, setExpandedLog] = useState(null);

  // Apply filters function
  const applyFilters = (logData, status, type, priority, search) => {
    let result = [...logData];

    // Apply status filter
    if (status !== "All") {
      result = result.filter(log => log.status === status);
    }

    // Apply type filter
    if (type !== "All") {
      result = result.filter(log => log.type === type);
    }

    // Apply priority filter
    if (priority !== "All") {
      result = result.filter(log => log.priority === priority);
    }

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(log =>
        log.id.toLowerCase().includes(searchLower) ||
        log.machineId.toLowerCase().includes(searchLower) ||
        log.machineName.toLowerCase().includes(searchLower) ||
        log.technician.toLowerCase().includes(searchLower) ||
        log.description.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });

    setFilteredLogs(result);
  };

  // Initialize logs when machines change
  useEffect(() => {
    if (machines.length > 0) {
      const generatedLogs = generateMockLogs();
      setLogs(generatedLogs);
      // Apply filters with the new logs
      applyFilters(generatedLogs, statusFilter, typeFilter, priorityFilter, searchQuery);
    }
  }, [machines]);

  // Apply filters whenever filter criteria or search query changes
  useEffect(() => {
    if (logs.length > 0) {
      applyFilters(logs, statusFilter, typeFilter, priorityFilter, searchQuery);
    }
  }, [statusFilter, typeFilter, priorityFilter, searchQuery]);


  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Completed": return "bg-emerald-100 text-emerald-700";
      case "Pending": return "bg-amber-100 text-amber-700";
      case "Overdue": return "bg-rose-100 text-rose-700";
      case "In Progress": return "bg-blue-100 text-blue-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "High": return "bg-rose-100 text-rose-700";
      case "Medium": return "bg-amber-100 text-amber-700";
      case "Low": return "bg-blue-100 text-blue-700";
      case "Completed": return "bg-emerald-100 text-emerald-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "Preventive": return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case "Corrective": return <Wrench className="w-4 h-4 text-amber-500" />;
      case "Predictive": return <AlertTriangle className="w-4 h-4 text-blue-500" />;
      case "Routine": return <Calendar className="w-4 h-4 text-slate-500" />;
      default: return <Wrench className="w-4 h-4 text-slate-500" />;
    }
  };

  // Calculate statistics
  const totalLogs = filteredLogs.length;
  const completedLogs = filteredLogs.filter(log => log.status === "Completed").length;
  const overdueLogs = filteredLogs.filter(log => log.status === "Overdue").length;

  const completionRate = totalLogs > 0 ? Math.round((completedLogs / totalLogs) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Total Logs</p>
              <h3 className="text-2xl font-bold text-slate-800">{totalLogs}</h3>
            </div>
            <div className="p-2 rounded-lg bg-blue-500">
              <Calendar className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs">
            <span className="font-medium text-emerald-600 flex items-center">
              {totalLogs > 0 ? `+${totalLogs} recorded` : "No logs"}
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Completion Rate</p>
              <h3 className="text-2xl font-bold text-slate-800">{completionRate}%</h3>
            </div>
            <div className="p-2 rounded-lg bg-emerald-500">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs">
            <span className={`font-medium ${completionRate >= 80 ? "text-emerald-600" : "text-amber-600"} flex items-center`}>
              {completionRate >= 80 ? "On track" : "Needs attention"}
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Overdue Tasks</p>
              <h3 className="text-2xl font-bold text-slate-800">{overdueLogs}</h3>
            </div>
            <div className="p-2 rounded-lg bg-rose-500">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs">
            <span className={`font-medium ${overdueLogs === 0 ? "text-emerald-600" : "text-rose-600"} flex items-center`}>
              {overdueLogs === 0 ? "All up to date" : "Urgent attention needed"}
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Avg. Duration</p>
              <h3 className="text-2xl font-bold text-slate-800">
                {totalLogs > 0 ? `${Math.round(filteredLogs.reduce((sum, log) => sum + log.duration, 0) / totalLogs)}h` : "0h"}
              </h3>
            </div>
            <div className="p-2 rounded-lg bg-indigo-500">
              <Clock className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs">
            <span className="font-medium text-slate-600 flex items-center">
              {totalLogs > 0 ? "Maintenance time" : "No data"}
            </span>
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">Maintenance Logs</h2>

          <div className="flex flex-wrap gap-3">
            {/* Status Filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-3 pr-8 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="All">All Status</option>
                <option value="Completed">Completed</option>
                <option value="Pending">Pending</option>
                <option value="Overdue">Overdue</option>
                <option value="In Progress">In Progress</option>
              </select>
              <Filter className="w-4 h-4 absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {/* Type Filter */}
            <div className="relative">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="pl-3 pr-8 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="All">All Types</option>
                <option value="Preventive">Preventive</option>
                <option value="Corrective">Corrective</option>
                <option value="Predictive">Predictive</option>
                <option value="Routine">Routine</option>
              </select>
              <Filter className="w-4 h-4 absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {/* Priority Filter */}
            <div className="relative">
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="pl-3 pr-8 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="All">All Priorities</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
                <option value="Completed">Completed</option>
              </select>
              <Filter className="w-4 h-4 absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {/* Create New Button */}
            <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm">
              <Plus className="w-4 h-4" />
              Create Log
            </button>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-6 py-3 font-semibold">Log ID</th>
                <th className="px-6 py-3 font-semibold">Machine</th>
                <th className="px-6 py-3 font-semibold">
                  <button onClick={() => requestSort("type")} className="flex items-center gap-1">
                    Type {getSortIndicator("type")}
                  </button>
                </th>
                <th className="px-6 py-3 font-semibold">
                  <button onClick={() => requestSort("status")} className="flex items-center gap-1">
                    Status {getSortIndicator("status")}
                  </button>
                </th>
                <th className="px-6 py-3 font-semibold">
                  <button onClick={() => requestSort("priority")} className="flex items-center gap-1">
                    Priority {getSortIndicator("priority")}
                  </button>
                </th>
                <th className="px-6 py-3 font-semibold">
                  <button onClick={() => requestSort("date")} className="flex items-center gap-1">
                    Date {getSortIndicator("date")}
                  </button>
                </th>
                <th className="px-6 py-3 font-semibold">
                  <button onClick={() => requestSort("duration")} className="flex items-center gap-1">
                    Duration {getSortIndicator("duration")}
                  </button>
                </th>
                <th className="px-6 py-3 font-semibold">Technician</th>
                <th className="px-6 py-3 font-semibold"></th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <React.Fragment key={log.id}>
                    <tr className="hover:bg-slate-50 cursor-pointer border-b border-slate-100 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-700">{log.id}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-600">{log.machineName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(log.type)}
                          <span className="text-slate-600">{log.type}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(log.status)}`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(log.priority)}`}>
                          {log.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {log.date.toLocaleDateString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric"
                        })}
                      </td>
                      <td className="px-6 py-4 text-slate-600">{log.duration}h</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-slate-400" />
                          <span className="text-slate-600">{log.technician}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                          className="p-1 text-slate-400 hover:text-slate-600"
                        >
                          {expandedLog === log.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </button>
                      </td>
                    </tr>

                    {/* Expanded Details */}
                    {expandedLog === log.id && (
                      <tr className="border-b border-slate-100">
                        <td colSpan="9" className="p-6 bg-slate-50">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <h4 className="font-semibold text-slate-800 mb-2">Description</h4>
                              <p className="text-sm text-slate-600 leading-relaxed">
                                {log.description}
                              </p>

                              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p className="text-slate-500">Machine ID</p>
                                  <p className="font-medium text-slate-700">{log.machineId}</p>
                                </div>
                                <div>
                                  <p className="text-slate-500">Completion Date</p>
                                  <p className="font-medium text-slate-700">
                                    {log.date.toLocaleDateString("id-ID", {
                                      day: "2-digit",
                                      month: "long",
                                      year: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit"
                                    })}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-4">
                              <div>
                                <h4 className="font-semibold text-slate-800 mb-2">Actions</h4>
                                <div className="space-y-2">
                                  <button className="w-full py-2 px-4 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
                                    View Details
                                  </button>
                                  <button className="w-full py-2 px-4 bg-white text-blue-600 text-sm rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors">
                                    Edit Log
                                  </button>
                                  <button className="w-full py-2 px-4 bg-white text-rose-600 text-sm rounded-lg border border-rose-200 hover:bg-rose-50 transition-colors">
                                    Delete Log
                                  </button>
                                </div>
                              </div>

                              <div>
                                <h4 className="font-semibold text-slate-800 mb-2">Attachments</h4>
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2 p-2 bg-white border border-slate-200 rounded-lg">
                                    <span className="text-blue-600">📄</span>
                                    <span className="text-sm text-slate-600">Maintenance_Report.pdf</span>
                                  </div>
                                  <div className="flex items-center gap-2 p-2 bg-white border border-slate-200 rounded-lg">
                                    <span className="text-blue-600">📸</span>
                                    <span className="text-sm text-slate-600">Before_After_Photos.zip</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="text-center py-8">
                    <div className="flex flex-col items-center justify-center gap-4">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                        <Database className="w-8 h-8 text-slate-400" />
                      </div>
                      <p className="text-slate-500">No maintenance logs found matching your criteria.</p>
                      <p className="text-sm text-slate-400">Try adjusting your filters or search terms.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceLogs;