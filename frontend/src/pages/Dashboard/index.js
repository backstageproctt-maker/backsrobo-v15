import React, { useContext, useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Avatar,
  Paper,
  Stack,
  SvgIcon,
  Tab,
  Tabs,
  Grid,
  IconButton,
  Divider,
  Tooltip,
} from "@mui/material";
import {
  SaveAlt,
  Groups,
  Call as CallIcon,
  HourglassEmpty as HourglassEmptyIcon,
  CheckCircle as CheckCircleIcon,
  RecordVoiceOver as RecordVoiceOverIcon,
  GroupAdd as GroupAddIcon,
  Star,
} from "@mui/icons-material";
import * as XLSX from "xlsx";
import { toast } from "react-toastify";
import { isArray } from "lodash";
import { AuthContext } from "../../context/Auth/AuthContext";
import useDashboard from "../../hooks/useDashboard";
import TableAttendantsStatus from "../../components/Dashboard/TableAttendantsStatus";
import { ChatsUser } from "./ChartsUser";
import ChartDonut from "./ChartDonut";
import { ChartsDate } from "./ChartsDate";
import ForbiddenPage from "../../components/ForbiddenPage";
import { i18n } from "../../translate/i18n";

// Tema v4 (whitelabel igual ao login) + tema v5 para demais tokens
import { useTheme as useThemeV4 } from "@material-ui/core/styles";
import { useTheme as useThemeV5 } from "@mui/material/styles";

