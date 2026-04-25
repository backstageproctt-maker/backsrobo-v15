import React, { useState, useEffect, useReducer, useCallback, useContext } from "react";
import { toast } from "react-toastify";
import { useHistory } from "react-router-dom";
import { makeStyles } from "@material-ui/core/styles";
import { Paper, Button, TextField, InputAdornment, Box, Typography, Tooltip } from "@material-ui/core";
import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import Title from "../../components/Title";
import api from "../../services/api";
import { i18n } from "../../translate/i18n";
import MainHeaderButtonsWrapper from "../../components/MainHeaderButtonsWrapper";
import ScheduleModal from "../../components/ScheduleModal";
import ConfirmationModal from "../../components/ConfirmationModal";
import toastError from "../../errors/toastError";
import moment from "moment";
import { AuthContext } from "../../context/Auth/AuthContext";
import usePlans from "../../hooks/usePlans";
import { Calendar, momentLocalizer } from "react-big-calendar";
import "moment/locale/pt-br";
import "react-big-calendar/lib/css/react-big-calendar.css";
import SearchIcon from "@material-ui/icons/Search";
import DeleteOutlineIcon from "@material-ui/icons/DeleteOutline";
import EditIcon from "@material-ui/icons/Edit";
import AddIcon from "@material-ui/icons/Add";

import "./Schedules.css"; 

const localizer = momentLocalizer(moment);

const defaultMessages = {
  date: "Data",
  time: "Hora",
  event: "Evento",
  allDay: "Dia Todo",
  week: "Semana",
  work_week: "Agendamentos",
  day: "Dia",
  month: "Mês",
  previous: "Anterior",
  next: "Próximo",
  today: "Hoje",
  agenda: "Agenda",
  noEventsInRange: "Não há agendamentos no período.",
  showMore: (total) => `+ ${total} mais`
};

const reducer = (state, action) => {
  if (action.type === "LOAD_SCHEDULES") {
    const schedules = action.payload;
    const newSchedules = [];
    schedules.forEach((schedule) => {
      const index = state.findIndex((s) => s.id === schedule.id);
      if (index !== -1) state[index] = schedule;
      else newSchedules.push(schedule);
    });
    return [...state, ...newSchedules];
  }
  if (action.type === "UPDATE_SCHEDULES") {
    const schedule = action.payload;
    const index = state.findIndex((s) => s.id === schedule.id);
    if (index !== -1) { state[index] = schedule; return [...state]; }
    else return [schedule, ...state];
  }
  if (action.type === "DELETE_SCHEDULE") {
    const id = action.payload;
    const index = state.findIndex((s) => s.id === id);
    if (index !== -1) state.splice(index, 1);
    return [...state];
  }
  if (action.type === "RESET") return [];
};

const useStyles = makeStyles((theme) => ({
  mainContainer: {
    padding: theme.spacing(3),
    backgroundColor: "#F8FAFC",
  },
  mainPaper: {
    borderRadius: "16px",
    border: "1px solid #E2E8F0",
    padding: theme.spacing(2),
    backgroundColor: "#FFFFFF",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
    "& .rbc-calendar": {
        fontFamily: "'Inter', sans-serif",
    },
    "& .rbc-toolbar": {
        marginBottom: theme.spacing(3),
        "& .rbc-toolbar-label": {
            fontSize: "1.2rem",
            fontWeight: "bold",
            color: "#1E293B",
        },
        "& button": {
            borderRadius: "8px",
            border: "1px solid #E2E8F0",
            color: "#64748B",
            fontWeight: "bold",
            padding: "8px 16px",
            transition: "all 0.2s",
            "&:hover": {
                backgroundColor: "#F1F5F9",
                color: "#1E293B",
            },
            "&.rbc-active": {
                backgroundColor: "#2563EB",
                color: "#FFFFFF",
                borderColor: "#2563EB",
            }
        }
    },
    "& .rbc-month-view": {
        borderRadius: "12px",
        overflow: "hidden",
        border: "1px solid #E2E8F0",
    },
    "& .rbc-header": {
        padding: "12px",
        backgroundColor: "#F8FAFC",
        fontWeight: "bold",
        color: "#64748B",
        textTransform: "uppercase",
        fontSize: "0.75rem",
    }
  },
  btnNovo: {
    backgroundColor: "#2563EB",
    color: "#FFFFFF",
    borderRadius: "8px",
    padding: "8px 20px",
    fontWeight: "bold",
    textTransform: "none",
    "&:hover": {
      backgroundColor: "#1D4ED8",
    },
  },
  searchField: {
    backgroundColor: "#FFFFFF",
    borderRadius: "8px",
    "& .MuiOutlinedInput-root": {
        borderRadius: "8px",
    }
  },
  eventWrapper: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "2px 4px",
      borderRadius: "4px",
      backgroundColor: "#DBEAFE",
      color: "#1E40AF",
      border: "1px solid #BFDBFE",
      fontSize: "0.8rem",
      fontWeight: "bold"
  },
  actionIcons: {
      display: "flex",
      gap: "2px",
      "& svg": {
          fontSize: "14px",
          cursor: "pointer",
          opacity: 0.6,
          "&:hover": { opacity: 1 }
      }
  }
}));

