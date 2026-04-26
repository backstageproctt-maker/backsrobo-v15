import React, { useState, useEffect, useContext } from "react";
import { makeStyles, useTheme } from "@material-ui/core/styles";
import api from "../../services/api";
import { AuthContext } from "../../context/Auth/AuthContext";
import Board from 'react-trello';
import { toast } from "react-toastify";
import { i18n } from "../../translate/i18n";
import { useHistory } from 'react-router-dom';
import { Facebook, Instagram, WhatsApp } from "@material-ui/icons";
import { Badge, Tooltip, Typography, Button, TextField, Box } from "@material-ui/core";
import { format, isSameDay, parseISO } from "date-fns";
import { Can } from "../../components/Can";
import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import Title from "../../components/Title";

const useStyles = makeStyles(theme => ({
  root: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
  },
  kanbanContainer: {
    width: "100%",
    flex: 1,
    overflow: "hidden",
    borderRadius: "24px",
    background: "rgba(255, 255, 255, 0.4)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255, 255, 255, 0.3)",
    padding: theme.spacing(2),
  },
  connectionTag: {
    background: "#333",
    color: "#FFF",
    marginRight: 1,
    padding: "2px 6px",
    fontWeight: 'bold',
    borderRadius: 6,
    fontSize: "0.7em",
  },
  lastMessageTime: {
    color: theme.palette.text.secondary,
    fontSize: "0.75rem",
  },
  lastMessageTimeUnread: {
    color: "#00b4db",
    fontWeight: "bold",
    fontSize: "0.75rem",
  },
  cardButton: {
    background: "linear-gradient(135deg, #00b4db 0%, #045de9 100%)",
    color: "#fff",
    fontWeight: 700,
    borderRadius: "8px",
    fontSize: "0.75rem",
    marginTop: theme.spacing(1),
    "&:hover": {
      boxShadow: "0 4px 10px rgba(0, 180, 219, 0.3)",
    },
  },
  dateInput: {
    marginRight: theme.spacing(2),
    "& .MuiOutlinedInput-root": {
      borderRadius: "12px",
    }
  },
}));

