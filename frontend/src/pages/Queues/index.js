import React, { useEffect, useReducer, useState, useContext } from "react";

import {
  Button,
  IconButton,
  makeStyles,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  Box,
} from "@material-ui/core";

import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import MainHeaderButtonsWrapper from "../../components/MainHeaderButtonsWrapper";
import TableRowSkeleton from "../../components/TableRowSkeleton";
import Title from "../../components/Title";
import { i18n } from "../../translate/i18n";
import toastError from "../../errors/toastError";
import api from "../../services/api";
import { DeleteOutline, Edit } from "@material-ui/icons";
import QueueModal from "../../components/QueueModal";
import { toast } from "react-toastify";
import ConfirmationModal from "../../components/ConfirmationModal";
// import { SocketContext } from "../../context/Socket/SocketContext";
import { AuthContext } from "../../context/Auth/AuthContext";
import ForbiddenPage from "../../components/ForbiddenPage";



const reducer = (state, action) => {
  if (action.type === "LOAD_QUEUES") {
    const queues = action.payload;
    const newQueues = [];

    queues.forEach((queue) => {
      const queueIndex = state.findIndex((q) => q.id === queue.id);
      if (queueIndex !== -1) {
        state[queueIndex] = queue;
      } else {
        newQueues.push(queue);
      }
    });

    return [...state, ...newQueues];
  }

  if (action.type === "UPDATE_QUEUES") {
    const queue = action.payload;
    const queueIndex = state.findIndex((u) => u.id === queue.id);

    if (queueIndex !== -1) {
      state[queueIndex] = queue;
      return [...state];
    } else {
      return [queue, ...state];
    }
  }

  if (action.type === "DELETE_QUEUE") {
    const queueId = action.payload;
    const queueIndex = state.findIndex((q) => q.id === queueId);
    if (queueIndex !== -1) {
      state.splice(queueIndex, 1);
    }
    return [...state];
  }

  if (action.type === "RESET") {
    return [];
  }
};

const useStyles = makeStyles((theme) => ({
  mainContainer: {
    background: "#F8FAFC",
    padding: theme.spacing(3),
  },
  headerBox: {
    backgroundColor: "#EFF6FF",
    padding: theme.spacing(2, 3),
    borderRadius: "12px",
    marginBottom: theme.spacing(3),
    border: "1px solid #DBEAFE",
  },
  mainPaper: {
    flex: 1,
    padding: theme.spacing(2),
    borderRadius: "12px",
    border: "1px solid #E2E8F0",
    boxShadow: "none",
    ...theme.scrollbarStyles,
  },
  table: {
    "& .MuiTableCell-head": {
        fontWeight: "bold",
        color: "#64748B",
        borderBottom: "2px solid #F1F5F9",
    },
    "& .MuiTableCell-body": {
        color: "#1E293B",
        borderBottom: "1px solid #F1F5F9",
    }
  },
  actionButton: {
    borderRadius: "8px",
    textTransform: "none",
    fontWeight: "bold",
  },
  newButton: {
    backgroundColor: "#006B76",
    color: "#FFFFFF",
    "&:hover": {
      backgroundColor: "#00565E",
    },
  },
  colorSample: {
    width: 40,
    height: 12,
    borderRadius: "4px",
    display: "inline-block",
  }
}));

