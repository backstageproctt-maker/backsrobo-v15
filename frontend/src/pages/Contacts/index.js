import React, {
  useState,
  useEffect,
  useReducer,
  useContext,
  useRef,
} from "react";
import { toast } from "react-toastify";
import { useHistory } from "react-router-dom";

import { makeStyles, useTheme } from "@material-ui/core/styles";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import Paper from "@material-ui/core/Paper";
import Button from "@material-ui/core/Button";
import Avatar from "@material-ui/core/Avatar";
import { Facebook, Instagram, WhatsApp } from "@material-ui/icons";
import SearchIcon from "@material-ui/icons/Search";

import TextField from "@material-ui/core/TextField";
import InputAdornment from "@material-ui/core/InputAdornment";
import Checkbox from "@material-ui/core/Checkbox";
import IconButton from "@material-ui/core/IconButton";
import DeleteOutlineIcon from "@material-ui/icons/DeleteOutline";
import EditIcon from "@material-ui/icons/Edit";
import CheckCircleIcon from "@material-ui/icons/CheckCircle";
import CancelIcon from "@material-ui/icons/Cancel";
import BlockIcon from "@material-ui/icons/Block";

import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
import Grid from "@material-ui/core/Grid";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import Typography from "@material-ui/core/Typography";
import Box from "@material-ui/core/Box";
import Divider from "@material-ui/core/Divider";
import Tooltip from "@material-ui/core/Tooltip";
import Chip from "@material-ui/core/Chip";

import api from "../../services/api";
import TableRowSkeleton from "../../components/TableRowSkeleton";
import ContactModal from "../../components/ContactModal";
import ConfirmationModal from "../../components/ConfirmationModal";

import { i18n } from "../../translate/i18n";
import MainHeader from "../../components/MainHeader";
import Title from "../../components/Title";
import MainHeaderButtonsWrapper from "../../components/MainHeaderButtonsWrapper";
import MainContainer from "../../components/MainContainer";
import toastError from "../../errors/toastError";

import { AuthContext } from "../../context/Auth/AuthContext";
import { Can } from "../../components/Can";
import NewTicketModal from "../../components/NewTicketModal";
import { TagsFilter } from "../../components/TagsFilter";
import PopupState, { bindTrigger, bindMenu } from "material-ui-popup-state";
import formatSerializedId from "../../utils/formatSerializedId";
import { v4 as uuidv4 } from "uuid";

import { ArrowDropDown, Backup, ContactPhone } from "@material-ui/icons";
import { Menu, MenuItem } from "@material-ui/core";
import WhatsAppIcon from "@material-ui/icons/WhatsApp";

import ContactImportWpModal from "../../components/ContactImportWpModal";
import useCompanySettings from "../../hooks/useSettings/companySettings";
import { TicketsContext } from "../../context/Tickets/TicketsContext";

import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
} from "react-simple-maps";

// ================= GEO / DDD CONFIG DO MAPA =================
const geoUrl = "https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/brazil-states.geojson";

const markers = [
  { markerOffset: -30, name: "Aracaju", coordinates: [-37.0717, -10.9472] },
  { markerOffset: 15, name: "Belém", coordinates: [-48.4878, -1.4558] },
  { markerOffset: 15, name: "Belo Horizonte", coordinates: [-43.9378, -19.8157] },
  { markerOffset: 15, name: "Boa Vista", coordinates: [-60.6739, 2.8195] },
  { markerOffset: 15, name: "Brasília", coordinates: [-47.8825, -15.7942] },
  { markerOffset: 15, name: "Campo Grande", coordinates: [-54.6464, -20.4428] },
  { markerOffset: 15, name: "Cuiabá", coordinates: [-56.0969, -15.6011] },
  { markerOffset: 15, name: "Curitiba", coordinates: [-49.2736, -25.4296] },
  { markerOffset: 15, name: "Florianópolis", coordinates: [-48.5492, -27.5969] },
  { markerOffset: 15, name: "Fortaleza", coordinates: [-38.5267, -3.71839] },
  { markerOffset: 15, name: "Goiânia", coordinates: [-49.2736, -16.6869] },
  { markerOffset: 15, name: "João Pessoa", coordinates: [-34.8631, -7.1195] },
  { markerOffset: 15, name: "Macapá", coordinates: [-51.0667, 0.0333] },
  { markerOffset: 15, name: "Maceió", coordinates: [-35.7353, -9.6658] },
  { markerOffset: 15, name: "Manaus", coordinates: [-60.025, -3.10194] },
  { markerOffset: 15, name: "Natal", coordinates: [-35.2094, -5.795] },
  { markerOffset: 15, name: "Palmas", coordinates: [-48.3347, -10.1844] },
  { markerOffset: 15, name: "Porto Alegre", coordinates: [-51.23, -30.0331] },
  { markerOffset: 15, name: "Porto Velho", coordinates: [-63.9039, -8.7619] },
  { markerOffset: 15, name: "Recife", coordinates: [-34.8811, -8.05389] },
  { markerOffset: 15, name: "Rio Branco", coordinates: [-67.8099, -9.9747] },
  { markerOffset: 15, name: "Rio de Janeiro", coordinates: [-43.1729, -22.9068] },
  { markerOffset: 15, name: "Salvador", coordinates: [-38.4813, -12.9716] },
  { markerOffset: 15, name: "São Luís", coordinates: [-44.3028, -2.5283] },
  { markerOffset: 15, name: "São Paulo", coordinates: [-46.6333, -23.5505] },
  { markerOffset: 15, name: "Teresina", coordinates: [-42.8039, -5.0892] },
  { markerOffset: 15, name: "Vitória", coordinates: [-40.3378, -20.3194] },
];

