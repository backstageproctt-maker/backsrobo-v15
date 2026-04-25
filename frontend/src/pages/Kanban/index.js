import React, { useState, useEffect, useContext } from "react";
import { makeStyles } from "@material-ui/core/styles";
import api from "../../services/api";
import { AuthContext } from "../../context/Auth/AuthContext";
import Board from 'react-trello';
import { toast } from "react-toastify";
import { i18n } from "../../translate/i18n";
import { useHistory } from 'react-router-dom';
import { Facebook, Instagram, WhatsApp } from "@material-ui/icons";
import { Badge, Tooltip, Typography, Button, TextField, Box, Paper } from "@material-ui/core";
import { format, isSameDay, parseISO } from "date-fns";
import SearchIcon from "@material-ui/icons/Search";
import MainContainer from "../../components/MainContainer";
import { Can } from "../../components/Can";

const useStyles = makeStyles(theme => ({
  root: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    height: "100%",
    backgroundColor: "#F8FAFC",
  },
  headerBox: {
    backgroundColor: "#EFF6FF",
    padding: theme.spacing(2, 3),
    borderRadius: "12px",
    marginBottom: theme.spacing(3),
    border: "1px solid #DBEAFE",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  filterPaper: {
    padding: theme.spacing(2),
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(2),
    marginBottom: theme.spacing(3),
    borderRadius: "12px",
    border: "1px solid #E2E8F0",
    boxShadow: "none",
  },
  kanbanContainer: {
    flex: 1,
    padding: theme.spacing(1),
  },
  connectionTag: {
    background: "#0F172A",
    color: "#FFF",
    padding: "2px 6px",
    fontWeight: 'bold',
    borderRadius: 4,
    fontSize: "0.65rem",
    marginTop: 8,
    display: "inline-block"
  },
  cardButton: {
    marginTop: 10,
    textTransform: "none",
    fontWeight: "bold",
    borderRadius: "8px",
    backgroundColor: "#006B76",
    color: "#fff",
    "&:hover": {
      backgroundColor: "#00565E",
    },
  },
  dateInput: {
    "& .MuiOutlinedInput-root": {
        borderRadius: "10px",
        backgroundColor: "#fff",
    }
  }
}));

