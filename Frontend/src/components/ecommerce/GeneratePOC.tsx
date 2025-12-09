import { useState, useEffect } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { Box, Button, TextField } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close"; 

const GeneratePOCModal = ({ onClose, onSelect }: any) => {
  const [tasks, setTasks] = useState<any[]>([]);
  const apiUrl = import.meta.env.VITE_API_URL;
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/tasks/list`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        credentials: "include",
      });
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // -----------------------------
  // MUI DataGrid Columns
  // -----------------------------
  const columns = [
    {
      field: "projectCode",
      headerName: "Project Code",
      flex: 1,
    },
    {
      field: "title",
      headerName: "Title",
      flex: 1.5,
    },
    {
      field: "pocFile",
      headerName: "POC File",
      flex: 1,
      renderCell: (params: any) =>
        params.row.hasPOC ? (
          <a
            href={`${apiUrl}/poc/docx/${params.row.pocId}`}
            target="_blank"
            style={{ color: "#1976d2", textDecoration: "underline" }}
          >
            Download
          </a>
        ) : (
          <span style={{ color: "#777" }}>Not Generated</span>
        ),
    },
    {
      field: "action",
      headerName: "Action",
      flex: 1,
      sortable: false,
      renderCell: (params: any) => (
        <Button
          variant="contained"
          color="primary"
          size="small"
          onClick={() => onSelect(params.row._id)}
        >
          Select
        </Button>
      ),
    },
  ];

  // -----------------------------
  // Filter rows by search input
  // -----------------------------
  const filteredTasks = tasks.filter((t: any) =>
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.projectCode.toLowerCase().includes(search.toLowerCase()) ||
    (t.assignedBy?.name || "")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600 border-solid"></div>
      </div>
    );
  }

  return (

    <div className="fixed inset-x-0 top-20  bg-opacity-30 backdrop-blur-sm flex items-start justify-center z-50 p-4">
      <div className="bg-white p-4 md:p-6 rounded-lg w-full md:w-4/5 lg:w-3/5 max-h-[80vh] flex flex-col shadow-xl border border-gray-300">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
          <h2 className="text-lg md:text-xl font-bold text-[#3C01AF] mb-2 md:mb-0">
            Select Task For POC
          </h2>
          <Button
            variant="outlined"
            color="secondary"
            onClick={onClose}
            sx={{ mt: 0 }}
          >
            <CloseIcon />
          </Button>
        </div>

        {/* Search Box */}
        <div className="mb-4">
          <TextField
            fullWidth
            label="Search by title, project code, or assigned by..."
            variant="outlined"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Scrollable DataGrid */}
        <div className="flex-1 min-h-0 overflow-auto">
          <Box sx={{ width: "100%", height: "100%" }}>
            <DataGrid
              rows={filteredTasks}
              columns={columns}
              pageSizeOptions={[10, 20, 30]}
              initialState={{
                pagination: {
                  paginationModel: { pageSize: 10, page: 0 },
                },
              }}
              pagination
              getRowId={(row) => row._id}
              disableColumnResize
              disableColumnMenu
              disableColumnSelector
              disableColumnFilter
              disableRowSelectionOnClick
              hideFooterSelectedRowCount
              sx={{
                border: "1px solid #ccc",
                fontSize: "14px",
                "& .MuiDataGrid-row": { backgroundColor: "#f9fafb" },
                "& .MuiDataGrid-cell:focus, & .MuiDataGrid-row:focus": { outline: "none" },
                "& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeaderTitleContainer:focus": { outline: "none" },
              }}
            />
          </Box>
        </div>

      </div>
    </div>


  );
};

export default GeneratePOCModal;