const dddList = {
  "11": "São Paulo", "12": "São Paulo", "13": "São Paulo", "14": "São Paulo", "15": "São Paulo", "16": "São Paulo", "17": "São Paulo", "18": "São Paulo", "19": "São Paulo",
  "21": "Rio de Janeiro", "22": "Rio de Janeiro", "24": "Rio de Janeiro",
  "27": "Espírito Santo", "28": "Espírito Santo",
  "31": "Minas Gerais", "32": "Minas Gerais", "33": "Minas Gerais", "34": "Minas Gerais", "35": "Minas Gerais", "37": "Minas Gerais", "38": "Minas Gerais",
  "41": "Paraná", "42": "Paraná", "43": "Paraná", "44": "Paraná", "45": "Paraná", "46": "Paraná",
  "47": "Santa Catarina", "48": "Santa Catarina", "49": "Santa Catarina",
  "51": "Rio Grande do Sul", "53": "Rio Grande do Sul", "54": "Rio Grande do Sul", "55": "Rio Grande do Sul",
  "61": "Distrito Federal/Goiás", "62": "Goiás", "63": "Tocantins", "64": "Goiás",
  "65": "Mato Grosso", "66": "Mato Grosso",
  "67": "Mato Grosso do Sul",
  "68": "Acre",
  "69": "Rondônia",
  "71": "Bahia", "73": "Bahia", "74": "Bahia", "75": "Bahia", "77": "Bahia",
  "79": "Sergipe",
  "81": "Pernambuco", "82": "Alagoas", "83": "Paraíba", "84": "Rio Grande do Norte", "85": "Ceará", "86": "Piauí", "87": "Pernambuco", "88": "Ceará", "89": "Piauí",
  "91": "Pará", "92": "Amazonas", "93": "Pará", "94": "Pará", "95": "Roraima", "96": "Amapá", "97": "Amazonas", "98": "Maranhão", "99": "Maranhão",
};

