import React, { useState, useCallback, useContext, useEffect } from "react";
import { toast } from "react-toastify";
import { format, parseISO } from "date-fns";
import { makeStyles } from "@material-ui/core/styles";
import clsx from "clsx";
import {
  Button,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
  Table,
  TableHead,
  Paper,
  Tooltip,
  Typography,
  CircularProgress,
  Box,
} from "@material-ui/core";
import {
  Edit,
  CheckCircle,
  SignalCellularConnectedNoInternet2Bar,
  SignalCellularConnectedNoInternet0Bar,
  SignalCellular4Bar,
  CropFree,
  DeleteOutline,
  Facebook,
  Instagram,
  WhatsApp,
  Sync,
  HelpOutline
} from "@material-ui/icons";

import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import MainHeaderButtonsWrapper from "../../components/MainHeaderButtonsWrapper";
import Title from "../../components/Title";
import TableRowSkeleton from "../../components/TableRowSkeleton";

import api from "../../services/api";
import WhatsAppModal from "../../components/WhatsAppModal";
import ConfirmationModal from "../../components/ConfirmationModal";
import QrcodeModal from "../../components/QrcodeModal";
import { i18n } from "../../translate/i18n";
import { WhatsAppsContext } from "../../context/WhatsApp/WhatsAppsContext";
import toastError from "../../errors/toastError";
import formatSerializedId from "../../utils/formatSerializedId";
import { AuthContext } from "../../context/Auth/AuthContext";

const useStyles = makeStyles((theme) => ({
  mainContainer: {
    padding: theme.spacing(3),
    backgroundColor: "#F8FAFC",
  },
  mainPaper: {
    borderRadius: "12px",
    border: "1px solid #E2E8F0",
    overflow: "hidden",
    boxShadow: "0 4px 15px rgba(0, 0, 0, 0.05)",
  },
  tableHead: {
    backgroundColor: "#F1F5F9",
    "& th": {
      color: "#475569",
      fontWeight: "bold",
      textTransform: "uppercase",
      fontSize: "0.75rem",
      borderBottom: "2px solid #E2E8F0"
    }
  },
  actionButton: {
    borderRadius: "8px",
    fontWeight: "bold",
    textTransform: "none",
    margin: "0 4px",
    boxShadow: "none",
    "&:hover": { boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }
  },
  btnNova: { backgroundColor: "#310d3d", color: "#fff", "&:hover": { backgroundColor: "#4a155c" } },
  btnReiniciar: { backgroundColor: "#310d3d", color: "#fff", "&:hover": { backgroundColor: "#4a155c" } },
  btnSuporte: { backgroundColor: "#310d3d", color: "#fff", "&:hover": { backgroundColor: "#4a155c" } },
  
  statusIcon: { fontSize: 22 },
  connected: { color: "#22C55E" },
  disconnected: { color: "#EF4444", backgroundColor: "#fee2e2", borderRadius: "4px", padding: 2 },
  qrcode: { color: "#F59E0B" },
  
  btnSessao: {
      borderColor: "#cbd5e1",
      color: "#475569",
      fontWeight: "bold",
      "&:hover": { backgroundColor: "#f8fafc" }
  },
  btnQr: {
      borderColor: "#fecaca",
      color: "#dc2626",
      "&:hover": { backgroundColor: "#fef2f2" }
  }
}));

