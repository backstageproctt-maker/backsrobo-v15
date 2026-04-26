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
  Divider
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

// Welcome Header Component
const WelcomeHeader = ({ name }) => {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  
  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 800, color: "text.primary", letterSpacing: "-0.02em" }}>
        {greeting}, <span style={{ color: "#0076FF" }}>{name}</span>!
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mt: 1, opacity: 0.8 }}>
        Aqui está o resumo da sua operação hoje.
      </Typography>
    </Box>
  );
};

// Cartões de estatísticas (Premium Version)
const StatCard = ({ title, value, icon, color, gradient }) => (
  <Card
    sx={{
      height: "100%",
      borderRadius: "20px",
      border: "1px solid rgba(255, 255, 255, 0.3)",
      background: "rgba(255, 255, 255, 0.8)",
      backdropFilter: "blur(10px)",
      boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      overflow: "hidden",
      position: "relative",
      "&:hover": {
        transform: "translateY(-5px)",
        boxShadow: "0 20px 40px rgba(0,0,0,0.08)",
        "& .icon-bg": {
          transform: "scale(1.1) rotate(10deg)",
        }
      }
    }}
  >
    <CardContent sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600, color: "text.secondary", mb: 1, textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: "0.05em" }}>
            {title}
          </Typography>
          <Typography variant="h3" sx={{ fontWeight: 800, color: "text.primary", letterSpacing: "-0.02em" }}>
            {value}
          </Typography>
        </Box>
        <Avatar 
          className="icon-bg"
          sx={{ 
            bgcolor: color, 
            background: gradient || color,
            color: "#fff", 
            width: 48, 
            height: 48,
            borderRadius: "14px",
            boxShadow: `0 8px 16px ${color}44`,
            transition: "transform 0.3s ease"
          }}
        >
          <SvgIcon sx={{ fontSize: "1.5rem" }}>{icon}</SvgIcon>
        </Avatar>
      </Stack>
    </CardContent>
  </Card>
);

// Métricas NPS (Premium Version)
const NpsMetricCard = ({ title, value, color }) => (
  <Card sx={{ 
    height: "100%", 
    p: 3, 
    borderRadius: "20px", 
    background: "rgba(255, 255, 255, 0.6)",
    border: "1px solid rgba(0,0,0,0.05)",
    boxShadow: "none"
  }}>
    <Typography variant="body2" sx={{ fontWeight: 700, color: "text.secondary", mb: 2 }}>{title}</Typography>
    <Typography variant="h3" fontWeight={800} sx={{ color, mb: 2 }}>{value}%</Typography>
    <Box sx={{ height: 10, backgroundColor: "rgba(0,0,0,0.05)", borderRadius: 5, overflow: "hidden" }}>
      <Box sx={{ 
        height: "100%", 
        width: `${value}%`, 
        backgroundColor: color,
        borderRadius: 5,
        boxShadow: `0 0 10px ${color}66`
      }} />
    </Box>
  </Card>
);

