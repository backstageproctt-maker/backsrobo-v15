import React, { useContext, useEffect, useReducer, useState } from "react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { makeStyles, useTheme } from "@material-ui/core/styles";
import clsx from "clsx";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import ListSubheader from "@material-ui/core/ListSubheader";
import Divider from "@material-ui/core/Divider";
import Badge from "@material-ui/core/Badge";
import Collapse from "@material-ui/core/Collapse";
import List from "@material-ui/core/List";
import Tooltip from "@material-ui/core/Tooltip";
import Typography from "@material-ui/core/Typography";
import DashboardOutlinedIcon from "@material-ui/icons/DashboardOutlined";
import WhatsAppIcon from "@material-ui/icons/WhatsApp";
import SettingsOutlinedIcon from "@material-ui/icons/SettingsOutlined";
import PeopleAltOutlinedIcon from "@material-ui/icons/PeopleAltOutlined";
import ContactPhoneOutlinedIcon from "@material-ui/icons/ContactPhoneOutlined";
import AccountTreeOutlinedIcon from "@material-ui/icons/AccountTreeOutlined";
import FlashOnIcon from "@material-ui/icons/FlashOn";
import HelpOutlineIcon from "@material-ui/icons/HelpOutline";
import CodeRoundedIcon from "@material-ui/icons/CodeRounded";
import ViewKanban from "@mui/icons-material/ViewKanban";
import Schedule from "@material-ui/icons/Schedule";
import LocalOfferIcon from "@material-ui/icons/LocalOffer";
import EventAvailableIcon from "@material-ui/icons/EventAvailable";
import ExpandLessIcon from "@material-ui/icons/ExpandLess";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import PeopleIcon from "@material-ui/icons/People";
import ListIcon from "@material-ui/icons/ListAlt";
import ForumIcon from "@material-ui/icons/Forum";
import LocalAtmIcon from "@material-ui/icons/LocalAtm";
import BusinessIcon from "@material-ui/icons/Business";
import {
  Dashboard,
  Description,
  GridOn,
  PhonelinkSetup,
  AttachFile,
  AllInclusive,
  DeviceHubOutlined,
  ListAlt,
} from "@material-ui/icons";

import { AuthContext } from "../context/Auth/AuthContext";
import { useActiveMenu } from "../context/ActiveMenuContext";
import { Can } from "../components/Can";
import { isArray } from "lodash";
import api from "../services/api";
import toastError from "../errors/toastError";
import usePlans from "../hooks/usePlans";
import useVersion from "../hooks/useVersion";
import { i18n } from "../translate/i18n";
import { ShapeLine } from "@mui/icons-material";
import useHelps from "../hooks/useHelps";

const useStyles = makeStyles((theme) => ({
  listItem: {
    height: "44px",
    width: "auto",
    margin: "4px 8px",
    borderRadius: "8px",
    padding: "0 12px",
    "&:hover": {
      backgroundColor: "rgba(255, 255, 255, 0.08)",
    },
    "&.active": {
      backgroundColor: "rgba(255, 255, 255, 0.15)",
    }
  },
  listItemText: {
    fontSize: "14px",
    color: "#FFFFFF",
    fontWeight: 600,
    whiteSpace: "nowrap",
  },
  icon: {
    color: "#FFFFFF",
    minWidth: "36px",
    justifyContent: "center"
  },
  versionChip: {
    color: "#FFFFFF",
    fontSize: "0.65rem",
    textAlign: "center",
    padding: "10px",
    whiteSpace: "nowrap",
    overflow: "hidden"
  }
}));

