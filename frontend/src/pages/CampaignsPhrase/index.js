import React, { useState, useEffect, useContext } from "react";
import { toast } from "react-toastify";
import { useHistory } from "react-router-dom";
import { makeStyles, useTheme } from "@material-ui/core/styles";
import { 
  Paper, 
  Button, 
  IconButton, 
  Typography, 
  Box, 
  Grid, 
  CircularProgress
} from "@material-ui/core";

import DeleteOutlineIcon from "@material-ui/icons/DeleteOutline";
import EditIcon from "@material-ui/icons/Edit";
import AddIcon from "@material-ui/icons/Add";
import TextFieldsIcon from "@material-ui/icons/TextFields";

import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import Title from "../../components/Title";
import MainHeaderButtonsWrapper from "../../components/MainHeaderButtonsWrapper";
import api from "../../services/api";
import { i18n } from "../../translate/i18n";
import ConfirmationModal from "../../components/ConfirmationModal";
import toastError from "../../errors/toastError";
import { Can } from "../../components/Can";
import { AuthContext } from "../../context/Auth/AuthContext";
import CampaignModalPhrase from "../../components/CampaignModalPhrase";

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

const CampaignsPhrase = () => {
  const classes = useStyles();
  const theme = useTheme();
  const history = useHistory();
  const { user } = useContext(AuthContext);

  const [loading, setLoading] = useState(true);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [deletingContact, setDeletingContact] = useState(null);
  const [campaignflows, setCampaignFlows] = useState([]);
  const [ModalOpenPhrase, setModalOpenPhrase] = useState(false);
  const [campaignflowSelected, setCampaignFlowSelected] = useState();

  const getCampaigns = async () => {
    setLoading(true);
    try {
        const res = await api.get("/flowcampaign");
        setCampaignFlows(res.data.flow);
    } catch (err) { toastError(err); }
    setLoading(false);
  };

  useEffect(() => {
    getCampaigns();
  }, []);

  const handleDeleteCampaign = async campaignId => {
    try {
      await api.delete(`/flowcampaign/${campaignId}`);
      toast.success("Campanha deletada com sucesso!");
      getCampaigns();
    } catch (err) { toastError(err); }
  };

  return (
    <MainContainer className={classes.mainContainer}>
      <ConfirmationModal
        title={deletingContact && `Excluir Campanha ${deletingContact.name}?`}
        open={confirmModalOpen}
        onClose={setConfirmModalOpen}
        onConfirm={() => handleDeleteCampaign(deletingContact.id)}
      >
        Tem certeza que deseja deletar esta campanha?
      </ConfirmationModal>
      
      <CampaignModalPhrase
        open={ModalOpenPhrase}
        onClose={() => setModalOpenPhrase(false)}
        FlowCampaignId={campaignflowSelected}
        onSave={getCampaigns}
      />

      <MainHeader>
        <Title>Fluxo de Campanhas</Title>
        <MainHeaderButtonsWrapper>
          <Button
            variant="contained"
            className={classes.btnNovo}
            onClick={() => {
              setCampaignFlowSelected(null);
              setModalOpenPhrase(true);
            }}
            startIcon={<AddIcon />}
          >
            Nova Campanha
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
            campaignflows.map(flow => (
              <Box key={flow.id} className={classes.flowRow}>
                <Grid container alignItems="center">
                  <Grid item xs={6}>
                    <Box display="flex" alignItems="center">
                        <TextFieldsIcon style={{ color: "#2563EB", marginRight: 16 }} />
                        <Typography className={classes.flowName}>{flow.name}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={3} align="center">
                    <Typography className={flow.status ? classes.statusActive : classes.statusInactive}>
                        {flow.status ? "Ativo" : "Desativado"}
                    </Typography>
                  </Grid>
                  <Grid item xs={3} align="right">
                    <IconButton
                      size="small"
                      className={classes.actionButton}
                      onClick={() => {
                        setCampaignFlowSelected(flow.id);
                        setModalOpenPhrase(true);
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                    <Can
                      role={user.profile}
                      perform="contacts-page:deleteContact"
                      yes={() => (
                        <IconButton
                          size="small"
                          className={classes.actionButton}
                          onClick={() => {
                            setConfirmModalOpen(true);
                            setDeletingContact(flow);
                          }}
                        >
                          <DeleteOutlineIcon />
                        </IconButton>
                      )}
                    />
                  </Grid>
                </Grid>
              </Box>
            ))
          )}
        </Box>
      </Paper>
    </MainContainer>
  );
};

export default CampaignsPhrase;
