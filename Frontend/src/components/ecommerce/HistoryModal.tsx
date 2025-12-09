import React, { useEffect, useState } from "react";
import { FiUser, FiClock } from "react-icons/fi";
import { Modal, Box, Typography, Table, TableHead, TableBody, TableRow, TableCell } from "@mui/material";
import axios from "axios";

import { Layers } from "lucide-react";


interface HistoryModalProps {
  open: boolean;
  onClose: () => void;
  task: any;
  domainName: string;
}


const HistoryModal: React.FC<HistoryModalProps> = ({ open, onClose, task, domainName }) => {
  const [logs, setLogs] = useState<Record<string, any[]>>({});

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    if (task?._id && domainName && open) {
      //console.log("Fetching logs for task:", task._id, "domain:", domainName);


      axios.get(
        `${import.meta.env.VITE_API_URL}/activity/${task._id}/logs/${encodeURIComponent(domainName)}`
      )

        .then((res) => {
          setLogs(res.data || []);
        })
        .catch((err) => {
          console.error("Failed to fetch logs:", err);
          setLogs([]);
        })
        .finally(() => setLoading(false));
    }
  }, [task, open, domainName]);

  const decodedDomain = decodeURIComponent(domainName || "");




  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-indigo-600 border-solid"></div>
      </div>
    );



  return (
    <Modal
      open={open}
      onClose={onClose}
      container={document.body}   // ✅ force modal to render at top-level
      disablePortal={false}       // ✅ ensures it's outside any layout wrappers
      sx={{ zIndex: 9999 }}
      BackdropProps={{
        sx: {
          backgroundColor: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(3px)",
        },
      }}
    >
      <Box
        className="bg-white rounded-lg shadow-xl p-6"
        sx={{
          width: { xs: "90%", md: "600px" },
          margin: "100px auto",
          outline: "none",
          maxHeight: "80vh",
          overflowY: "auto",
        }}
      >
        <div className="flex justify-between items-center mb-4">
          <Typography variant="h6" className="font-bold text-gray-800 flex items-center gap-2">
            <Layers className="text-purple-500" /> Platform Action History
          </Typography>
          {/* <IconButton onClick={onClose}>
            <X className="text-gray-600" />
          </IconButton> */}
        </div>

        <Typography className="mb-3 text-sm text-gray-600 flex items-center gap-2">

          <span className="font-semibold text-gray-900">🧩 {decodedDomain}</span>
        </Typography>

        <Table>
          <TableHead>
            <TableRow className="bg-gray-100">
              <TableCell><strong>Action</strong></TableCell>
              <TableCell><strong>Changed By</strong></TableCell>
              <TableCell><strong>Timestamp</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody> 
            {logs && logs.length > 0 ? (
              logs.map((log, i) => {
                const actionColors: Record<string, string> = {
                  "Task Created": "text-green-600 bg-green-50",
                  "Task Updated": "text-blue-600 bg-blue-50",
                  "Task Submitted": "text-purple-600 bg-purple-50",
                  "Status Update to In-R&D": "text-orange-600 bg-orange-50",
                  "Domain submission edited": "text-gray-600 bg-gray-100",
                  "Task Reopened": "text-gray-600 bg-gray-100",
                  "Domain Terminated": "text-red-600 bg-red-50",
                };

                const colorClass =
                  actionColors[log.action] || "text-gray-700 bg-gray-100";

                return (
                  <TableRow key={i} className="hover:bg-gray-50 transition-all">
                    <TableCell>
                      <div
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full font-medium text-sm ${colorClass}`}
                      >
                        {log.action === "Task Created" && "➕"}
                        {log.action === "Task Updated" && "✏️"}
                        {log.action === "Task Submitted" && "📤"}
                        {log.action === "Status Update to In-R&D" && "🔄"}
                        {log.action === "Domain submission edited" && "✏️"}
                        {log.action === "Task Reopened" && "🔄"}
                        {log.action === "Domain Terminated" && "❌"}

                        <span>{log.action}</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2 text-gray-700">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100">
                          <FiUser className="text-gray-600" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-sm">{log.changedBy}</span>
                          <span className="text-xs text-gray-500">{log.role}</span>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2 text-gray-600">
                        <FiClock className="text-gray-500" size={15} />
                        <span className="text-sm">
                          {new Date(log.timestamp).toLocaleString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-6 text-gray-500">
                  No history available
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded-md text-gray-700 hover:bg-gray-300 transition"
          >
            Close
          </button>
        </div>
      </Box>
    </Modal>
  );
};

export default HistoryModal;
