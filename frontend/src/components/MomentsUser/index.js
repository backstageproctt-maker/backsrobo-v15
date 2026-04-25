import React, { Fragment, useContext, useEffect, useMemo, useState } from "react";
import { useHistory } from "react-router-dom";
import api from "../../services/api";
import { i18n } from "../../translate/i18n";
import toastError from "../../errors/toastError";
import { AuthContext } from "../../context/Auth/AuthContext";
import { ReportProblem, VisibilityOutlined, AccessTime } from "@material-ui/icons";
import { toast } from "react-toastify";
import { Avatar, CardHeader, Divider, List, ListItem, ListItemAvatar, ListItemText, Paper, Typography, makeStyles, Grid, Tooltip, Box, Chip } from "@material-ui/core";
import { format, isSameDay, parseISO } from "date-fns";
import { grey, orange, red, green } from "@material-ui/core/colors";
import { getBackendUrl } from "../../config";

const backendUrl = getBackendUrl();

const useStyles = makeStyles((theme) => ({
  container: {
    padding: theme.spacing(2),
    backgroundColor: "#F8FAFC",
  },
  slaContainer: {
    display: "flex",
    gap: theme.spacing(1),
    marginBottom: theme.spacing(3),
    flexWrap: "wrap"
  },
  slaBox: {
    padding: "6px 12px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontWeight: "bold",
    fontSize: "0.8rem",
    border: "1px solid transparent"
  },
  userColumn: {
    width: "350px",
    backgroundColor: "#fff",
    borderRadius: "16px",
    border: "1px solid #E2E8F0",
    overflow: "hidden",
    margin: "0 8px"
  },
  userHeader: {
    padding: theme.spacing(2),
    backgroundColor: "#F1F5F9",
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1)
  },
  ticketItem: {
    margin: "8px",
    padding: "12px",
    borderRadius: "12px",
    border: "1px solid #E2E8F0",
    "&:hover": {
        backgroundColor: "#F8FAFC"
    }
  },
  slaBadge: {
    padding: "2px 8px",
    borderRadius: "20px",
    fontSize: "0.65rem",
    fontWeight: "bold",
    display: "flex",
    alignItems: "center",
    gap: "4px",
    marginTop: "8px"
  },
  tagFila: {
    backgroundColor: "#2563EB",
    color: "#fff",
    padding: "2px 6px",
    borderRadius: "4px",
    fontSize: "0.6rem",
    fontWeight: "bold"
  }
}));

const DashboardManage = () => {
  const classes = useStyles();
  const history = useHistory();
  const { user, socket } = useContext(AuthContext);
  const [tickets, setTickets] = useState([]);
  const companyId = user.companyId;

  const fetchTickets = async () => {
    try {
      const { data } = await api.get("/usersMoments");
      setTickets(data);
    } catch (err) {
      toastError(err);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  useEffect(() => {
    const onAppMessage = (data) => {
      if (data.action === "create" || data.action === "update" || data.action === "delete") {
        fetchTickets();
      }
    }
    socket.on(`company-${companyId}-ticket`, onAppMessage)
    socket.on(`company-${companyId}-appMessage`, onAppMessage);
    return () => {
      socket.off(`company-${companyId}-ticket`, onAppMessage)
      socket.off(`company-${companyId}-appMessage`, onAppMessage);
    };
  }, [socket]);

  const stats = useMemo(() => {
      const total = tickets.length;
      const pending = tickets.filter(t => !t.user).length;
      return { total, pending };
  }, [tickets]);

  const usersWithTickets = useMemo(() => {
    const grouped = tickets.reduce((acc, ticket) => {
      const u = ticket.user || { id: 'pending', name: 'Pendentes', profileImage: null };
      if (!acc[u.id]) acc[u.id] = { user: u, tickets: [] };
      acc[u.id].tickets.push(ticket);
      return acc;
    }, {});
    return Object.values(grouped);
  }, [tickets]);

  return (
    <div className={classes.container}>
      <Box className={classes.slaContainer}>
        <div className={classes.slaBox} style={{ backgroundColor: "#DBEAFE", color: "#1E40AF" }}>Total: {stats.total}</div>
        <div className={classes.slaBox} style={{ backgroundColor: "#FEF3C7", color: "#92400E" }}>Pendentes: {stats.pending}</div>
        <div className={classes.slaBox} style={{ backgroundColor: "#D1FAE5", color: "#065F46" }}>Dentro do prazo: 0</div>
        <div className={classes.slaBox} style={{ backgroundColor: "#FFEDD5", color: "#9A3412" }}>Risco de atraso: 0</div>
        <div className={classes.slaBox} style={{ backgroundColor: "#FEE2E2", color: "#991B1B" }}>Fora do prazo: {stats.total}</div>
      </Box>

      <Box display="flex" overflowX="auto" pb={2}>
        {usersWithTickets.map((group) => (
          <div key={group.user.id} className={classes.userColumn}>
            <div className={classes.userHeader}>
              <Avatar 
                src={group.user.profileImage ? `${backendUrl}/public/company${companyId}/user/${group.user.profileImage}` : null} 
                style={{ width: 32, height: 32 }}
              />
              <Box>
                <Typography variant="subtitle2" style={{ fontWeight: "bold" }}>{group.user.name}</Typography>
                <Typography variant="caption" color="textSecondary">Atendimentos: {group.tickets.length}</Typography>
              </Box>
            </div>
            <Box style={{ maxHeight: "70vh", overflowY: "auto", paddingBottom: 16 }}>
              {group.tickets.map(ticket => (
                <div key={ticket.id} className={classes.ticketItem}>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography variant="subtitle2" style={{ fontWeight: 700 }}>{ticket.contact.name}</Typography>
                        <Typography variant="caption" color="textSecondary">
                            {format(parseISO(ticket.updatedAt), "dd/MM/yy")}
                        </Typography>
                    </Box>
                    <Typography variant="body2" color="textSecondary" noWrap style={{ fontSize: "0.75rem" }}>
                        {ticket.lastMessage || "Sem mensagens"}
                    </Typography>
                    <Box display="flex" gap={0.5} mt={1}>
                        <span className={classes.tagFila}>{ticket.queue?.name?.toUpperCase() || "SEM FILA"}</span>
                    </Box>
                    <div className={classes.slaBadge} style={{ backgroundColor: "#FEE2E2", color: "#991B1B" }}>
                        <AccessTime style={{ fontSize: 12 }} /> Fora do prazo 224m
                    </div>
                    <Box display="flex" justifyContent="flex-end" mt={1}>
                        <Tooltip title="Ver Ticket">
                            <VisibilityOutlined 
                                style={{ fontSize: 18, cursor: "pointer", color: "#64748B" }} 
                                onClick={() => history.push(`/tickets/${ticket.uuid}`)}
                            />
                        </Tooltip>
                    </Box>
                </div>
              ))}
            </Box>
          </div>
        ))}
      </Box>
    </div>
  );
};

export default DashboardManage;