// Cartões de estatísticas
// Cartões de estatísticas no padrão Pro (Zapchat)
const StatCard = ({ title, value, icon, color, description }) => (
  <Card
    elevation={0}
    sx={{
      height: "100%",
      borderRadius: "10px",
      border: "1px solid #E2E8F0",
      backgroundColor: "#FFFFFF",
      position: "relative",
      overflow: "visible"
    }}
  >
    <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
      <Stack spacing={0.5}>
        <Typography variant="body2" sx={{ fontWeight: 600, color: "#475569", fontSize: "0.85rem" }}>
          {title}
        </Typography>
        <Typography variant="h4" sx={{ fontWeight: 800, color: "#1E293B" }}>
          {value}
        </Typography>
        <Typography variant="caption" sx={{ color: "#94A3B8", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: 0.5 }}>
          <Box component="span" sx={{ width: 14, height: 14, display: "inline-flex" }}>
             <SvgIcon sx={{ fontSize: 14 }}>{icon}</SvgIcon>
          </Box>
          {description}
        </Typography>
      </Stack>
      <Avatar 
        sx={{ 
          position: "absolute", 
          top: 12, 
          right: 12, 
          bgcolor: `${color}15`, 
          color: color, 
          width: 32, 
          height: 32 
        }}
      >
        <SvgIcon sx={{ fontSize: 18 }}>{icon}</SvgIcon>
      </Avatar>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const themeV4 = useThemeV4();

  const [counters, setCounters] = useState({});
  const [attendants, setAttendants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const { find } = useDashboard();
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const params = {
          date_from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10),
          date_to: new Date().toISOString().slice(0, 10)
        };
        const data = await find(params);
        setCounters(data.counters);
        if (isArray(data.attendants)) setAttendants(data.attendants);
      } catch (error) {
        toast.error("Não foi possível carregar os dados do dashboard.");
        console.error(error);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const exportToExcel = () => {
    try {
      const table = document.getElementById("grid-attendants");
      const ws = XLSX.utils.table_to_sheet(table);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "RelatorioDeAtendentes");
      XLSX.writeFile(wb, "relatorio-de-atendentes.xlsx");
    } catch {
      toast.error("Erro ao exportar para Excel.");
    }
  };

  const getOnlineUsersCount = () => attendants.filter(u => u.online).length;

  if (user.profile === "user" && user.showDashboard === "disabled") {
    return <ForbiddenPage />;
  }

  const statCards = [
    { 
        title: "Em Atendimento", 
        value: counters.supportHappening || 0, 
        icon: <CallIcon />, 
        color: "#2563EB",
        description: "Atendimentos em andamento agora"
    },
    { 
        title: "Aguardando", 
        value: counters.supportPending || 0, 
        icon: <HourglassEmptyIcon />, 
        color: "#EA580C",
        description: "Tickets aguardando atendimento"
    },
    { 
        title: "Finalizados", 
        value: counters.supportFinished || 0, 
        icon: <CheckCircleIcon />, 
        color: "#10B981",
        description: "Atendimentos finalizados no período"
    },
    { 
        title: "Total de atendimentos", 
        value: (counters.supportHappening || 0) + (counters.supportPending || 0) + (counters.supportFinished || 0), 
        icon: <Groups />, 
        color: "#8B5CF6",
        description: "Soma real de atendimentos"
    },
  ];

  return (
    <Box sx={{ backgroundColor: "#F8FAFC", minHeight: "100vh", py: 3 }}>
      <Container maxWidth="xl">
        {/* Header Pro */}
        <Box sx={{ mb: 4, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Box>
                <Typography variant="h5" fontWeight="800" sx={{ color: "#1E293B" }}>
                Dashboard Operacional
                </Typography>
                <Typography variant="body2" sx={{ color: "#64748B" }}>
                Acompanhe o desempenho da sua equipe em tempo real.
                </Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                <Box sx={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: 1, 
                    bgcolor: "#DCFCE7", 
                    px: 2, 
                    py: 1, 
                    borderRadius: "20px",
                    border: "1px solid #BBF7D0"
                }}>
                    <Box sx={{ 
                        width: 10, 
                        height: 10, 
                        bgcolor: "#22C55E", 
                        borderRadius: "50%",
                        animation: "pulse 2s infinite" 
                    }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: "bold", color: "#166534" }}>
                        {getOnlineUsersCount()} Atendentes Online
                    </Typography>
                </Box>
                <Box sx={{ bgcolor: "#F1F5F9", px: 2, py: 1, borderRadius: "8px", border: "1px solid #E2E8F0" }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: "#475569" }}>
                        Atualizado agora
                    </Typography>
                </Box>
            </Box>
        </Box>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          {statCards.map((card, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <StatCard {...card} />
            </Grid>
          ))}
        </Grid>

        <Box sx={{ mb: 3, display: "flex", gap: 1, backgroundColor: "#fff", p: 0.5, borderRadius: "10px", width: "fit-content", border: "1px solid #E2E8F0" }}>
            {[
                { label: "Performance", idx: 0 },
                { label: "Satisfação (NPS)", idx: 1 },
                { label: "Status da Equipe", idx: 2 }
            ].map((tab) => (
                <Box
                    key={tab.idx}
                    onClick={() => setActiveTab(tab.idx)}
                    sx={{
                        px: 3,
                        py: 1,
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontWeight: 700,
                        fontSize: "0.85rem",
                        transition: "all 0.2s",
                        bgcolor: activeTab === tab.idx ? "#006B76" : "transparent",
                        color: activeTab === tab.idx ? "#FFFFFF" : "#64748B",
                        "&:hover": { bgcolor: activeTab === tab.idx ? "#006B76" : "#F1F5F9" }
                    }}
                >
                    {tab.label}
                </Box>
            ))}
        </Box>

        <style>
            {`
                @keyframes pulse {
                    0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
                    70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(34, 197, 94, 0); }
                    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
                }
            `}
        </style>

        <Box>
          {activeTab === 0 && (
            <Paper elevation={0} sx={{ p: 4, borderRadius: "16px", border: "1px solid #E2E8F0", backgroundColor: "#fff" }}>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>Volume de Atendimentos</Typography>
              <ChartsDate />
            </Paper>
          )}

          {activeTab === 1 && (
            <Paper elevation={0} sx={{ p: 4, borderRadius: "16px", border: "1px solid #E2E8F0", backgroundColor: "#fff" }}>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>Pesquisa de Satisfação</Typography>
                <Grid container spacing={3} justifyContent="center">
                    <Grid item xs={12} md={6}>
                        <Box sx={{ textAlign: "center", p: 4, border: "1px dashed #CBD5E1", borderRadius: "16px" }}>
                            <Typography variant="overline" color="text.secondary" sx={{ fontWeight: "bold" }}>NPS SCORE GERAL</Typography>
                            <ChartDonut data={[]} value={counters.npsScore || 0} colors={["#10B981", "#EF4444", "#F59E0B"]} />
                        </Box>
                    </Grid>
                </Grid>
            </Paper>
          )}

          {activeTab === 2 && (
            <Paper elevation={0} sx={{ p: 4, borderRadius: "16px", border: "1px solid #E2E8F0", backgroundColor: "#fff" }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                <Box>
                    <Typography variant="h6" fontWeight="bold">Agentes Ativos</Typography>
                    <Typography variant="body2" sx={{ color: "#64748B" }}>Status detalhado de cada atendente no período selecionado.</Typography>
                </Box>
                <Tooltip title="Exportar para Excel">
                    <IconButton onClick={exportToExcel} sx={{ bgcolor: "#F1F5F9", "&:hover": { bgcolor: "#E2E8F0" } }}>
                        <SaveAlt sx={{ color: "#006B76" }} />
                    </IconButton>
                </Tooltip>
              </Box>
              <div id="grid-attendants">
                {attendants.length > 0 && <TableAttendantsStatus attendants={attendants} loading={loading} />}
              </div>
            </Paper>
          )}
        </Box>
      </Container>
    </Box>
  );
};

export default Dashboard;