const Connections = () => {
  const classes = useStyles();
  const { whatsApps, loading } = useContext(WhatsAppsContext);
  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedWhatsApp, setSelectedWhatsApp] = useState(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  const handleOpenWhatsAppModal = () => {
    setSelectedWhatsApp(null);
    setWhatsAppModalOpen(true);
  };

  const handleCloseWhatsAppModal = useCallback(() => {
    setWhatsAppModalOpen(false);
    setSelectedWhatsApp(null);
  }, []);

  const handleStartWhatsAppSession = async (id) => {
    try {
      await api.post(`/whatsappsession/${id}`);
    } catch (err) {
      toastError(err);
    }
  };

  const handleOpenQrModal = (whatsApp) => {
    setSelectedWhatsApp(whatsApp);
    setQrModalOpen(true);
    handleStartWhatsAppSession(whatsApp.id);
  };

  const handleCloseQrModal = useCallback(() => {
    setSelectedWhatsApp(null);
    setQrModalOpen(false);
  }, []);

  const handleEditWhatsApp = (whatsApp) => {
    setSelectedWhatsApp(whatsApp);
    setWhatsAppModalOpen(true);
  };

  const handleDisconnect = async (id) => {
    try {
        await api.delete(`/whatsappsession/${id}`);
        toast.success("Desconectado com sucesso");
    } catch (err) {
        toastError(err);
    }
  };

  const handleDelete = async (id) => {
    try {
        await api.delete(`/whatsapp/${id}`);
        toast.success("Conexão removida");
    } catch (err) {
        toastError(err);
    }
  };

  const handleRestart = async () => {
      try {
          await api.post("/whatsapp-restart");
          toast.success("Reiniciando conexões...");
      } catch (err) {
          toastError(err);
      }
  }

  return (
    <MainContainer className={classes.mainContainer}>
      <WhatsAppModal open={whatsAppModalOpen} onClose={handleCloseWhatsAppModal} whatsAppId={selectedWhatsApp?.id} />
      <QrcodeModal open={qrModalOpen} onClose={handleCloseQrModal} whatsAppId={selectedWhatsApp?.id} />
      <ConfirmationModal title="Remover Conexão" open={confirmModalOpen} onClose={() => setConfirmModalOpen(false)} onConfirm={() => { handleDelete(selectedWhatsApp.id); setConfirmModalOpen(false); }}>
          Deseja realmente remover esta conexão?
      </ConfirmationModal>

      <MainHeader>
        <Title>Conexões ({whatsApps.length})</Title>
        <MainHeaderButtonsWrapper>
          <Button variant="contained" className={clsx(classes.actionButton, classes.btnReiniciar)} onClick={handleRestart}>
            REINICIAR CONEXÕES
          </Button>
          <Button variant="contained" className={clsx(classes.actionButton, classes.btnSuporte)} onClick={() => window.open('https://suporte.com', '_blank')}>
            CHAMAR SUPORTE
          </Button>
          <Button variant="contained" className={clsx(classes.actionButton, classes.btnNova)} onClick={handleOpenWhatsAppModal}>
            NOVA CONEXÃO
          </Button>
        </MainHeaderButtonsWrapper>
      </MainHeader>

      <Paper className={classes.mainPaper} elevation={0}>
        <Table size="medium">
          <TableHead className={classes.tableHead}>
            <TableRow>
              <TableCell align="center">Channel</TableCell>
              <TableCell align="center">Nome</TableCell>
              <TableCell align="center">Número do Whatsapp</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="center">Sessão</TableCell>
              <TableCell align="center">Última atualização</TableCell>
              <TableCell align="center">Padrão</TableCell>
              <TableCell align="center">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? <TableRowSkeleton columns={8} /> : (
              <>
                {whatsApps.map((whatsApp) => (
                  <TableRow key={whatsApp.id} hover>
                    <TableCell align="center">
                        {whatsApp.channel === 'whatsapp' ? <WhatsApp style={{color: "#25D366"}} /> : whatsApp.channel === 'facebook' ? <Facebook style={{color: "#1877F2"}} /> : <Instagram style={{color: "#E4405F"}} />}
                    </TableCell>
                    <TableCell align="center">
                        <Typography variant="body2" style={{ fontWeight: "bold", color: "#334155" }}>{whatsApp.name}</Typography>
                    </TableCell>
                    <TableCell align="center">{whatsApp.number ? formatSerializedId(whatsApp.number) : "-"}</TableCell>
                    <TableCell align="center">
                        {whatsApp.status === "CONNECTED" ? (
                            <Tooltip title="Conectado"><CheckCircle className={classes.connected} /></Tooltip>
                        ) : whatsApp.status === "qrcode" ? (
                            <Tooltip title="Aguardando QR Code"><CropFree className={classes.qrcode} /></Tooltip>
                        ) : (
                            <Tooltip title="Desconectado"><SignalCellularConnectedNoInternet0Bar className={classes.disconnected} /></Tooltip>
                        )}
                    </TableCell>
                    <TableCell align="center">
                        <Box display="flex" justifyContent="center" gap={1}>
                            {whatsApp.status === "qrcode" && (
                                <Button size="small" variant="outlined" onClick={() => handleOpenQrModal(whatsApp)} className={clsx(classes.actionButton, classes.btnQr)}>
                                    NOVO QR CODE
                                </Button>
                            )}
                            {(whatsApp.status === "DISCONNECTED" || whatsApp.status === "TIMEOUT") && (
                                <>
                                    <Button size="small" variant="outlined" onClick={() => handleOpenQrModal(whatsApp)} className={clsx(classes.actionButton, classes.btnSessao)}>
                                        TENTAR NOVAMENTE
                                    </Button>
                                    <Button size="small" variant="outlined" onClick={() => handleOpenQrModal(whatsApp)} className={clsx(classes.actionButton, classes.btnQr)}>
                                        NOVO QR CODE
                                    </Button>
                                </>
                            )}
                            {whatsApp.status === "CONNECTED" && (
                                <Button size="small" variant="outlined" color="secondary" onClick={() => handleDisconnect(whatsApp.id)} className={classes.actionButton}>
                                    DESCONECTAR
                                </Button>
                            )}
                        </Box>
                    </TableCell>
                    <TableCell align="center">
                        <Typography variant="caption" style={{ color: "#64748B" }}>
                            {format(parseISO(whatsApp.updatedAt), "dd/MM/yy HH:mm")}
                        </Typography>
                    </TableCell>
                    <TableCell align="center">{whatsApp.isDefault ? <CheckCircle className={classes.connected} /> : "-"}</TableCell>
                    <TableCell align="center">
                        <IconButton size="small" onClick={() => handleEditWhatsApp(whatsApp)}><Edit style={{color: "#64748B"}} /></IconButton>
                        <IconButton size="small" onClick={() => { setSelectedWhatsApp(whatsApp); setConfirmModalOpen(true); }}><DeleteOutline style={{color: "#EF4444"}} /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </>
            )}
          </TableBody>
        </Table>
      </Paper>
    </MainContainer>
  );
};

export default Connections;
