import React, { useState, useEffect, useReducer, useContext } from "react";
import { toast } from "react-toastify";
import { useHistory } from "react-router-dom";
import { makeStyles, useTheme } from "@material-ui/core/styles";
import { 
  Paper, 
  Avatar, 
  TextField, 
  InputAdornment, 
  IconButton, 
  Typography, 
  Box, 
  Grid, 
  Button, 
  CircularProgress, 
  Menu, 
  MenuItem,
  Tooltip 
} from "@material-ui/core";

import WhatsAppIcon from "@material-ui/icons/WhatsApp";
import SearchIcon from "@material-ui/icons/Search";
import DeleteOutlineIcon from "@material-ui/icons/DeleteOutline";
import EditIcon from "@material-ui/icons/Edit";
import MoreVertIcon from "@material-ui/icons/MoreVert";
import AddIcon from "@material-ui/icons/Add";
import AccountTreeOutlinedIcon from "@material-ui/icons/AccountTreeOutlined";

import api from "../../services/api";
import TableRowSkeleton from "../../components/TableRowSkeleton";
import ConfirmationModal from "../../components/ConfirmationModal";
import { i18n } from "../../translate/i18n";
import MainHeader from "../../components/MainHeader";
import Title from "../../components/Title";
import MainHeaderButtonsWrapper from "../../components/MainHeaderButtonsWrapper";
import MainContainer from "../../components/MainContainer";
import toastError from "../../errors/toastError";
import { AuthContext } from "../../context/Auth/AuthContext";
import FlowBuilderModal from "../../components/FlowBuilderModal";

const reducer = (state, action) => {
  if (action.type === "LOAD_FLOWS") {
    const flows = action.payload;
    const newFlows = [];
    flows.forEach(flow => {
      const index = state.findIndex(f => f.id === flow.id);
      if (index !== -1) state[index] = flow;
      else newFlows.push(flow);
    });
    return [...state, ...newFlows];
  }
  if (action.type === "RESET") return [];
  return state;
};

const useStyles = makeStyles(theme => ({
  mainContainer: {
    padding: theme.spacing(3),
    backgroundColor: "#F8FAFC",
  },
  mainPaper: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: theme.spacing(2),
    border: "1px solid #E2E8F0",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
  },
  tableHeader: {
    padding: "12px 16px",
    backgroundColor: "#F1F5F9",
    borderRadius: "8px",
    marginBottom: theme.spacing(1),
    "& div": {
        color: "#475569",
        fontWeight: "bold",
        textTransform: "uppercase",
        fontSize: "0.75rem",
    }
  },
  flowRow: {
    padding: "12px 16px",
    backgroundColor: "#FFFFFF",
    borderRadius: "8px",
    marginBottom: theme.spacing(1),
    border: "1px solid #F1F5F9",
    transition: "all 0.2s",
    cursor: "pointer",
    "&:hover": {
        backgroundColor: "#F8FAFC",
        borderColor: "#CBD5E1",
        transform: "translateY(-1px)",
    }
  },
  flowName: {
      fontWeight: "bold",
      color: "#1E293B",
  },
  statusActive: { color: "#22C55E", fontWeight: "bold" },
  statusInactive: { color: "#EF4444", fontWeight: "bold" },
  actionButton: {
      color: "#64748B",
      "&:hover": { color: "#1E293B" }
  },
  btnNovo: {
    backgroundColor: "#2563EB",
    color: "#FFFFFF",
    fontWeight: "bold",
    textTransform: "none",
    borderRadius: "8px",
    "&:hover": { backgroundColor: "#1D4ED8" }
  }
}));

