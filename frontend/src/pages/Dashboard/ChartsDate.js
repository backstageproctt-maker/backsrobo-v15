import React, { useEffect, useState, useContext } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import brLocale from "date-fns/locale/pt-BR";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { Button, Grid, TextField, Paper, Typography, Box, CircularProgress, Divider } from "@mui/material";
import api from "../../services/api";
import { format } from "date-fns";
import { toast } from "react-toastify";
import { i18n } from "../../translate/i18n";
import { AuthContext } from "../../context/Auth/AuthContext";

// 🔹 Tema v4 (igual ao login) para pegar a cor whitelabel
import { useTheme as useThemeV4 } from "@material-ui/core/styles";
// 🔹 Mantemos o tema v5 para demais tokens (tooltip, textos, etc.)
import { useTheme as useThemeV5 } from "@mui/material/styles";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export const ChartsDate = () => {
  const themeV5 = useThemeV5();
  const themeV4 = useThemeV4();

  const PRIMARY_MAIN = themeV4?.palette?.primary?.main || "#1976d2";
  const PRIMARY_DARK = themeV4?.palette?.primary?.dark || "#115293";
  const PRIMARY_CONTRAST = themeV4?.palette?.primary?.contrastText || "#fff";

  const [initialDate, setInitialDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [finalDate, setFinalDate] = useState(new Date());
  const [ticketsData, setTicketsData] = useState({ data: [], count: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useContext(AuthContext);
  const companyId = user.companyId;

  useEffect(() => {
    if (companyId) handleGetTicketsInformation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  const handleGetTicketsInformation = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get(
        `/dashboard/ticketsDay?initialDate=${format(initialDate, "yyyy-MM-dd")}&finalDate=${format(finalDate, "yyyy-MM-dd")}&companyId=${companyId}`
      );
      setTicketsData(data);
    } catch {
      toast.error("Erro ao buscar informações dos tickets");
    } finally {
      setIsLoading(false);
    }
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        titleColor: "#111",
        bodyColor: "#444",
        borderColor: "rgba(0,0,0,0.05)",
        borderWidth: 1,
        boxPadding: 10,
        padding: 12,
        usePointStyle: true,
        cornerRadius: 12,
        callbacks: {
          label: (context) => ` Atendimentos: ${context.parsed.y}`
        }
      },
    },
    scales: {
      x: { 
        grid: { display: false },
        ticks: { color: "#999", font: { weight: 600 } }
      },
      y: { 
        grid: { color: "rgba(0,0,0,0.03)", drawBorder: false },
        ticks: { color: "#999", font: { weight: 600 }, stepSize: 1 }
      },
    },
    elements: {
      point: {
        radius: 4,
        hoverRadius: 6,
        backgroundColor: "#fff",
        borderWidth: 3,
        borderColor: "#0076FF"
      }
    }
  };

  const dataCharts = {
    labels: ticketsData?.data.length > 0 ? ticketsData.data.map(item => (item.hasOwnProperty("horario") ? `${item.horario}:00` : item.data)) : [],
    datasets: [
      {
        label: "Tickets",
        data: ticketsData?.data.length > 0 ? ticketsData.data.map(item => item.total) : [],
        borderColor: "#0076FF",
        borderWidth: 4,
        backgroundColor: (context) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return null;
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, "rgba(0, 118, 255, 0.2)");
          gradient.addColorStop(1, "rgba(0, 118, 255, 0)");
          return gradient;
        },
        tension: 0.4,
        fill: true,
      },
    ],
  };

  return (
    <Box sx={{ background: "transparent" }}>
      <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, alignItems: "center", justifyContent: "space-between", mb: 4 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: "text.primary", letterSpacing: "-0.02em" }}>
            {i18n.t("dashboard.users.totalAttendances")}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Volume de atendimentos por período
          </Typography>
        </Box>
        <Box
          sx={{
            px: 3,
            py: 1.5,
            backgroundColor: "rgba(0, 118, 255, 0.1)",
            borderRadius: "16px",
            color: "#0076FF",
            fontWeight: 800,
            fontSize: "1.1rem",
            border: "1px solid rgba(0, 118, 255, 0.2)"
          }}
        >
          {ticketsData?.count || 0} Total
        </Box>
      </Box>

      <Grid container spacing={3} alignItems="flex-end" sx={{ mb: 5 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", ml: 1, mb: 1, display: "block" }}>DATA INICIAL</Typography>
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={brLocale}>
            <DatePicker
              value={initialDate}
              onChange={newValue => setInitialDate(newValue)}
              renderInput={params => (
                <TextField 
                  {...params} 
                  fullWidth 
                  size="small"
                  sx={{ 
                    "& .MuiOutlinedInput-root": { 
                      borderRadius: "12px",
                      backgroundColor: "rgba(0,0,0,0.02)",
                      border: "none"
                    } 
                  }} 
                />
              )}
            />
          </LocalizationProvider>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", ml: 1, mb: 1, display: "block" }}>DATA FINAL</Typography>
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={brLocale}>
            <DatePicker
              value={finalDate}
              onChange={newValue => setFinalDate(newValue)}
              renderInput={params => (
                <TextField 
                  {...params} 
                  fullWidth 
                  size="small"
                  sx={{ 
                    "& .MuiOutlinedInput-root": { 
                      borderRadius: "12px",
                      backgroundColor: "rgba(0,0,0,0.02)",
                      border: "none"
                    } 
                  }} 
                />
              )}
            />
          </LocalizationProvider>
        </Grid>
        <Grid item xs={12} md={2}>
          <Button
            onClick={handleGetTicketsInformation}
            variant="contained"
            fullWidth
            disabled={isLoading}
            sx={{
              backgroundColor: "#0076FF",
              color: "#fff",
              fontWeight: 700,
              borderRadius: "12px",
              py: 1,
              height: "40px",
              boxShadow: "0 8px 20px rgba(0, 118, 255, 0.2)",
              "&:hover": {
                backgroundColor: "#0056D2",
                boxShadow: "0 10px 25px rgba(0, 118, 255, 0.3)",
              }
            }}
          >
            {isLoading ? <CircularProgress size={24} color="inherit" /> : i18n.t("dashboard.buttons.filter")}
          </Button>
        </Grid>
      </Grid>

      <Box sx={{ height: 400, width: "100%", position: "relative" }}>
        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
            <CircularProgress />
          </Box>
        ) : ticketsData?.data.length === 0 ? (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", bgcolor: "rgba(0,0,0,0.02)", borderRadius: "20px" }}>
            <Typography color="textSecondary" sx={{ fontWeight: 600 }}>Nenhum dado disponível para o período selecionado.</Typography>
          </Box>
        ) : (
          <Line options={options} data={dataCharts} />
        )}
      </Box>
    </Box>
  );
};

export default ChartsDate;