function ListItemLink(props) {
  const { icon, primary, to, tooltip, showBadge, small, collapsed } = props;
  const classes = useStyles();
  const { activeMenu } = useActiveMenu();
  const location = useLocation();
  const isActive = activeMenu === to || location.pathname === to;

  const renderLink = React.useMemo(
    () =>
      React.forwardRef((itemProps, ref) => (
        <RouterLink to={to} ref={ref} {...itemProps} />
      )),
    [to]
  );

  return (
    <Tooltip title={collapsed ? primary : ""} placement="right" arrow>
      <ListItem
        button
        component={renderLink}
        className={clsx(classes.listItem, isActive && "active")}
        style={small && !collapsed ? { paddingLeft: "32px" } : {}}
      >
        <ListItemIcon className={classes.icon}>
          {showBadge ? (
            <Badge badgeContent="!" color="error" overlap="circular">
              {icon}
            </Badge>
          ) : (
            icon
          )}
        </ListItemIcon>
        {!collapsed && (
          <ListItemText
            primary={
              <Typography className={classes.listItemText}>
                {primary}
              </Typography>
            }
          />
        )}
      </ListItem>
    </Tooltip>
  );
}

const reducer = (state, action) => {
  if (action.type === "LOAD_CHATS") {
    const chats = action.payload;
    const newChats = [];
    if (isArray(chats)) {
      chats.forEach((chat) => {
        const chatIndex = state.findIndex((u) => u.id === chat.id);
        if (chatIndex !== -1) { state[chatIndex] = chat; } else { newChats.push(chat); }
      });
    }
    return [...state, ...newChats];
  }
  if (action.type === "UPDATE_CHATS") {
    const chat = action.payload;
    const chatIndex = state.findIndex((u) => u.id === chat.id);
    if (chatIndex !== -1) { state[chatIndex] = chat; return [...state]; } else { return [chat, ...state]; }
  }
  if (action.type === "DELETE_CHAT") {
    const chatId = action.payload;
    const chatIndex = state.findIndex((u) => u.id === chatId);
    if (chatIndex !== -1) { state.splice(chatIndex, 1); }
    return [...state];
  }
  if (action.type === "RESET") { return []; }
  if (action.type === "CHANGE_CHAT") {
    return state.map((chat) => chat.id === action.payload.chat.id ? action.payload.chat : chat);
  }
};

