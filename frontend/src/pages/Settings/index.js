import React, { useState, useEffect, useContext } from "react";
import { makeStyles } from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";
import Container from "@material-ui/core/Container";
import Select from "@material-ui/core/Select";
import { toast } from "react-toastify";
import { Box, Grid, MenuItem, FormControl, InputLabel } from "@material-ui/core";

import api from "../../services/api";
import { i18n } from "../../translate/i18n.js";
import toastError from "../../errors/toastError";
import { AuthContext } from "../../context/Auth/AuthContext";
import MainContainer from "../../components/MainContainer";

const useStyles = makeStyles((theme) => ({
  root: {
    backgroundColor: "#F8FAFC",
    minHeight: "100vh",
    paddingBottom: theme.spacing(4),
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
  settingsCard: {
    padding: theme.spacing(3),
    borderRadius: "12px",
    border: "1px solid #E2E8F0",
    boxShadow: "none",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing(2),
    transition: "all 0.2s",
    "&:hover": {
        borderColor: "#CBD5E1",
        backgroundColor: "#F1F5F9"
    }
  },
  toggleContainer: {
    display: "flex",
    borderRadius: "8px",
    overflow: "hidden",
    border: "1px solid #E2E8F0",
    backgroundColor: "#fff"
  },
  toggleButton: {
    padding: "8px 16px",
    cursor: "pointer",
    fontSize: "0.85rem",
    fontWeight: "bold",
    transition: "all 0.2s",
    border: "none",
    outline: "none"
  },
  activeButton: {
    backgroundColor: "#006B76",
    color: "#fff",
  },
  inactiveButton: {
    backgroundColor: "transparent",
    color: "#64748B",
    "&:hover": {
        backgroundColor: "#F1F5F9"
    }
  },
  selectField: {
    minWidth: 150,
    "& .MuiOutlinedInput-root": {
        borderRadius: "10px",
    }
  }
}));

const Settings = () => {
  const classes = useStyles();
  const { user, socket } = useContext(AuthContext);
  const [settings, setSettings] = useState([]);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const { data } = await api.get("/settings");
        setSettings(data);
      } catch (err) {
        toastError(err);
      }
    };
    fetchSession();
  }, []);

  useEffect(() => {
    const companyId = user.companyId;
    const onSettingsEvent = (data) => {
      if (data.action === "update") {
        setSettings((prevState) => {
          const aux = [...prevState];
          const settingIndex = aux.findIndex((s) => s.key === data.setting.key);
          if (settingIndex !== -1) {
            aux[settingIndex].value = data.setting.value;
          }
          return aux;
        });
      }
    };
    socket.on(`company-${companyId}-settings`, onSettingsEvent);
    return () => {
      socket.off(`company-${companyId}-settings`, onSettingsEvent);
    };
  }, [socket]);

  const handleChangeSetting = async (key, value) => {
    try {
      await api.put(`/settings/${key}`, { value });
      toast.success(i18n.t("settings.success"));
    } catch (err) {
      toastError(err);
    }
  };

  const getSettingValue = (key) => {
    const setting = settings.find((s) => s.key === key);
    return setting ? setting.value : "";
  };

  const renderToggleButton = (key, label, description) => {
    const value = getSettingValue(key);
    return (
        <Paper className={classes.settingsCard} elevation={0}>
            <Box>
                <Typography variant="subtitle1" style={{ fontWeight: 700, color: "#1E293B" }}>{label}</Typography>
                <Typography variant="body2" style={{ color: "#64748B" }}>{description}</Typography>
            </Box>
            <div className={classes.toggleContainer}>
                <button 
                    className={`${classes.toggleButton} ${value === "disabled" ? classes.activeButton : classes.inactiveButton}`}
                    onClick={() => handleChangeSetting(key, "disabled")}
                >
                    Desabilitado
                </button>
                <button 
                    className={`${classes.toggleButton} ${value === "enabled" ? classes.activeButton : classes.inactiveButton}`}
                    onClick={() => handleChangeSetting(key, "enabled")}
                >
                    Habilitado
                </button>
            </div>
        </Paper>
    );
  };

  const renderSelectSetting = (key, label, description, options) => {
    const value = getSettingValue(key);
    return (
        <Paper className={classes.settingsCard} elevation={0}>
            <Box>
                <Typography variant="subtitle1" style={{ fontWeight: 700, color: "#1E293B" }}>{label}</Typography>
                <Typography variant="body2" style={{ color: "#64748B" }}>{description}</Typography>
            </Box>
            <FormControl variant="outlined" size="small" className={classes.selectField}>
                <Select
                    value={value}
                    onChange={(e) => handleChangeSetting(key, e.target.value)}
                >
                    {options.map((opt) => (
                        <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                    ))}
                </Select>
            </FormControl>
        </Paper>
    );
  };

  return (
    <MainContainer className={classes.root}>
      <Box className={classes.headerBox}>
        <Box>
            <Typography variant="h5" style={{ fontWeight: "bold", color: "#1E293B" }}>Configurações do Sistema</Typography>
            <Typography variant="body2" style={{ color: "#64748B" }}>Ajuste os parâmetros globais da sua plataforma de atendimento.</Typography>
        </Box>
      </Box>

      <Container maxWidth="lg" style={{ padding: 0 }}>
        <Grid container spacing={2}>
            <Grid item xs={12}>
                {renderToggleButton("userCreation", "Avaliações", "Ativa o fluxo de avaliação após o encerramento do atendimento.")}
                {renderSelectSetting("scheduleType", "Agendamento de Expediente", "Define a regra de horário de expediente aplicada ao atendimento.", [
                    { value: "disabled", label: "Desabilitado" },
                    { value: "company", label: "Empresa" },
                    { value: "queue", label: "Fila" }
                ])}
                {renderToggleButton("CheckMsgIsGroup", "Enviar saudação ao aceitar o ticket", "Envia uma mensagem automática ao assumir um ticket.")}
                {renderToggleButton("call", "Escolher atendente aleatório", "Distribui atendimento de forma automática e aleatória entre atendentes.")}
                {renderToggleButton("sideMenu", "Enviar mensagem transferência de setor/atendente", "Envia mensagem automática quando o ticket for transferido.")}
                {renderSelectSetting("chatBotType", "Tipo do Bot", "Define como o menu inicial do bot será exibido para o cliente.", [
                    { value: "text", label: "Texto" },
                    { value: "button", label: "Botão" },
                    { value: "list", label: "Lista" }
                ])}
                {renderToggleButton("rejectCalls", "Informar que não aceita ligação no whatsapp", "Envia uma mensagem ao cliente avisando que não aceita chamadas de voz/vídeo.")}
            </Grid>
        </Grid>
      </Container>
    </MainContainer>
  );
};

export default Settings;