const Kanban = () => {
  const classes = useStyles();
  const theme = useTheme();
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

  const handleSearchClick = () => {
    fetchTickets();
  };

  const handleStartDateChange = (event) => {
    setStartDate(event.target.value);
  };

  const handleEndDateChange = (event) => {
    setEndDate(event.target.value);
  };

  const IconChannel = (channel) => {
    switch (channel) {
      case "facebook":
        return <Facebook style={{ color: "#3b5998", verticalAlign: "middle", fontSize: "16px" }} />;
      case "instagram":
        return <Instagram style={{ color: "#e1306c", verticalAlign: "middle", fontSize: "16px" }} />;
      case "whatsapp":
        return <WhatsApp style={{ color: "#25d366", verticalAlign: "middle", fontSize: "16px" }} />
      default:
        return "error";
    }
  };

  const popularCards = (jsonString) => {
    const filteredTickets = tickets.filter(ticket => ticket.tags.length === 0);

    const lanes = [
      {
        id: "lane0",
        title: i18n.t("tagsKanban.laneDefault"),
        label: filteredTickets.length.toString(),
        cards: filteredTickets.map(ticket => ({
          id: ticket.id.toString(),
          label: "Ticket nº " + ticket.id.toString(),
          description: (
            <Box>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2" fontWeight={700}>{ticket.contact.number}</Typography>
                <Typography
                  className={Number(ticket.unreadMessages) > 0 ? classes.lastMessageTimeUnread : classes.lastMessageTime}
                >
                  {isSameDay(parseISO(ticket.updatedAt), new Date()) ? (
                    <>{format(parseISO(ticket.updatedAt), "HH:mm")}</>
                  ) : (
                    <>{format(parseISO(ticket.updatedAt), "dd/MM")}</>
                  )}
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ opacity: 0.8, mb: 1 }} noWrap>{ticket.lastMessage || " "}</Typography>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Button
                  className={classes.cardButton}
                  size="small"
                  onClick={() => handleCardClick(ticket.uuid)}
                >
                  Ver Ticket
                </Button>
                {ticket?.user && (
                   <Badge className={classes.connectionTag}>{ticket.user?.name.toUpperCase()}</Badge>
                )}
              </Box>
            </Box>
          ),
          title: <Box display="flex" alignItems="center" gap={1}>
            <Tooltip title={ticket.whatsapp?.name}>
              {IconChannel(ticket.channel)}
            </Tooltip> 
            <Typography variant="subtitle2" fontWeight={700}>{ticket.contact.name}</Typography>
          </Box>,
          draggable: true,
        })),
      },
      ...tags.map(tag => {
        const filteredTickets = tickets.filter(ticket => {
          const tagIds = ticket.tags.map(tag => tag.id);
          return tagIds.includes(tag.id);
        });

        return {
          id: tag.id.toString(),
          title: tag.name,
          label: filteredTickets?.length.toString(),
          cards: filteredTickets.map(ticket => ({
            id: ticket.id.toString(),
            label: "Ticket nº " + ticket.id.toString(),
            description: (
              <Box>
                <Box mb={1}>
                  <Typography variant="body2" fontWeight={700}>{ticket.contact.number}</Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }} noWrap>{ticket.lastMessage || " "}</Typography>
                </Box>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Button
                    className={classes.cardButton}
                    size="small"
                    onClick={() => handleCardClick(ticket.uuid)}
                  >
                    Ver Ticket
                  </Button>
                  {ticket?.user && (
                    <Badge className={classes.connectionTag}>{ticket.user?.name.toUpperCase()}</Badge>
                  )}
                </Box>
              </Box>
            ),
            title: <Box display="flex" alignItems="center" gap={1}>
              <Tooltip title={ticket.whatsapp?.name}>
                {IconChannel(ticket.channel)}
              </Tooltip>
              <Typography variant="subtitle2" fontWeight={700}>{ticket.contact.name}</Typography>
            </Box>,
            draggable: true,
          })),
          style: { backgroundColor: tag.color, color: "white", borderRadius: "16px", border: "none" }
        };
      }),
    ];

    setFile({ lanes });
  };

  const handleCardClick = (uuid) => {
    history.push('/tickets/' + uuid);
  };

  useEffect(() => {
    popularCards(jsonString);
  }, [tags, tickets]);

  const handleCardMove = async (cardId, sourceLaneId, targetLaneId) => {
    try {
      await api.delete(`/ticket-tags/${targetLaneId}`);
      toast.success('Ticket Tag Removido!');
      await api.put(`/ticket-tags/${targetLaneId}/${sourceLaneId}`);
      toast.success('Ticket Tag Adicionado com Sucesso!');
      await fetchTickets(jsonString);
      popularCards(jsonString);
    } catch (err) {
      console.log(err);
    }
  };

  const handleAddConnectionClick = () => {
    history.push('/tagsKanban');
  };

  return (
    <MainContainer>
      <MainHeader>
        <Title>Kanban</Title>
        <Box display="flex" alignItems="center" gap={1}>
          <TextField
            label="Início"
            type="date"
            value={startDate}
            onChange={handleStartDateChange}
            InputLabelProps={{ shrink: true }}
            variant="outlined"
            size="small"
            className={classes.dateInput}
          />
          <TextField
            label="Fim"
            type="date"
            value={endDate}
            onChange={handleEndDateChange}
            InputLabelProps={{ shrink: true }}
            variant="outlined"
            size="small"
            className={classes.dateInput}
          />
          <Button
            variant="contained"
            onClick={handleSearchClick}
            sx={{
              background: "rgba(0,0,0,0.05)",
              color: "#444",
              fontWeight: 700,
              borderRadius: "12px",
              boxShadow: "none",
            }}
          >
            Buscar
          </Button>
          <Can role={user.profile} perform="dashboard:view" yes={() => (
            <Button
              variant="contained"
              onClick={handleAddConnectionClick}
              sx={{
                background: "linear-gradient(135deg, #00b4db 0%, #045de9 100%)",
                color: "#fff",
                fontWeight: 700,
                borderRadius: "12px",
                boxShadow: "0 8px 20px rgba(0, 180, 219, 0.2)",
              }}
            >
              Colunas
            </Button>
          )} />
        </Box>
      </MainHeader>
      <Box className={classes.kanbanContainer}>
        <Board
          data={file}
          onCardMoveAcrossLanes={handleCardMove}
          style={{ backgroundColor: 'transparent' }}
          laneStyle={{ background: 'rgba(0,0,0,0.02)', borderRadius: "16px", marginRight: "16px" }}
        />
      </Box>
    </MainContainer>
  );
};

export default Kanban;

export default Kanban;
