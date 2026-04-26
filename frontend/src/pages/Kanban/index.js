import React, { useState, useEffect, useContext } from "react";
import { makeStyles, useTheme } from "@material-ui/core/styles";
import api from "../../services/api";
import { AuthContext } from "../../context/Auth/AuthContext";
import Board from 'react-trello';
import { toast } from "react-toastify";
import { i18n } from "../../translate/i18n";
import { useHistory } from 'react-router-dom';
import { Facebook, Instagram, WhatsApp } from "@material-ui/icons";
import { 
  Badge, 
  Tooltip, 
  Typography, 
  Button, 
  TextField, 
  Box, 
  Avatar, 
  IconButton 
} from "@material-ui/core";
import { 
  InfoOutlined, 
  PlayArrow, 
  Check, 
  ChatBubbleOutline 
} from "@material-ui/icons";
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
    padding: theme.spacing(2),
    background: "#f0f4f8",
    minHeight: "calc(100vh - 150px)",
    borderRadius: "24px",
    marginTop: theme.spacing(2),
  },
  dateInput: {
    marginRight: theme.spacing(1),
    "& .MuiOutlinedInput-root": {
      borderRadius: "12px",
      backgroundColor: "rgba(255,255,255,0.8)",
    }
  },
}));

// CUSTOM CARD COMPONENT
const CustomCard = ({ 
  title, 
  label, 
  description, 
  laneId, 
  ticket, 
  classes, 
  handleCardClick,
  IconChannel 
}) => {
  return (
    <Box
      sx={{
        background: "#fff",
        borderRadius: "12px",
        padding: "14px",
        marginBottom: "12px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
        borderLeft: `5px solid ${ticket.tagColor || "#ccc"}`,
        position: "relative",
        cursor: "pointer",
        transition: "all 0.2s ease",
        "&:hover": {
          transform: "translateY(-3px)",
          boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
        }
      }}
      onClick={() => handleCardClick(ticket.uuid)}
    >
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
        <Box>
           <Box display="flex" alignItems="center" gap={1} mb={0.5}>
             {IconChannel(ticket.channel)}
             <Typography variant="subtitle2" style={{ fontWeight: 800, color: "#333" }}>
               {ticket.contact.name}
             </Typography>
           </Box>
           <Typography variant="caption" style={{ color: "#888", display: "block" }}>
             Ticket nº {ticket.id}
           </Typography>
        </Box>
        <Avatar 
          src={ticket.contact.urlPicture} 
          style={{ width: 32, height: 32, borderRadius: "8px" }}
        />
      </Box>

      <Typography 
        variant="body2" 
        style={{ 
          color: "#666", 
          marginBottom: "12px",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          fontSize: "0.8rem"
        }}
      >
        {ticket.lastMessage || "Sem mensagens recentes"}
      </Typography>

      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Box display="flex" gap={1}>
          <PlayArrow style={{ fontSize: 16, color: "#bbb" }} />
          <Check style={{ fontSize: 16, color: "#bbb" }} />
          <Box display="flex" alignItems="center">
            <ChatBubbleOutline style={{ fontSize: 16, color: "#bbb" }} />
            {ticket.unreadMessages > 0 && (
              <Box 
                sx={{ 
                  background: "#ff9800", 
                  color: "#fff", 
                  borderRadius: "50%", 
                  width: 14, 
                  height: 14, 
                  fontSize: 8, 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center",
                  ml: 0.5
                }}
              >
                {ticket.unreadMessages}
              </Box>
            )}
          </Box>
        </Box>
        <Box 
          sx={{ 
            background: ticket.unreadMessages > 0 ? "#ff5252" : "#4caf50", 
            color: "#fff", 
            padding: "2px 8px", 
            borderRadius: "6px", 
            fontSize: "0.7rem",
            fontWeight: 800
          }}
        >
          {isSameDay(parseISO(ticket.updatedAt), new Date()) ? (
            format(parseISO(ticket.updatedAt), "HH:mm")
          ) : (
            format(parseISO(ticket.updatedAt), "dd/MM")
          )}
        </Box>
      </Box>
    </Box>
  );
};

// CUSTOM LANE HEADER
const CustomLaneHeader = ({ title, label, color }) => {
  return (
    <Box 
      display="flex" 
      justifyContent="space-between" 
      alignItems="center" 
      padding="8px 12px"
      mb={1}
    >
      <Box display="flex" alignItems="center" gap={1}>
        <Box 
          sx={{ 
            width: 8, 
            height: 8, 
            borderRadius: "50%", 
            backgroundColor: color || "#00b4db" 
          }} 
        />
        <Typography variant="subtitle2" style={{ fontWeight: 800, color: "#444", fontSize: "0.9rem" }}>
          {title}
        </Typography>
        <Typography variant="caption" style={{ color: "#aaa", fontWeight: 700 }}>
          ({label})
        </Typography>
      </Box>
      <IconButton size="small">
        <InfoOutlined style={{ fontSize: 18, color: "#ccc" }} />
      </IconButton>
    </Box>
  );
};

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
        return <WhatsApp style={{ color: "#25d366", verticalAlign: "middle", fontSize: "16px" }} />;
    }
  };

  const handleCardClick = (uuid) => {
    history.push('/tickets/' + uuid);
  };

  const popularCards = () => {
    const filteredTicketsDefault = tickets.filter(ticket => ticket.tags.length === 0);

    const lanes = [
      {
        id: "lane0",
        title: i18n.t("tagsKanban.laneDefault"),
        label: filteredTicketsDefault.length.toString(),
        color: "#ccc",
        cards: filteredTicketsDefault.map(ticket => ({
          id: ticket.id.toString(),
          ticket: ticket,
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
          color: tag.color,
          cards: filteredTickets.map(ticket => ({
            id: ticket.id.toString(),
            ticket: { ...ticket, tagColor: tag.color },
            draggable: true,
          })),
        };
      }),
    ];

    setFile({ lanes });
  };

  useEffect(() => {
    popularCards();
  }, [tags, tickets]);

  const handleCardMove = async (cardId, sourceLaneId, targetLaneId) => {
    try {
      await api.delete(`/ticket-tags/${targetLaneId}`);
      await api.put(`/ticket-tags/${targetLaneId}/${sourceLaneId}`);
      toast.success('Movido com Sucesso!');
      fetchTickets();
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
              background: "rgba(255,255,255,0.8)",
              color: "#444",
              fontWeight: 700,
              borderRadius: "12px",
              boxShadow: "none",
              border: "1px solid rgba(0,0,0,0.05)"
            }}
          >
            Buscar
          </Button>
          <Can role={user.profile} perform="dashboard:view" yes={() => (
            <Button
              variant="contained"
              onClick={handleAddConnectionClick}
              color="primary"
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
          style={{ backgroundColor: 'transparent', padding: "0" }}
          laneStyle={{ 
            background: 'rgba(0,0,0,0.03)', 
            borderRadius: "16px", 
            marginRight: "16px",
            maxHeight: "100%",
            width: 320
          }}
          customCardLayout
          components={{
            Card: (props) => (
              <CustomCard 
                {...props} 
                classes={classes} 
                handleCardClick={handleCardClick} 
                IconChannel={IconChannel} 
              />
            ),
            LaneHeader: (props) => (
              <CustomLaneHeader 
                {...props} 
              />
            )
          }}
        />
      </Box>
    </MainContainer>
  );
};

export default Kanban;
