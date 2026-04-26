/* eslint-disable no-unused-vars */

import { useTheme } from "@material-ui/core/styles";
import React, { useState, useEffect, useReducer, useContext } from "react";
import { toast } from "react-toastify";

import { useHistory } from "react-router-dom";

import { makeStyles } from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";
import Button from "@material-ui/core/Button";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import IconButton from "@material-ui/core/IconButton";
import SearchIcon from "@material-ui/icons/Search";
import TextField from "@material-ui/core/TextField";
import InputAdornment from "@material-ui/core/InputAdornment";

import DeleteOutlineIcon from "@material-ui/icons/DeleteOutline";
import EditIcon from "@material-ui/icons/Edit";
import DescriptionIcon from "@material-ui/icons/Description";
import TimerOffIcon from "@material-ui/icons/TimerOff";
import PlayCircleOutlineIcon from "@material-ui/icons/PlayCircleOutline";
import PauseCircleOutlineIcon from "@material-ui/icons/PauseCircleOutline";

import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import Title from "../../components/Title";

import api from "../../services/api";
import { i18n } from "../../translate/i18n";
import TableRowSkeleton from "../../components/TableRowSkeleton";
import CampaignModal from "../../components/CampaignModal";
import ConfirmationModal from "../../components/ConfirmationModal";
import toastError from "../../errors/toastError";
import { isArray } from "lodash";
import { useDate } from "../../hooks/useDate";
import { SocketContext } from "../../context/Socket/SocketContext";
import { AddCircle, Build, DevicesFold, TextFields } from "@mui/icons-material";
import { CircularProgress, Grid, Stack } from "@mui/material";
import { Can } from "../../components/Can";
import { AuthContext } from "../../context/Auth/AuthContext";
import CampaignModalPhrase from "../../components/CampaignModalPhrase";
import { colorBackgroundTable, colorLineTable, colorLineTableHover, colorTopTable } from "../../styles/styles";

const reducer = (state, action) => {
  if (action.type === "LOAD_CAMPAIGNS") {
    const campaigns = action.payload;
    const newCampaigns = [];

    if (isArray(campaigns)) {
      campaigns.forEach(campaign => {
        const campaignIndex = state.findIndex(u => u.id === campaign.id);
        if (campaignIndex !== -1) {
          state[campaignIndex] = campaign;
        } else {
          newCampaigns.push(campaign);
        }
      });
    }

    return [...state, ...newCampaigns];
  }

  if (action.type === "UPDATE_CAMPAIGNS") {
    const campaign = action.payload;
    const campaignIndex = state.findIndex(u => u.id === campaign.id);

    if (campaignIndex !== -1) {
      state[campaignIndex] = campaign;
      return [...state];
    } else {
      return [campaign, ...state];
    }
  }

  if (action.type === "DELETE_CAMPAIGN") {
    const campaignId = action.payload;

    const campaignIndex = state.findIndex(u => u.id === campaignId);
    if (campaignIndex !== -1) {
      state.splice(campaignIndex, 1);
    }
    return [...state];
  }

  if (action.type === "RESET") {
    return [];
  }
};

const useStyles = makeStyles(theme => ({
  mainPaper: {
    flex: 1,
    padding: theme.spacing(3),
    overflowY: "auto",
    ...theme.scrollbarStyles,
    borderRadius: "24px",
    border: "1px solid rgba(255, 255, 255, 0.3)",
    background: "rgba(255, 255, 255, 0.8)",
    backdropFilter: "blur(10px)",
    boxShadow: "0 10px 40px rgba(0,0,0,0.03)",
  }
}));