const reducer = (state, action) => {
  if (action.type === "LOAD_CONTACTS") {
    const contacts = action.payload;
    const newContacts = [];
    contacts.forEach((contact) => {
      const contactIndex = state.findIndex((c) => c.id === contact.id);
      if (contactIndex !== -1) { state[contactIndex] = contact; } else { newContacts.push(contact); }
    });
    return [...state, ...newContacts];
  }
  if (action.type === "UPDATE_CONTACTS") {
    const contact = action.payload;
    const contactIndex = state.findIndex((c) => c.id === contact.id);
    if (contactIndex !== -1) { state[contactIndex] = contact; return [...state]; } else { return [contact, ...state]; }
  }
  if (action.type === "DELETE_CONTACT") {
    const contactId = action.payload;
    const contactIndex = state.findIndex((c) => c.id === contactId);
    if (contactIndex !== -1) { state.splice(contactIndex, 1); }
    return [...state];
  }
  if (action.type === "RESET") { return []; }
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
    padding: theme.spacing(1),
    borderRadius: "12px",
    border: "1px solid #E2E8F0",
    boxShadow: "none",
    overflowY: "scroll",
    ...theme.scrollbarStyles,
  },
  contactCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    border: "1px solid #E2E8F0",
    padding: theme.spacing(2),
    height: "100%",
    transition: "all 0.2s",
    "&:hover": {
      boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
      transform: "translateY(-2px)",
    },
  },
  cardHeader: { display: "flex", alignItems: "center", marginBottom: theme.spacing(1) },
  cardAvatar: { marginRight: theme.spacing(2), width: 48, height: 48 },
  cardNumber: { color: "#64748B", fontSize: "0.85rem" },
  cardFooter: { marginTop: theme.spacing(2), display: "flex", justifyContent: "space-between", alignItems: "center" },
  actionsRight: { display: "flex", gap: theme.spacing(1) },
  actionBtnWhats: { backgroundColor: "#25D366", color: "#fff", "&:hover": { backgroundColor: "#1ebe5b" } },
  actionBtnEdit: { backgroundColor: "#2196f3", color: "#fff", "&:hover": { backgroundColor: "#1976d2" } },
  actionBtnBlock: { backgroundColor: "#ff9800", color: "#fff", "&:hover": { backgroundColor: "#fb8c00" } },
  actionBtnDelete: { backgroundColor: "#f44336", color: "#fff", "&:hover": { backgroundColor: "#e53935" } },
  totalContactsBar: { backgroundColor: "#006B76", padding: "10px", textAlign: "center", color: "white", marginBottom: "20px", borderRadius: "8px" },
  legendCard: { marginBottom: "20px", padding: "15px", backgroundColor: "#F8FAFC", borderRadius: "12px", border: "1px solid #E2E8F0" },
}));