const Schedules = () => {
  const classes = useStyles();
  const history = useHistory();
  const { user, socket } = useContext(AuthContext);

  const [loading, setLoading] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [deletingSchedule, setDeletingSchedule] = useState(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [searchParam, setSearchParam] = useState("");
  const [schedules, dispatch] = useReducer(reducer, []);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);

  const { getPlanCompany } = usePlans();

  useEffect(() => {
    async function fetchData() {
      const planConfigs = await getPlanCompany(undefined, user.companyId);
      if (!planConfigs.plan.useSchedules) {
        toast.error("Permissão negada!");
        history.push(`/`);
      }
    }
    fetchData();
  }, [user, history, getPlanCompany]);

  const fetchSchedules = useCallback(async () => {
    try {
      const { data } = await api.get("/schedules", { params: { searchParam, pageNumber } });
      dispatch({ type: "LOAD_SCHEDULES", payload: data.schedules });
      setHasMore(data.hasMore);
      setLoading(false);
    } catch (err) { toastError(err); }
  }, [searchParam, pageNumber]);

  useEffect(() => {
    dispatch({ type: "RESET" });
    setPageNumber(1);
  }, [searchParam]);

  useEffect(() => {
    setLoading(true);
    const delayDebounceFn = setTimeout(() => { fetchSchedules(); }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchParam, pageNumber, fetchSchedules]);

  useEffect(() => {
    const onCompanySchedule = (data) => {
      if (data.action === "update" || data.action === "create") dispatch({ type: "UPDATE_SCHEDULES", payload: data.schedule });
      if (data.action === "delete") dispatch({ type: "DELETE_SCHEDULE", payload: +data.scheduleId });
    }
    socket.on(`company${user.companyId}-schedule`, onCompanySchedule);
    return () => socket.off(`company${user.companyId}-schedule`, onCompanySchedule);
  }, [socket, user.companyId]);

  const handleOpenScheduleModal = () => { setSelectedSchedule(null); setScheduleModalOpen(true); };
  const handleCloseScheduleModal = () => { setSelectedSchedule(null); setScheduleModalOpen(false); };
  const handleEditSchedule = (schedule) => { setSelectedSchedule(schedule); setScheduleModalOpen(true); };

  const handleDeleteSchedule = async (scheduleId) => {
    try {
      await api.delete(`/schedules/${scheduleId}`);
      toast.success("Agendamento excluído!");
    } catch (err) { toastError(err); }
    setConfirmModalOpen(false);
    dispatch({ type: "RESET" });
    setPageNumber(1);
    fetchSchedules();
  };

  return (
    <MainContainer className={classes.mainContainer}>
      <ConfirmationModal title="Excluir Agendamento" open={confirmModalOpen} onClose={() => setConfirmModalOpen(false)} onConfirm={() => handleDeleteSchedule(deletingSchedule.id)}>
        Deseja realmente excluir este agendamento?
      </ConfirmationModal>
      {scheduleModalOpen && (
        <ScheduleModal open={scheduleModalOpen} onClose={handleCloseScheduleModal} reload={fetchSchedules} scheduleId={selectedSchedule?.id} />
      )}
      
      <MainHeader>
        <Title>Agendamentos ({schedules.length})</Title>
        <MainHeaderButtonsWrapper>
          <TextField
            className={classes.searchField}
            placeholder="Pesquisar..."
            variant="outlined"
            size="small"
            value={searchParam}
            onChange={(e) => setSearchParam(e.target.value.toLowerCase())}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon style={{ color: "#94A3B8" }} />
                </InputAdornment>
              ),
            }}
          />
          <Button variant="contained" className={classes.btnNovo} startIcon={<AddIcon />} onClick={handleOpenScheduleModal}>
            Novo Agendamento
          </Button>
        </MainHeaderButtonsWrapper>
      </MainHeader>

      <Paper className={classes.mainPaper} elevation={0}>
        <Calendar
          messages={defaultMessages}
          formats={{ agendaDateFormat: "DD/MM ddd", weekdayFormat: "dddd" }}
          localizer={localizer}
          events={schedules.map((s) => ({
            title: (
              <div className={classes.eventWrapper}>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{s?.contact?.name}</span>
                <div className={classes.actionIcons}>
                  <EditIcon onClick={() => handleEditSchedule(s)} />
                  <DeleteOutlineIcon onClick={() => { setDeletingSchedule(s); setConfirmModalOpen(true); }} />
                </div>
              </div>
            ),
            start: new Date(s.sendAt),
            end: new Date(s.sendAt),
          }))}
          startAccessor="start"
          endAccessor="end"
          style={{ height: "calc(100vh - 200px)" }}
        />
      </Paper>
    </MainContainer>
  );
};

export default Schedules;