const CampaignsPhrase = () => {
  const classes = useStyles();
  const theme = useTheme();

  const history = useHistory();

  const { user } = useContext(AuthContext);

  const [loading, setLoading] = useState(true);
  const [pageNumber, setPageNumber] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [deletingCampaign, setDeletingCampaign] = useState(null);
  const [campaignModalOpen, setCampaignModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [searchParam, setSearchParam] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deletingContact, setDeletingContact] = useState(null);

  const [campaignflows, setCampaignFlows] = useState([]);
  const [ModalOpenPhrase, setModalOpenPhrase] = useState(false);
  const [campaignflowSelected, setCampaignFlowSelected] = useState();

  const handleDeleteCampaign = async campaignId => {
    try {
      await api.delete(`/flowcampaign/${campaignId}`);
      toast.success("Frase deletada");
      getCampaigns()
    } catch (err) {
      toastError(err);
    }
    
  };

  const getCampaigns =  async() => {
    setLoading(true);
    await api.get("/flowcampaign").then(res => {
      setCampaignFlows(res.data.flow);
      setLoading(false);
    });
  };

  const onSaveModal = () => {
    getCampaigns()
  }

  const handleScroll = e => {
    if (!hasMore || loading) return;
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - (scrollTop + 100) < clientHeight) {
    }
  };

  useEffect(() => {
    getCampaigns();
  }, []);

  return (
    <MainContainer>
      <ConfirmationModal
        title={
          deletingCampaign &&
          `${i18n.t("campaigns.confirmationModal.deleteTitle")} ${
            deletingCampaign.name
          }?`
        }
        open={confirmModalOpen}
        onClose={setConfirmModalOpen}
        onConfirm={() => handleDeleteCampaign(deletingContact.id)}
      >
        {i18n.t("campaigns.confirmationModal.deleteMessage")}
      </ConfirmationModal>
      <CampaignModalPhrase
        open={ModalOpenPhrase}
        onClose={() => setModalOpenPhrase(false)}
        FlowCampaignId={campaignflowSelected}
        onSave={onSaveModal}
      />
      <MainHeader>
        <Grid style={{ width: "99.6%" }} container>
          <Grid xs={12} sm={8} item>
            <Title>Campanhas</Title>
          </Grid>
          <Grid xs={12} sm={4} item>
            <Grid spacing={2} container>
              <Grid xs={6} sm={6} item>
                {/* <TextField
                  fullWidth
                  placeholder={i18n.t("campaigns.searchPlaceholder")}
                  type="search"
                  value={searchParam}
                  onChange={handleSearch}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon style={{ color: "gray" }} />
                      </InputAdornment>
                    ),
                  }}
                /> */}
              </Grid>
              <Grid xs={6} sm={6} item>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={() => {
                    setCampaignFlowSelected();
                    setModalOpenPhrase(true);
                  }}
                  sx={{
                    background: "linear-gradient(135deg, #00b4db 0%, #045de9 100%)",
                    color: "#fff",
                    fontWeight: 700,
                    borderRadius: "12px",
                    padding: "10px 20px",
                    boxShadow: "0 8px 20px rgba(0, 180, 219, 0.2)",
                    textTransform: "none",
                  }}
                >
                  <Stack direction={"row"} gap={1}>
                    <AddCircle />
                    {"Campanha"}
                  </Stack>
                </Button>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </MainHeader>
      <Paper
        className={classes.mainPaper}
        variant="outlined"
        onScroll={handleScroll}
      >
        <Stack>
          <Grid container style={{ padding: "16px", marginBottom: "8px" }}>
            <Grid item xs={4} style={{ fontWeight: 800, textTransform: "uppercase", fontSize: "0.75rem", color: "#888" }}>
              Nome
            </Grid>
            <Grid item xs={4} style={{ fontWeight: 800, textTransform: "uppercase", fontSize: "0.75rem", color: "#888" }} align="center">
              Status
            </Grid>
            <Grid item xs={4} align="end" style={{ fontWeight: 800, textTransform: "uppercase", fontSize: "0.75rem", color: "#888" }}>
              {i18n.t("contacts.table.actions")}
            </Grid>
          </Grid>
          <>
            {!loading &&
              campaignflows.map(flow => (
                <Grid
                  container
                  key={flow.id}
                  sx={{
                    padding: "16px",
                    background: "rgba(255, 255, 255, 0.5)",
                    borderRadius: "16px",
                    marginTop: 1.5,
                    border: "1px solid rgba(0,0,0,0.05)",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      background: "rgba(255, 255, 255, 0.9)",
                      transform: "translateY(-2px)",
                      boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
                    },
                  }}
                >
                  <Grid item xs={4}>
                    <Stack
                      justifyContent={"center"}
                      height={"100%"}
                      style={{ color: "#333", fontWeight: 700 }}
                    >
                      <Stack direction={"row"}>
                        <TextFields />
                        <Stack justifyContent={"center"} marginLeft={1}>
                          {flow.name}
                        </Stack>
                      </Stack>
                    </Stack>
                  </Grid>
                  <Grid item xs={4} align="center" style={{ color: "#666" }}>
                    <Stack justifyContent={"center"} height={"100%"} direction="row" alignItems="center" gap={1}>
                      <Box sx={{ width: 8, height: 8, borderRadius: "50%", background: flow.status ? "#25d366" : "#ff4d4d" }} />
                      {flow.status ? "Ativo" : "Desativado"}
                    </Stack>
                  </Grid>
                  <Grid item xs={4} align="end">
                    <IconButton
                      size="small"
                      onClick={() => {
                        setCampaignFlowSelected(flow.id);
                        setModalOpenPhrase(true);
                      }}
                    >
                      <EditIcon style={{ color: "#333" }} />
                    </IconButton>
                    <Can
                      role={user.profile}
                      perform="contacts-page:deleteContact"
                      yes={() => (
                        <IconButton
                          size="small"
                          onClick={e => {
                            setConfirmModalOpen(true);
                            setDeletingContact(flow);
                          }}
                        >
                          <DeleteOutlineIcon style={{ color: "#333" }} />
                        </IconButton>
                      )}
                    />
                  </Grid>
                </Grid>
              ))}
            {loading && (
              <Stack
                justifyContent={"center"}
                alignItems={"center"}
                minHeight={"50vh"}
              >
                <CircularProgress />
              </Stack>
            )}
          </>
        </Stack>
      </Paper>
    </MainContainer>
  );
};

export default CampaignsPhrase;