const Queues = () => {
  const classes = useStyles();

  const [queues, dispatch] = useReducer(reducer, []);
  const [loading, setLoading] = useState(false);

  const [queueModalOpen, setQueueModalOpen] = useState(false);
  const [selectedQueue, setSelectedQueue] = useState(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const { user, socket } = useContext(AuthContext);
  const companyId = user.companyId;

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/queue");
        dispatch({ type: "LOAD_QUEUES", payload: data });
        setLoading(false);
      } catch (err) {
        toastError(err);
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    const onQueueEvent = (data) => {
      if (data.action === "update" || data.action === "create") {
        dispatch({ type: "UPDATE_QUEUES", payload: data.queue });
      }

      if (data.action === "delete") {
        dispatch({ type: "DELETE_QUEUE", payload: data.queueId });
      }
    };
    socket.on(`company-${companyId}-queue`, onQueueEvent);

    return () => {
      socket.off(`company-${companyId}-queue`, onQueueEvent);
    };
  }, [socket, companyId]);

  const handleOpenQueueModal = () => {
    setQueueModalOpen(true);
    setSelectedQueue(null);
  };

  const handleCloseQueueModal = () => {
    setQueueModalOpen(false);
    setSelectedQueue(null);
  };

  const handleEditQueue = (queue) => {
    setSelectedQueue(queue);
    setQueueModalOpen(true);
  };

  const handleCloseConfirmationModal = () => {
    setConfirmModalOpen(false);
    setSelectedQueue(null);
  };

  const handleDeleteQueue = async (queueId) => {
    try {
      await api.delete(`/queue/${queueId}`);
      toast.success(i18n.t("Queue deleted successfully!"));
    } catch (err) {
      toastError(err);
    }
    setSelectedQueue(null);
  };

  return (
    <MainContainer className={classes.mainContainer}>
      <ConfirmationModal
        title={
          selectedQueue &&
          `${i18n.t("queues.confirmationModal.deleteTitle")} ${selectedQueue.name}?`
        }
        open={confirmModalOpen}
        onClose={handleCloseConfirmationModal}
        onConfirm={() => handleDeleteQueue(selectedQueue.id)}
      >
        {i18n.t("queues.confirmationModal.deleteMessage")}
      </ConfirmationModal>
      
      <QueueModal
        open={queueModalOpen}
        onClose={handleCloseQueueModal}
        queueId={selectedQueue?.id}
        onEdit={(res) => {
          if (res) {
            setTimeout(() => { handleEditQueue(res) }, 500)
          }
        }}
      />

      {user.profile === "user" ? <ForbiddenPage /> : (
        <>
          <Box className={classes.headerBox} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Box>
                <Typography variant="h5" style={{ fontWeight: "bold", color: "#1E293B" }}>
                Filas de Atendimento
                </Typography>
                <Typography variant="body2" style={{ color: "#64748B" }}>
                Organize seus setores e defina as regras de saudação para cada fila.
                </Typography>
            </Box>
            <Button 
                variant="contained" 
                className={`${classes.actionButton} ${classes.newButton}`}
                onClick={handleOpenQueueModal}
            >
                Nova Fila
            </Button>
          </Box>

          <Paper className={classes.mainPaper} variant="outlined">
            <Table size="small" className={classes.table}>
              <TableHead>
                <TableRow>
                  <TableCell align="center">ID</TableCell>
                  <TableCell align="center">Nome</TableCell>
                  <TableCell align="center">Cor</TableCell>
                  <TableCell align="center">Ordem</TableCell>
                  <TableCell align="center">Saudação</TableCell>
                  <TableCell align="center">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {queues.map((queue) => (
                  <TableRow key={queue.id} hover>
                    <TableCell align="center">{queue.id}</TableCell>
                    <TableCell align="center" style={{ fontWeight: "bold" }}>{queue.name}</TableCell>
                    <TableCell align="center">
                        <div className={classes.colorSample} style={{ backgroundColor: queue.color || "#000" }} />
                    </TableCell>
                    <TableCell align="center">{queue.orderQueue}</TableCell>
                    <TableCell align="center">
                        <Typography noWrap variant="body2" style={{ maxWidth: 250 }}>
                            {queue.greetingMessage || "Sem saudação"}
                        </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton size="small" onClick={() => handleEditQueue(queue)}>
                        <Edit sx={{ color: "#64748B" }} />
                      </IconButton>
                      <IconButton size="small" onClick={() => { setSelectedQueue(queue); setConfirmModalOpen(true); }}>
                        <DeleteOutline sx={{ color: "#EF4444" }} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {loading && <TableRowSkeleton columns={6} />}
              </TableBody>
            </Table>
          </Paper>
        </>
      )}
    </MainContainer>
  );
};

export default Queues;