const Dashboard = () => {
  const themeV5 = useThemeV5();
  const themeV4 = useThemeV4(); // whitelabel (igual à tela de login)

  const PRIMARY_MAIN = themeV4?.palette?.primary?.main || "#1976d2";
  const PRIMARY_DARK = themeV4?.palette?.primary?.dark || "#115293";
  const PRIMARY_CONTRAST = themeV4?.palette?.primary?.contrastText || "#fff";

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      title: i18n.t("dashboard.cards.inAttendance"), 
      value: counters.supportHappening || 0, 
      icon: <CallIcon />, 
      color: "#0076FF",
      gradient: "linear-gradient(135deg, #0076FF 0%, #00C6FF 100%)"
    },
    { 
      title: i18n.t("dashboard.cards.waiting"), 
      value: counters.supportPending || 0, 
      icon: <HourglassEmptyIcon />, 
      color: "#FF9100",
      gradient: "linear-gradient(135deg, #FF9100 0%, #FFC400 100%)"
    },
    { 
      title: i18n.t("dashboard.cards.finalized"), 
      value: counters.supportFinished || 0, 
      icon: <CheckCircleIcon />, 
      color: "#00C853",
      gradient: "linear-gradient(135deg, #00C853 0%, #B2FF59 100%)"
    },

    { 
      title: i18n.t("dashboard.cards.newContacts"), 
      value: counters.leads || 0, 
      icon: <GroupAddIcon />, 
      color: "#00B0FF",
      gradient: "linear-gradient(135deg, #00B0FF 0%, #00E5FF 100%)"
    }
  ];

  const npsData = {
    score: counters.npsScore || 0,
    promoters: counters.npsPromotersPerc || 0,
    passives: counters.npsPassivePerc || 0,
    detractors: counters.npsDetractorsPerc || 0,
    totalTickets: counters.tickets || 0,
    withRating: counters.withRating || 0,
    percRating: counters.percRating || 0
  };

  const npsColors = { Promotores: "#2EA85A", Detratores: "#F73A2C", Neutros: "#F7EC2C" };
  const npsChartData = [
    { name: "Promotores", value: npsData.promoters },
    { name: "Detratores", value: npsData.detractors },
    { name: "Neutros", value: npsData.passives }
  ].sort((a, b) => a.name.localeCompare(b.name));
  const sortedNpsColors = npsChartData.map(item => npsColors[item.name]);

  return (
    <Box sx={{ 
      backgroundColor: "#f4f7fc", 
      backgroundImage: "radial-gradient(at 0% 0%, hsla(210,100%,98%,1) 0, transparent 50%), radial-gradient(at 50% 0%, hsla(220,100%,97%,1) 0, transparent 50%)",
      minHeight: "100vh", 
      py: 6 
    }}>
      <Container maxWidth="xl">
        <WelcomeHeader name={user.name} />

        <Grid container spacing={3} sx={{ mb: 6 }}>
          {statCards.map((card, index) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
              <StatCard {...card} />
            </Grid>
          ))}
        </Grid>

        <Paper elevation={0} sx={{ 
          mb: 4, 
          borderRadius: "20px", 
          bgcolor: "rgba(255,255,255,0.4)",
          backdropFilter: "blur(5px)",
          p: 0.5
        }}>
          <Tabs
            value={activeTab}
            onChange={(e, nv) => setActiveTab(nv)}
            variant="fullWidth"
            sx={{
              "& .MuiTab-root": {
                fontWeight: 800,
                textTransform: "none",
                fontSize: "1rem",
                color: "text.secondary",
                borderRadius: "15px",
                transition: "all 0.3s",
                minHeight: "50px",
                "&.Mui-selected": { 
                  color: "#fff",
                  backgroundColor: "#0076FF",
                  boxShadow: "0 10px 20px rgba(0, 118, 255, 0.3)"
                }
              },
              "& .MuiTabs-indicator": { display: "none" }
            }}
          >
            <Tab label={i18n.t("dashboard.tabs.performance")} />
            <Tab label="NPS" />
            <Tab label={i18n.t("dashboard.tabs.attendants")} />
          </Tabs>
        </Paper>

        <Box sx={{ animation: "fadeIn 0.5s ease-out" }}>
          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; transform: translateY(10px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>
          {activeTab === 0 && (
            <Paper elevation={0} sx={{ 
              p: { xs: 3, sm: 4 }, 
              borderRadius: "24px", 
              boxShadow: "0 10px 40px rgba(0,0,0,0.03)",
              border: "1px solid rgba(255,255,255,0.6)",
              background: "rgba(255, 255, 255, 0.9)"
            }}>
              <ChartsDate />
            </Paper>
          )}

          {activeTab === 1 && (
            <Paper elevation={0} sx={{ 
              p: { xs: 3, sm: 4 }, 
              borderRadius: "24px", 
              boxShadow: "0 10px 40px rgba(0,0,0,0.03)",
              border: "1px solid rgba(255,255,255,0.6)",
              background: "rgba(255, 255, 255, 0.9)"
            }}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>
                <Avatar sx={{ bgcolor: "rgba(0,118,255,0.1)", color: "#0076FF", mr: 2, width: 48, height: 48 }}>
                  <Star />
                </Avatar>
                <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: "-0.02em" }}>{i18n.t("dashboard.tabs.assessments")}</Typography>
              </Box>
              <Divider sx={{ mb: 4, opacity: 0.6 }} />
              <Grid container spacing={4}>
                <Grid item xs={12} lg={4}>
                  <Card sx={{ 
                    height: "100%", 
                    display: "flex", 
                    flexDirection: "column", 
                    justifyContent: "center", 
                    alignItems: "center", 
                    p: 4, 
                    borderRadius: "24px", 
                    background: "linear-gradient(135deg, #ffffff 0%, #f9fbff 100%)",
                    border: "1px solid rgba(0,0,0,0.03)",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.02)"
                  }}>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: "text.secondary", mb: 3 }}>SCORE NPS GERAL</Typography>
                    <ChartDonut data={npsChartData} value={npsData.score} colors={sortedNpsColors} />
                  </Card>
                </Grid>

                <Grid item container xs={12} lg={8} spacing={3}>
                  <Grid item xs={12} md={4}>
                    <NpsMetricCard title={i18n.t("dashboard.assessments.prosecutors")} value={npsData.promoters} color={npsColors["Promotores"]} />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <NpsMetricCard title={i18n.t("dashboard.assessments.neutral")} value={npsData.passives} color={npsColors["Neutros"]} />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <NpsMetricCard title={i18n.t("dashboard.assessments.detractors")} value={npsData.detractors} color={npsColors["Detratores"]} />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Paper variant="outlined" sx={{ p: 1, borderRadius: "20px", background: "rgba(0,0,0,0.02)", border: "none" }}>
                      <Grid container spacing={2} textAlign="center">
                        {[
                          { title: i18n.t("dashboard.assessments.totalCalls"), value: npsData.totalTickets },
                          { title: i18n.t("dashboard.assessments.ratedCalls"), value: npsData.withRating },
                          { title: i18n.t("dashboard.assessments.evaluationIndex"), value: `${npsData.percRating.toFixed(1)}%` }
                        ].map((item, index) => (
                          <Grid item xs={12} sm={4} key={item.title} sx={{ p: 3 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 1 }}>{item.title}</Typography>
                            <Typography variant="h4" fontWeight={800} sx={{ color: "#0076FF" }}>{item.value}</Typography>
                          </Grid>
                        ))}
                      </Grid>
                    </Paper>
                  </Grid>
                </Grid>
              </Grid>
            </Paper>
          )}

          {activeTab === 2 && (
            <Paper elevation={0} sx={{ 
              p: { xs: 3, sm: 4 }, 
              borderRadius: "24px", 
              boxShadow: "0 10px 40px rgba(0,0,0,0.03)",
              border: "1px solid rgba(255,255,255,0.6)",
              background: "rgba(255, 255, 255, 0.9)"
            }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
                <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: "-0.02em" }}>{i18n.t("dashboard.tabs.attendants")}</Typography>
                <IconButton
                  onClick={exportToExcel}
                  sx={{
                    background: "linear-gradient(135deg, #0076FF 0%, #0056D2 100%)",
                    color: "#fff",
                    width: 48,
                    height: 48,
                    borderRadius: "14px",
                    boxShadow: "0 8px 20px rgba(0, 118, 255, 0.25)",
                    transition: "all .3s ease",
                    "&:hover": { transform: "translateY(-2px)", boxShadow: "0 12px 24px rgba(0, 118, 255, 0.35)" }
                  }}
                >
                  <SaveAlt />
                </IconButton>
              </Box>
              <Divider sx={{ mb: 4, opacity: 0.6 }} />
              <div id="grid-attendants">
                {attendants.length > 0 && <TableAttendantsStatus attendants={attendants} loading={loading} />}
              </div>
              <Box sx={{ mt: 6 }}>
                <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: "-0.02em", mb: 4 }}>{i18n.t("dashboard.charts.userPerformance")}</Typography>
                <Divider sx={{ mb: 4, opacity: 0.6 }} />
                <ChatsUser />
              </Box>
            </Paper>
          )}
        </Box>
      </Container>
    </Box>
  );
};

export default Dashboard;