const Contacts = () => {
  const classes = useStyles();
  const history = useHistory();
  const theme = useTheme();
  const { user, socket } = useContext(AuthContext);

  const [loading, setLoading] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [searchParam, setSearchParam] = useState("");
  const [contacts, dispatch] = useReducer(reducer, []);
  const [selectedContactId, setSelectedContactId] = useState(null);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [importContactModalOpen, setImportContactModalOpen] = useState(false);
  const [deletingContact, setDeletingContact] = useState(null);
  const [ImportContacts, setImportContacts] = useState(null);
  const [blockingContact, setBlockingContact] = useState(null);
  const [unBlockingContact, setUnBlockingContact] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmChatsOpen, setConfirmChatsOpen] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [newTicketModalOpen, setNewTicketModalOpen] = useState(false);
  const [contactTicket, setContactTicket] = useState({});
  const fileUploadRef = useRef(null);
  const [selectedTags, setSelectedTags] = useState([]);
  const { setCurrentTicket } = useContext(TicketsContext);
  const [importWhatsappId, setImportWhatsappId] = useState();
  const [selectedContactIds, setSelectedContactIds] = useState([]);
  const [isSelectAllChecked, setIsSelectAllChecked] = useState(false);
  const [confirmDeleteManyOpen, setConfirmDeleteManyOpen] = useState(false);
  const { getAll: getAllSettings } = useCompanySettings();
  const [hideNum, setHideNum] = useState(false);
  const [enableLGPD, setEnableLGPD] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event, newValue) => { setTabValue(newValue); };

  useEffect(() => {
    async function fetchData() {
      const settingList = await getAllSettings(user.companyId);
      for (const [key, value] of Object.entries(settingList)) {
        if (key === "enableLGPD") setEnableLGPD(value === "enabled");
        if (key === "lgpdHideNumber") setHideNum(value === "enabled");
      }
    }
    fetchData();
  }, []);

  const handleImportExcel = async () => {
    try {
      const formData = new FormData();
      formData.append("file", fileUploadRef.current.files[0]);
      await api.request({ url: `/contacts/upload`, method: "POST", data: formData });
      toast.success("Importação concluída!");
      history.go(0);
    } catch (err) { toastError(err); }
  };

  useEffect(() => {
    dispatch({ type: "RESET" });
    setPageNumber(1);
    setSelectedContactIds([]);
    setIsSelectAllChecked(false);
  }, [searchParam, selectedTags]);

  useEffect(() => {
    setLoading(true);
    const fetchContacts = async () => {
      try {
        const { data } = await api.get("/contacts/", {
          params: { searchParam, pageNumber, contactTag: JSON.stringify(selectedTags) },
        });
        dispatch({ type: "LOAD_CONTACTS", payload: data.contacts });
        setHasMore(data.hasMore);
        setLoading(false);
      } catch (err) {
        toastError(err);
      }
    };

    if (searchParam.length > 0) {
      const delayDebounceFn = setTimeout(() => {
        fetchContacts();
      }, 500);
      return () => clearTimeout(delayDebounceFn);
    } else {
      fetchContacts();
    }
  }, [searchParam, pageNumber, selectedTags]);

  useEffect(() => {
    const companyId = user.companyId;
    const onContactEvent = (data) => {
      if (data.action === "update" || data.action === "create") { dispatch({ type: "UPDATE_CONTACTS", payload: data.contact }); }
      if (data.action === "delete") {
        dispatch({ type: "DELETE_CONTACT", payload: +data.contactId });
        setSelectedContactIds((prevSelected) => prevSelected.filter((id) => id !== +data.contactId));
      }
    };
    socket.on(`company-${companyId}-contact`, onContactEvent);
    return () => { socket.off(`company-${companyId}-contact`, onContactEvent); };
  }, [socket, user.companyId]);

  const handleSelectTicket = (ticket) => {
    const code = uuidv4();
    const { id, uuid } = ticket;
    setCurrentTicket({ id, uuid, code });
  };

  const handleCloseOrOpenTicket = (ticket) => {
    setNewTicketModalOpen(false);
    if (ticket !== undefined && ticket.uuid !== undefined) { handleSelectTicket(ticket); history.push(`/tickets/${ticket.uuid}`); }
  };

  const handleSearch = (event) => { setSearchParam(event.target.value.toLowerCase()); };
  const handleOpenContactModal = () => { setSelectedContactId(null); setContactModalOpen(true); };
  const handleCloseContactModal = () => { setSelectedContactId(null); setContactModalOpen(false); };
  const hadleEditContact = (contactId) => { setSelectedContactId(contactId); setContactModalOpen(true); };

  const handleDeleteContact = async (contactId) => {
    try { await api.delete(`/contacts/${contactId}`); toast.success(i18n.t("contacts.toasts.deleted")); } catch (err) { toastError(err); }
    setDeletingContact(null);
  };

  const handleToggleSelectContact = (contactId) => (event) => {
    if (event.target.checked) { setSelectedContactIds((prevSelected) => [...prevSelected, contactId]); } 
    else { setSelectedContactIds((prevSelected) => prevSelected.filter((id) => id !== contactId)); setIsSelectAllChecked(false); }
  };

  const handleSelectAllContacts = (event) => {
    const checked = event.target.checked;
    setIsSelectAllChecked(checked);
    if (checked) { const allContactIds = contacts.map((contact) => contact.id); setSelectedContactIds(allContactIds); } 
    else { setSelectedContactIds([]); }
  };

  const handleDeleteSelectedContacts = async () => {
    try {
      setLoading(true);
      await api.delete("/contacts/batch-delete", { data: { contactIds: selectedContactIds } });
      toast.success("Contatos selecionados deletados com sucesso!");
      setSelectedContactIds([]);
      setIsSelectAllChecked(false);
      setConfirmDeleteManyOpen(false);
      dispatch({ type: "RESET" });
      setPageNumber(1);
    } catch (err) { toastError(err); } finally { setLoading(false); }
  };

  const handleBlockContact = async (contactId) => {
    try {
      await api.put(`/contacts/block/${contactId}`, { active: false });
      dispatch({ type: "UPDATE_CONTACTS", payload: { ...blockingContact, active: false } });
      toast.success("Contato bloqueado");
    } catch (err) { toastError(err); }
    setBlockingContact(null);
  };

  const handleUnBlockContact = async (contactId) => {
    try {
      await api.put(`/contacts/block/${contactId}`, { active: true });
      dispatch({ type: "UPDATE_CONTACTS", payload: { ...unBlockingContact, active: true } });
      toast.success("Contato desbloqueado");
    } catch (err) { toastError(err); }
    setUnBlockingContact(null);
  };

  const handleimportContact = async () => {
    try { await api.post("/contacts/import", { whatsappId: importWhatsappId }); history.go(0); } catch (err) { toastError(err); }
    setImportContactModalOpen(false);
  };

  const handleimportChats = async () => {
    try { await api.post("/contacts/import/chats"); history.go(0); } catch (err) { toastError(err); }
  };

  const handleScroll = (e) => {
    if (!hasMore || loading) return;
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - (scrollTop + 100) < clientHeight) { setPageNumber((prev) => prev + 1); }
  };

  const stateCounts = (() => {
    const counts = {};
    contacts.forEach((c) => {
      const num = c.number;
      if (num && num.length > 4) {
        const ddd = num.substring(2, 4);
        const state = dddList[ddd] || "Outros";
        counts[state] = (counts[state] || 0) + 1;
      }
    });
    return counts;
  })();

  return (
    <MainContainer className={classes.mainContainer}>
      <NewTicketModal modalOpen={newTicketModalOpen} initialContact={contactTicket} onClose={handleCloseOrOpenTicket} />
      <ContactModal open={contactModalOpen} onClose={handleCloseContactModal} contactId={selectedContactId} />
      
      <ConfirmationModal
        title={deletingContact ? `Deletar ${deletingContact.name}?` : blockingContact ? `Bloquear ${blockingContact.name}?` : unBlockingContact ? `Desbloquear ${unBlockingContact.name}?` : ImportContacts ? "Importar contatos" : "Importar Excel"}
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onSave={(id) => setImportWhatsappId(id)}
        isCellPhone={ImportContacts}
        onConfirm={() => deletingContact ? handleDeleteContact(deletingContact.id) : blockingContact ? handleBlockContact(blockingContact.id) : unBlockingContact ? handleUnBlockContact(unBlockingContact.id) : ImportContacts ? handleimportContact() : handleImportExcel()}
      >
        {deletingContact ? "Deseja deletar este contato?" : blockingContact ? "Deseja bloquear este contato?" : unBlockingContact ? "Deseja desbloquear este contato?" : "Selecione a ação desejada."}
      </ConfirmationModal>

      <ConfirmationModal title={`Deletar ${selectedContactIds.length} selecionados?`} open={confirmDeleteManyOpen} onClose={() => setConfirmDeleteManyOpen(false)} onConfirm={handleDeleteSelectedContacts}>
        Esta ação é irreversível.
      </ConfirmationModal>

      <Box className={classes.headerBox} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box>
            <Typography variant="h5" style={{ fontWeight: "bold", color: "#1E293B" }}>Gestão de Contatos</Typography>
            <Typography variant="body2" style={{ color: "#64748B" }}>Visualize e organize seus leads e clientes em um só lugar.</Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
            <TagsFilter onFiltered={(s) => setSelectedTags(s.map(t => t.id))} />
            <PopupState variant="popover" popupId="menu-import">
                {(popupState) => (
                    <React.Fragment>
                        <Button variant="contained" color="primary" {...bindTrigger(popupState)} style={{ textTransform: "none" }}>
                            Importar / Exportar <ArrowDropDown />
                        </Button>
                        <Menu {...bindMenu(popupState)}>
                            <MenuItem onClick={() => { setConfirmOpen(true); setImportContacts(true); popupState.close(); }}>
                                <ContactPhone fontSize="small" color="primary" style={{ marginRight: 10 }} /> Importar da Agenda
                            </MenuItem>
                            <MenuItem onClick={() => { setImportContactModalOpen(true); popupState.close(); }}>
                                <Backup fontSize="small" color="primary" style={{ marginRight: 10 }} /> Importar Excel
                            </MenuItem>
                            <MenuItem onClick={() => { handleimportChats(); popupState.close(); }}>
                                <WhatsAppIcon fontSize="small" color="primary" style={{ marginRight: 10 }} /> Importar Conversas
                            </MenuItem>
                        </Menu>
                    </React.Fragment>
                )}
            </PopupState>
            <Button variant="contained" color="primary" onClick={handleOpenContactModal} style={{ textTransform: "none", backgroundColor: "#006B76" }}>Novo Contato</Button>
        </Box>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2, backgroundColor: "#fff", borderRadius: "12px" }}>
        <Tabs value={tabValue} onChange={handleTabChange} indicatorColor="primary" textColor="primary" variant="fullWidth">
          <Tab label="Lista de Contatos" />
          <Tab label="Mapa Geográfico" />
        </Tabs>
      </Box>

      {tabValue === 0 && (
        <Paper className={classes.mainPaper} variant="outlined" onScroll={handleScroll}>
          <Box p={2} display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center">
                <Checkbox color="primary" indeterminate={selectedContactIds.length > 0 && selectedContactIds.length < contacts.length} checked={isSelectAllChecked} onChange={handleSelectAllContacts} />
                <Typography variant="body2">Selecionar Todos ({contacts.length})</Typography>
                {selectedContactIds.length > 0 && (
                    <Button color="secondary" onClick={() => setConfirmDeleteManyOpen(true)} style={{ marginLeft: 20 }}>Deletar Selecionados</Button>
                )}
            </Box>
            <TextField
                placeholder="Pesquisar..."
                size="small"
                value={searchParam}
                onChange={handleSearch}
                InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon color="secondary" /></InputAdornment> }}
            />
          </Box>
          <Grid container spacing={2} style={{ padding: 16 }}>
            {contacts.map((contact) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={contact.id}>
                <Card className={classes.contactCard} elevation={0}>
                  <CardContent>
                    <Box className={classes.cardHeader}>
                      <Checkbox color="primary" size="small" checked={selectedContactIds.includes(contact.id)} onChange={handleToggleSelectContact(contact.id)} />
                      <Avatar src={contact.urlPicture} className={classes.cardAvatar} />
                      <Box>
                        <Typography variant="subtitle2" noWrap style={{ fontWeight: 700 }}>{contact.name}</Typography>
                        <Typography className={classes.cardNumber}>{hideNum ? "(**) ****-****" : contact.number}</Typography>
                      </Box>
                    </Box>
                    <Box display="flex" flexWrap="wrap" gap={0.5} mt={1}>
                        {contact.tags?.map(t => <Chip key={t.id} label={t.name} size="small" style={{ backgroundColor: t.color, color: "#fff", fontSize: "0.65rem" }} />)}
                    </Box>
                    <Divider style={{ margin: "12px 0" }} />
                    <Box className={classes.cardFooter}>
                      <Typography variant="caption" style={{ color: contact.active === false ? "#ef4444" : "#22c55e", fontWeight: "bold" }}>
                        {contact.active === false ? "BLOQUEADO" : "ATIVO"}
                      </Typography>
                      <Box className={classes.actionsRight}>
                        <IconButton size="small" className={classes.actionBtnWhats} onClick={() => { setContactTicket(contact); setNewTicketModalOpen(true); }}><WhatsAppIcon style={{ fontSize: 18 }} /></IconButton>
                        <IconButton size="small" className={classes.actionBtnEdit} onClick={() => hadleEditContact(contact.id)}><EditIcon style={{ fontSize: 18 }} /></IconButton>
                        <IconButton size="small" className={classes.actionBtnBlock} onClick={() => { setBlockingContact(contact); setConfirmOpen(true); }}><BlockIcon style={{ fontSize: 18 }} /></IconButton>
                        <IconButton size="small" className={classes.actionBtnDelete} onClick={() => { setDeletingContact(contact); setConfirmOpen(true); }}><DeleteOutlineIcon style={{ fontSize: 18 }} /></IconButton>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
            {loading && <TableRowSkeleton columns={4} />}
          </Grid>
        </Paper>
      )}

      {tabValue === 1 && (
        <Paper className={classes.mainPaper} variant="outlined">
          <Box className={classes.totalContactsBar}>Total de Contatos: {contacts.length}</Box>
          <Grid container spacing={3} style={{ padding: 20 }}>
            <Grid item xs={12} md={8}>
              <Box style={{ backgroundColor: "#EFF6FF", borderRadius: "12px" }}>
                <ComposableMap projection="geoMercator" projectionConfig={{ scale: 750, center: [-54, -15] }} style={{ width: "100%", height: "500px" }}>
                  <Geographies geography={geoUrl}>
                    {({ geographies }) => geographies.map((geo) => {
                      const state = geo.properties.name;
                      const count = stateCounts[state] || 0;
                      const color = count > 10 ? "#006B76" : count > 0 ? "#00ABB6" : "#D1D5DB";
                      return <Geography key={geo.rsmKey} geography={geo} fill={color} stroke="#FFF" strokeWidth={0.5} />;
                    })}
                  </Geographies>
                </ComposableMap>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card className={classes.legendCard} elevation={0}>
                <Typography variant="h6" gutterBottom>Contatos por Estado</Typography>
                <Divider />
                <Box sx={{ mt: 2, maxHeight: "400px", overflowY: "auto" }}>
                  {Object.entries(stateCounts).sort((a,b) => b[1]-a[1]).map(([s, c]) => (
                    <Box key={s} display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2">{s}</Typography>
                      <Typography variant="body2" fontWeight="bold">{c}</Typography>
                    </Box>
                  ))}
                </Box>
              </Card>
            </Grid>
          </Grid>
        </Paper>
      )}
      
      {importContactModalOpen && (
        <ContactImportWpModal isOpen={importContactModalOpen} handleClose={() => setImportContactModalOpen(false)} selectedTags={selectedTags} hideNum={hideNum} userProfile={user.profile} />
      )}
    </MainContainer>
  );
};

export default Contacts;