const MainListItems = ({ collapsed, drawerClose }) => {
  const classes = useStyles();
  const { user, socket } = useContext(AuthContext);
  const location = useLocation();

  const [openCampaignSubmenu, setOpenCampaignSubmenu] = useState(false);
  const [openFlowSubmenu, setOpenFlowSubmenu] = useState(false);
  const [openDashboardSubmenu, setOpenDashboardSubmenu] = useState(false);
  
  const [showCampaigns, setShowCampaigns] = useState(false);
  const [showKanban, setShowKanban] = useState(false);
  const [showOpenAi, setShowOpenAi] = useState(false);
  const [showIntegrations, setShowIntegrations] = useState(false);
  const [showSchedules, setShowSchedules] = useState(false);
  const [showInternalChat, setShowInternalChat] = useState(false);
  const [showExternalApi, setShowExternalApi] = useState(false);

  const [invisible, setInvisible] = useState(true);
  const [chats, dispatch] = useReducer(reducer, []);
  const [version, setVersion] = useState(false);
  const { list } = useHelps();
  const [hasHelps, setHasHelps] = useState(false);

  const { getPlanCompany } = usePlans();
  const { getVersion } = useVersion();

  useEffect(() => {
    async function fetchData() {
      const companyId = user.companyId;
      const planConfigs = await getPlanCompany(undefined, companyId);
      setShowCampaigns(planConfigs.plan.useCampaigns);
      setShowKanban(planConfigs.plan.useKanban);
      setShowOpenAi(planConfigs.plan.useOpenAi);
      setShowIntegrations(planConfigs.plan.useIntegrations);
      setShowSchedules(planConfigs.plan.useSchedules);
      setShowInternalChat(planConfigs.plan.useInternalChat);
      setShowExternalApi(planConfigs.plan.useExternalApi);

      const _version = await getVersion();
      setVersion(_version.version);
      
      const helps = await list();
      setHasHelps(helps.length > 0);
    }
    fetchData();
  }, []);

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const { data } = await api.get("/chats/", { params: { searchParam: "", pageNumber: 1 } });
        dispatch({ type: "LOAD_CHATS", payload: data.records });
      } catch (err) { toastError(err); }
    };
    fetchChats();
  }, []);

  useEffect(() => {
    if (user.id) {
      const companyId = user.companyId;
      const onCompanyChat = (data) => {
        if (data.action === "new-message" || data.action === "update") {
          dispatch({ type: "CHANGE_CHAT", payload: data });
        }
      };
      socket.on(`company-${companyId}-chat`, onCompanyChat);
      return () => socket.off(`company-${companyId}-chat`, onCompanyChat);
    }
  }, [socket, user.id]);

  useEffect(() => {
    let unreadsCount = 0;
    chats.forEach(chat => {
      chat.users.forEach(u => {
        if (u.userId === user.id) unreadsCount += u.unreads;
      });
    });
    setInvisible(unreadsCount === 0);
  }, [chats, user.id]);

  const isManagementActive = location.pathname === "/" || location.pathname.startsWith("/reports") || location.pathname.startsWith("/moments");
  const isCampaignActive = location.pathname.startsWith("/campaigns") || location.pathname.startsWith("/contact-lists");
  const isFlowActive = location.pathname.startsWith("/phrase-lists") || location.pathname.startsWith("/flowbuilders");

  return (
    <div onClick={drawerClose}>
      <Tooltip title={collapsed ? "Gerência" : ""} placement="right">
        <ListItem button onClick={() => !collapsed && setOpenDashboardSubmenu(!openDashboardSubmenu)} className={clsx(classes.listItem, isManagementActive && "active")}>
            <ListItemIcon className={classes.icon}><Dashboard /></ListItemIcon>
            {!collapsed && <ListItemText primary={<Typography className={classes.listItemText}>{i18n.t("mainDrawer.listItems.management")}</Typography>} />}
            {!collapsed && (openDashboardSubmenu ? <ExpandLessIcon style={{color: "#fff"}} /> : <ExpandMoreIcon style={{color: "#fff"}} />)}
        </ListItem>
      </Tooltip>
      <Collapse in={openDashboardSubmenu && !collapsed} timeout="auto" unmountOnExit>
        <List component="div" disablePadding>
          <ListItemLink to="/" primary="Dashboard" icon={<DashboardOutlinedIcon />} small collapsed={collapsed} />
          <ListItemLink to="/reports" primary="Relatórios" icon={<Description />} small collapsed={collapsed} />
          <ListItemLink to="/moments" primary="Painel" icon={<GridOn />} small collapsed={collapsed} />
        </List>
      </Collapse>

      <ListItemLink to="/tickets" primary="Atendimentos" icon={<WhatsAppIcon />} collapsed={collapsed} />
      <ListItemLink to="/quick-messages" primary="Respostas Rápidas" icon={<FlashOnIcon />} collapsed={collapsed} />
      {showKanban && <ListItemLink to="/kanban" primary="Kanban" icon={<ViewKanban />} collapsed={collapsed} />}
      <ListItemLink to="/contacts" primary="Contatos" icon={<ContactPhoneOutlinedIcon />} collapsed={collapsed} />
      <ListItemLink to="/todolist" primary="Tarefas" icon={<ListAlt />} collapsed={collapsed} />
      {showSchedules && <ListItemLink to="/schedules" primary="Agendamentos" icon={<Schedule />} collapsed={collapsed} />}
      <ListItemLink to="/tags" primary="Tags" icon={<LocalOfferIcon />} collapsed={collapsed} />
      
      {/* {showInternalChat && (
        <ListItemLink to="/chats" primary="Chat Interno" icon={<Badge color="secondary" variant="dot" invisible={invisible}><ForumIcon /></Badge>} collapsed={collapsed} />
      )} */}

      {hasHelps && <ListItemLink to="/helps" primary="Ajuda" icon={<HelpOutlineIcon />} collapsed={collapsed} />}

      <Can
        role={user.profile}
        perform="dashboard:view"
        yes={() => (
          <>
            <Divider style={{ backgroundColor: "rgba(255,255,255,0.1)", margin: "8px 0" }} />
            {!collapsed && (
                <ListSubheader inset style={{ color: "#FFFFFF", fontSize: "0.7rem", textTransform: "uppercase", paddingLeft: "20px", fontWeight: 700 }}>
                Administração
                </ListSubheader>
            )}
            
            {showCampaigns && (
              <>
                <Tooltip title={collapsed ? "Campanhas" : ""} placement="right">
                    <ListItem button onClick={() => !collapsed && setOpenCampaignSubmenu(!openCampaignSubmenu)} className={clsx(classes.listItem, isCampaignActive && "active")}>
                        <ListItemIcon className={classes.icon}><EventAvailableIcon /></ListItemIcon>
                        {!collapsed && <ListItemText primary={<Typography className={classes.listItemText}>Campanhas</Typography>} />}
                        {!collapsed && (openCampaignSubmenu ? <ExpandLessIcon style={{color: "#fff"}} /> : <ExpandMoreIcon style={{color: "#fff"}} />)}
                    </ListItem>
                </Tooltip>
                <Collapse in={openCampaignSubmenu && !collapsed} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                        <ListItemLink to="/campaigns" primary="Listagem" icon={<ListIcon />} small collapsed={collapsed} />
                        <ListItemLink to="/contact-lists" primary="Lista de contatos" icon={<PeopleIcon />} small collapsed={collapsed} />
                        <ListItemLink to="/campaigns-config" primary="Configurações" icon={<SettingsOutlinedIcon />} small collapsed={collapsed} />
                    </List>
                </Collapse>
              </>
            )}

            <Tooltip title={collapsed ? "Flowbuilder" : ""} placement="right">
                <ListItem button onClick={() => !collapsed && setOpenFlowSubmenu(!openFlowSubmenu)} className={clsx(classes.listItem, isFlowActive && "active")}>
                    <ListItemIcon className={classes.icon}><AccountTreeOutlinedIcon /></ListItemIcon>
                    {!collapsed && <ListItemText primary={<Typography className={classes.listItemText}>Flowbuilder</Typography>} />}
                    {!collapsed && (openFlowSubmenu ? <ExpandLessIcon style={{color: "#fff"}} /> : <ExpandMoreIcon style={{color: "#fff"}} />)}
                </ListItem>
            </Tooltip>
            <Collapse in={openFlowSubmenu && !collapsed} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                    <ListItemLink to="/phrase-lists" primary="Fluxo de Campanha" icon={<EventAvailableIcon />} small collapsed={collapsed} />
                    <ListItemLink to="/flowbuilders" primary="Fluxo de Conversa" icon={<ShapeLine />} small collapsed={collapsed} />
                </List>
            </Collapse>

            {showExternalApi && <ListItemLink to="/messages-api" primary="API" icon={<CodeRoundedIcon />} collapsed={collapsed} />}
            <ListItemLink to="/users" primary="Usuários" icon={<PeopleAltOutlinedIcon />} collapsed={collapsed} />
            <ListItemLink to="/queues" primary="Filas / Setores" icon={<AccountTreeOutlinedIcon />} collapsed={collapsed} />
            {showOpenAi && <ListItemLink to="/prompts" primary="Assistente IA" icon={<AllInclusive />} collapsed={collapsed} />}
            {showIntegrations && <ListItemLink to="/queue-integration" primary="Integrações" icon={<DeviceHubOutlined />} collapsed={collapsed} />}
            <ListItemLink to="/connections" primary="Conexões" icon={<PhonelinkSetup />} collapsed={collapsed} />
            {/* <ListItemLink to="/files" primary="Arquivos" icon={<AttachFile />} collapsed={collapsed} /> */}
            <ListItemLink to="/financeiro" primary="Financeiro" icon={<LocalAtmIcon />} collapsed={collapsed} />
            <ListItemLink to="/settings" primary="Configurações" icon={<SettingsOutlinedIcon />} collapsed={collapsed} />
            <ListItemLink to="/global-config" primary="Config. Globais" icon={<BusinessIcon />} collapsed={collapsed} />
          </>
        )}
      />
      {version && !collapsed && <div className={classes.versionChip}>Versão: {version}</div>}
    </div>
  );
};

export default MainListItems;