const Kanban = () => {
  const classes = useStyles();
  const history = useHistory();
  const { user, socket } = useContext(AuthContext);
  const [tags, setTags] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [file, setFile] = useState({ lanes: [] });
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const jsonString = user.queues.map(queue => queue.UserQueue.queueId);

  useEffect(() => {
    fetchTags();
  }, [user]);

  const fetchTags = async () => {
    try {
      const response = await api.get("/tag/kanban/");
      const fetchedTags = response.data.lista || [];
      setTags(fetchedTags);
      fetchTickets();
    } catch (error) {
      console.log(error);
    }
  };

  const fetchTickets = async () => {
    try {
      const { data } = await api.get("/ticket/kanban", {
        params: {
          queueIds: JSON.stringify(jsonString),
          startDate: startDate,
          endDate: endDate,
        }
      });
      setTickets(data.tickets);
    } catch (err) {
      console.log(err);
      setTickets([]);
    }
  };

  useEffect(() => {
    const companyId = user.companyId;
    const onAppMessage = (data) => {
      if (data.action === "create" || data.action === "update" || data.action === "delete") {
        fetchTickets();
      }
    };
    socket.on(`company-${companyId}-ticket`, onAppMessage);
    socket.on(`company-${companyId}-appMessage`, onAppMessage);

    return () => {
      socket.off(`company-${companyId}-ticket`, onAppMessage);
      socket.off(`company-${companyId}-appMessage`, onAppMessage);
    };
  }, [socket, startDate, endDate]);

  const handleSearchClick = () => { fetchTickets(); };
  const handleStartDateChange = (event) => { setStartDate(event.target.value); };
  const handleEndDateChange = (event) => { setEndDate(event.target.value); };

  const IconChannel = (channel) => {
    switch (channel) {
      case "facebook": return <Facebook style={{ color: "#3b5998", fontSize: "16px" }} />;
      case "instagram": return <Instagram style={{ color: "#e1306c", fontSize: "16px" }} />;
      case "whatsapp": return <WhatsApp style={{ color: "#25d366", fontSize: "16px" }} />
      default: return null;
    }
  };

  const popularCards = () => {
    const filteredTickets = tickets.filter(ticket => ticket.tags.length === 0);
    const lanes = [
      {
        id: "lane0",
        title: i18n.t("tagsKanban.laneDefault"),
        label: filteredTickets.length.toString(),
        cards: filteredTickets.map(ticket => ({
          id: ticket.id.toString(),
          title: (
            <Box display="flex" alignItems="center" gap={1}>
                {IconChannel(ticket.channel)}
                <Typography variant="subtitle2" style={{ fontWeight: 700 }}>{ticket.contact.name}</Typography>
            </Box>
          ),
          description: (
            <Box>
                <Typography variant="caption" color="textSecondary" style={{ display: "block", marginBottom: 4 }}>
                    Ticket nº {ticket.id} • {isSameDay(parseISO(ticket.updatedAt), new Date()) ? format(parseISO(ticket.updatedAt), "HH:mm") : format(parseISO(ticket.updatedAt), "dd/MM/yy")}
                </Typography>
                <Typography variant="body2" style={{ color: "#475569", fontSize: "0.75rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {ticket.lastMessage || "Sem mensagens"}
                </Typography>
                <Button size="small" fullWidth className={classes.cardButton} onClick={() => history.push(`/tickets/${ticket.uuid}`)}>
                    Ver Ticket
                </Button>
                {ticket?.user && <div className={classes.connectionTag}>{ticket.user?.name.toUpperCase()}</div>}
            </Box>
          ),
          draggable: true,
        })),
        style: { backgroundColor: "#F1F5F9", borderRadius: "12px", border: "1px solid #E2E8F0" }
      },
      ...tags.map(tag => {
        const filteredTickets = tickets.filter(ticket => ticket.tags.map(t => t.id).includes(tag.id));
        return {
          id: tag.id.toString(),
          title: tag.name,
          label: filteredTickets?.length.toString(),
          cards: filteredTickets.map(ticket => ({
            id: ticket.id.toString(),
            title: (
                <Box display="flex" alignItems="center" gap={1}>
                    {IconChannel(ticket.channel)}
                    <Typography variant="subtitle2" style={{ fontWeight: 700 }}>{ticket.contact.name}</Typography>
                </Box>
              ),
            description: (
                <Box>
                    <Typography variant="caption" color="textSecondary" style={{ display: "block", marginBottom: 4 }}>
                        Ticket nº {ticket.id}
                    </Typography>
                    <Typography variant="body2" style={{ color: "#475569", fontSize: "0.75rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {ticket.lastMessage || "Sem mensagens"}
                    </Typography>
                    <Button size="small" fullWidth className={classes.cardButton} onClick={() => history.push(`/tickets/${ticket.uuid}`)}>
                        Ver Ticket
                    </Button>
                    {ticket?.user && <div className={classes.connectionTag}>{ticket.user?.name.toUpperCase()}</div>}
                </Box>
            ),
            draggable: true,
          })),
          style: { backgroundColor: "#F1F5F9", borderRadius: "12px", border: "1px solid #E2E8F0" }
        };
      }),
    ];
    setFile({ lanes });
  };

  useEffect(() => { popularCards(); }, [tags, tickets]);

  const handleCardMove = async (cardId, sourceLaneId, targetLaneId) => {
    try {
      await api.delete(`/ticket-tags/${targetLaneId}`);
      await api.put(`/ticket-tags/${targetLaneId}/${sourceLaneId}`);
      toast.success('Kanban atualizado!');
      fetchTickets();
    } catch (err) { console.log(err); }
  };

  return (
    <MainContainer>
      <Box className={classes.headerBox}>
        <Box>
            <Typography variant="h5" style={{ fontWeight: "bold", color: "#1E293B" }}>Gestão Kanban</Typography>
            <Typography variant="body2" style={{ color: "#64748B" }}>Gerencie tickets por estágio com visão operacional em tempo real.</Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
            <Box sx={{ bgcolor: "#E2E8F0", px: 2, py: 1, borderRadius: 2 }}>
                <Typography variant="caption" style={{ fontWeight: 700, color: "#475569" }}>
                   {tickets.length} tickets no período
                </Typography>
            </Box>
            <Can role={user.profile} perform="dashboard:view" yes={() => (
                <Button variant="contained" style={{ backgroundColor: "#006B76", color: "#fff", textTransform: "none", fontWeight: "bold" }} onClick={() => history.push('/tagsKanban')}>
                    + Adicionar Colunas
                </Button>
            )} />
        </Box>
      </Box>

      <Paper className={classes.filterPaper} variant="outlined">
          <TextField label="Início" type="date" value={startDate} onChange={handleStartDateChange} InputLabelProps={{ shrink: true }} variant="outlined" size="small" className={classes.dateInput} />
          <TextField label="Fim" type="date" value={endDate} onChange={handleEndDateChange} InputLabelProps={{ shrink: true }} variant="outlined" size="small" className={classes.dateInput} />
          <Button variant="contained" style={{ backgroundColor: "#006B76", color: "#fff" }} onClick={handleSearchClick} startIcon={<SearchIcon />}>
            Buscar
          </Button>
      </Paper>

      <Box className={classes.kanbanContainer}>
        <Board
          data={file}
          onCardMoveAcrossLanes={handleCardMove}
          style={{ backgroundColor: 'transparent', padding: '0px' }}
          laneStyle={{ backgroundColor: "#F1F5F9", borderRadius: "12px", margin: "0 8px" }}
          cardStyle={{ borderRadius: "10px", marginBottom: "10px", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}
        />
      </Box>
    </MainContainer>
  );
};

export default Kanban;