const FlowBuilder = () => {
  const classes = useStyles();
  const theme = useTheme();
  const history = useHistory();

  const [loading, setLoading] = useState(false);
  const [searchParam, setSearchParam] = useState("");
  const [flows, dispatch] = useReducer(reducer, []);
  const [selectedFlow, setSelectedFlow] = useState(null);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmDuplicateOpen, setConfirmDuplicateOpen] = useState(false);
  const [reloadData, setReloadData] = useState(false);
  const { user } = useContext(AuthContext);

  const [anchorEl, setAnchorEl] = useState(null);
  const openMenu = Boolean(anchorEl);

  useEffect(() => {
    setLoading(true);
    const fetchFlows = async () => {
      try {
        const { data } = await api.get("/flowbuilder");
        dispatch({ type: "LOAD_FLOWS", payload: data.flows });
        setLoading(false);
      } catch (err) { toastError(err); }
    };
    fetchFlows();
  }, [reloadData]);

  const handleOpenFlowModal = () => { setSelectedFlow(null); setContactModalOpen(true); };
  const handleCloseFlowModal = () => { setSelectedFlow(null); setContactModalOpen(false); };

  const handleDeleteFlow = async flowId => {
    try {
      await api.delete(`/flowbuilder/${flowId}`);
      toast.success("Fluxo excluído!");
      setReloadData(old => !old);
    } catch (err) { toastError(err); }
    setConfirmOpen(false);
  };

  const handleDuplicateFlow = async flowId => {
    try {
      await api.post(`/flowbuilder/duplicate`, { flowId });
      toast.success("Fluxo duplicado!");
      setReloadData(old => !old);
    } catch (err) { toastError(err); }
    setConfirmDuplicateOpen(false);
  };

  const handleMenuClick = (event, flow) => {
    setAnchorEl(event.currentTarget);
    setSelectedFlow(flow);
  };

  const handleMenuClose = () => setAnchorEl(null);

  return (
    <MainContainer className={classes.mainContainer}>
      <FlowBuilderModal
        open={contactModalOpen}
        onClose={handleCloseFlowModal}
        flowId={selectedFlow?.id}
        nameWebhook={selectedFlow?.name}
        onSave={() => setReloadData(old => !old)}
      />
      <ConfirmationModal
        title="Excluir Fluxo"
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => handleDeleteFlow(selectedFlow.id)}
      >
        Tem certeza que deseja deletar este fluxo?
      </ConfirmationModal>
      <ConfirmationModal
        title="Duplicar Fluxo"
        open={confirmDuplicateOpen}
        onClose={() => setConfirmDuplicateOpen(false)}
        onConfirm={() => handleDuplicateFlow(selectedFlow.id)}
      >
        Deseja duplicar o fluxo {selectedFlow?.name}?
      </ConfirmationModal>

      <MainHeader>
        <Title>Fluxos de Conversa</Title>
        <MainHeaderButtonsWrapper>
          <TextField
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
          <Button variant="contained" className={classes.btnNovo} startIcon={<AddIcon />} onClick={handleOpenFlowModal}>
            Adicionar Fluxo
          </Button>
        </MainHeaderButtonsWrapper>
      </MainHeader>

      <Paper className={classes.mainPaper} elevation={0}>
        <Box className={classes.tableHeader}>
            <Grid container>
                <Grid item xs={6}>Nome</Grid>
                <Grid item xs={3} align="center">Status</Grid>
                <Grid item xs={3} align="right">Ações</Grid>
            </Grid>
        </Box>

        <Box>
          {loading ? <CircularProgress style={{ display: "block", margin: "20px auto" }} /> : (
            flows.filter(f => f.name.toLowerCase().includes(searchParam)).map(flow => (
              <Box key={flow.id} className={classes.flowRow}>
                <Grid container alignItems="center">
                  <Grid item xs={6} onClick={() => history.push(`/flowbuilder/${flow.id}`)}>
                    <Box display="flex" alignItems="center">
                        <AccountTreeOutlinedIcon style={{ color: "#2563EB", marginRight: 16 }} />
                        <Typography className={classes.flowName}>{flow.name}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={3} align="center" onClick={() => history.push(`/flowbuilder/${flow.id}`)}>
                    <Typography className={flow.active ? classes.statusActive : classes.statusInactive}>
                        {flow.active ? "Ativo" : "Desativado"}
                    </Typography>
                  </Grid>
                  <Grid item xs={3} align="right">
                    <IconButton className={classes.actionButton} onClick={(e) => handleMenuClick(e, flow)}>
                        <MoreVertIcon />
                    </IconButton>
                  </Grid>
                </Grid>
              </Box>
            ))
          )}
        </Box>

        <Menu anchorEl={anchorEl} open={openMenu} onClose={handleMenuClose}>
          <MenuItem onClick={() => { handleMenuClose(); setContactModalOpen(true); }}>Editar Nome</MenuItem>
          <MenuItem onClick={() => { handleMenuClose(); history.push(`/flowbuilder/${selectedFlow.id}`); }}>Editar Fluxo</MenuItem>
          <MenuItem onClick={() => { handleMenuClose(); setConfirmDuplicateOpen(true); }}>Duplicar</MenuItem>
          <MenuItem onClick={() => { handleMenuClose(); setConfirmOpen(true); }}>Excluir</MenuItem>
        </Menu>
      </Paper>
    </MainContainer>
  );
};

export default FlowBuilder;
