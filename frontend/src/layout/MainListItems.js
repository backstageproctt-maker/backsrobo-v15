import React, { useContext, useEffect, useReducer, useState } from "react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { makeStyles, useTheme } from "@material-ui/core/styles";
import useHelps from "../hooks/useHelps";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import ListSubheader from "@material-ui/core/ListSubheader";
import Divider from "@material-ui/core/Divider";
import Avatar from "@material-ui/core/Avatar";
import Badge from "@material-ui/core/Badge";
import Collapse from "@material-ui/core/Collapse";
import List from "@material-ui/core/List";
import Tooltip from "@material-ui/core/Tooltip";
import Typography from "@material-ui/core/Typography";
import Box from "@material-ui/core/Box";
import Chip from "@material-ui/core/Chip";

import DashboardOutlinedIcon from "@material-ui/icons/DashboardOutlined";
import WhatsAppIcon from "@material-ui/icons/WhatsApp";
import SyncAltIcon from "@material-ui/icons/SyncAlt";
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
import AnnouncementIcon from "@material-ui/icons/Announcement";
import ForumIcon from "@material-ui/icons/Forum";
import LocalAtmIcon from "@material-ui/icons/LocalAtm";
import BusinessIcon from "@material-ui/icons/Business";
import {
  AllInclusive,
  AttachFile,
  Dashboard,
  Description,
  DeviceHubOutlined,
  GridOn,
  ListAlt,
  PhonelinkSetup,
  SettingsApplications
} from "@material-ui/icons";

// NOVO ÍCONE PARA CONEXÕES
import SignalCellularConnectedNoInternet4BarIcon from "@material-ui/icons/SignalCellularConnectedNoInternet4Bar";

import { WhatsAppsContext } from "../context/WhatsApp/WhatsAppsContext";
import { AuthContext } from "../context/Auth/AuthContext";
import { useActiveMenu } from "../context/ActiveMenuContext";

import { Can } from "../components/Can";

import { isArray } from "lodash";
import api from "../services/api";
import toastError from "../errors/toastError";
import usePlans from "../hooks/usePlans";
import useVersion from "../hooks/useVersion";
import { i18n } from "../translate/i18n";
import { Campaign, ShapeLine, Webhook } from "@mui/icons-material";

// 1. DEFINIÇÃO DAS CORES DOS ÍCONES
const iconStyles = {
  dashboard: { color: "#6366f1", gradient: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)" },
  tickets: { color: "#10b981", gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)" },
  messages: { color: "#f59e0b", gradient: "linear-gradient(135deg, #f59e0b 0%, #f97316 100%)" },
  kanban: { color: "#8b5cf6", gradient: "linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)" },
  contacts: { color: "#06b6d4", gradient: "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)" },
  schedules: { color: "#ec4899", gradient: "linear-gradient(135deg, #ec4899 0%, #be185d 100%)" },
  tags: { color: "#14b8a6", gradient: "linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)" },
  chats: { color: "#f97316", gradient: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)" },
  helps: { color: "#3b82f6", gradient: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)" },
  campaigns: { color: "#ef4444", gradient: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)" },
  flowbuilder: { color: "#84cc16", gradient: "linear-gradient(135deg, #84cc16 0%, #65a30d 100%)" },
  announcements: { color: "#f59e0b", gradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)" },
  api: { color: "#06b6d4", gradient: "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)" },
  users: { color: "#8b5cf6", gradient: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)" },
  queues: { color: "#10b981", gradient: "linear-gradient(135deg, #10b981 0%, #047857 100%)" },
  prompts: { color: "#ec4899", gradient: "linear-gradient(135deg, #ec4899 0%, #db2777 100%)" },
  integrations: { color: "#f97316", gradient: "linear-gradient(135deg, #f97316 0%, #c2410c 100%)" },
  connections: { color: "#64748b", gradient: "linear-gradient(135deg, #64748b 0%, #475569 100%)" },
  files: { color: "#14b8a6", gradient: "linear-gradient(135deg, #14b8a6 0%, #0f766e 100%)" },
  financial: { color: "#10b981", gradient: "linear-gradient(135deg, #10b981 0%, #065f46 100%)" },
  settings: { color: "#e7361fff", gradient: "linear-gradient(135deg, #e94117ff 0%, #4f46e5 100%)" },
  companies: { color: "#3b82f6", gradient: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)" },
  globalConfig: { color: "#a647f4ff", gradient: "linear-gradient(135deg, #8344d4ff 0%, #4842c1ff 100%)" },
  default: { color: "#6366f1", gradient: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)" }
};

const useStyles = makeStyles((theme) => ({
  listItem: {
    height: "44px",
    width: "auto",
    margin: "4px 8px",
    borderRadius: "8px",
    padding: "0 8px",
    "&:hover": {
      backgroundColor: "rgba(255, 255, 255, 0.1)",
    },
    "&.active": {
      backgroundColor: "rgba(255, 255, 255, 0.2)",
    },
    display: "flex",
    justifyContent: "center",
  },
  listItemText: {
    fontSize: "14px",
    color: "#FFFFFF",
    fontWeight: 500,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  iconHoverActive: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: "8px",
    height: 36,
    width: 36,
    backgroundColor: "transparent",
    color: "#FFFFFF",
    transition: "all 0.2s",
    "& .MuiSvgIcon-root": {
      fontSize: "1.5rem",
    },
  },
  listSubheader: {
    color: "rgba(255, 255, 255, 0.6)",
    textTransform: "uppercase",
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "1px",
    paddingTop: "16px",
    lineHeight: "24px",
  },
}));

function ListItemLink(props) {
  const { icon, primary, to, tooltip, showBadge, iconKey, small, collapsed } = props;
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

  const ConditionalTooltip = ({ children, tooltipEnabled }) =>
    tooltipEnabled ? (
      <Tooltip
        placement="right"
        arrow
        title={
          <Typography style={{ fontWeight: 700, fontSize: "0.9rem" }}>
            {primary}
          </Typography>
        }
      >
        {children}
      </Tooltip>
    ) : (
      children
    );

  return (
    <ConditionalTooltip tooltipEnabled={!!tooltip}>
      <li>
        <ListItem
          button
          component={renderLink}
          className={`${classes.listItem} ${isActive ? "active" : ""}`}
          style={small ? { paddingLeft: collapsed ? "0" : "32px" } : {}}
        >
          {icon ? (
            <ListItemIcon style={{ 
              minWidth: "auto", 
              justifyContent: "center",
              marginRight: collapsed ? 0 : 16,
              color: "inherit"
            }}>
              <div className={classes.iconHoverActive}>
                {icon}
              </div>
            </ListItemIcon>
          ) : null}
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
      </li>
    </ConditionalTooltip>
  );
}

const reducer = (state, action) => {
  if (action.type === "LOAD_CHATS") {
    const chats = action.payload;
    const newChats = [];

    if (isArray(chats)) {
      chats.forEach((chat) => {
        const chatIndex = state.findIndex((u) => u.id === chat.id);
        if (chatIndex !== -1) {
          state[chatIndex] = chat;
        } else {
          newChats.push(chat);
        }
      });
    }

    return [...state, ...newChats];
  }

  if (action.type === "UPDATE_CHATS") {
    const chat = action.payload;
    const chatIndex = state.findIndex((u) => u.id === chat.id);

    if (chatIndex !== -1) {
      state[chatIndex] = chat;
      return [...state];
    } else {
      return [chat, ...state];
    }
  }

  if (action.type === "DELETE_CHAT") {
    const chatId = action.payload;

    const chatIndex = state.findIndex((u) => u.id === chatId);
    if (chatIndex !== -1) {
      state.splice(chatIndex, 1);
    }
    return [...state];
  }

  if (action.type === "RESET") {
    return [];
  }

  if (action.type === "CHANGE_CHAT") {
    const changedChats = state.map((chat) => {
      if (chat.id === action.payload.chat.id) {
        return action.payload.chat;
      }
      return chat;
    });
    return changedChats;
  }
};

const MainListItems = ({ collapsed, drawerClose }) => {
  const theme = useTheme();
  const classes = useStyles();
  const { whatsApps } = useContext(WhatsAppsContext);
  const { user, socket } = useContext(AuthContext);
  const { setActiveMenu } = useActiveMenu();
  const location = useLocation();

  const [connectionWarning, setConnectionWarning] = useState(false);
  const [openMenu, setOpenMenu] = useState("");
  
  useEffect(() => {
    if (collapsed) {
      setOpenMenu("");
    }
  }, [collapsed]);
  
  const handleOpenMenu = (menu) => {
    setOpenMenu((prev) => (prev === menu ? "" : menu));
  };
  
  const [showCampaigns, setShowCampaigns] = useState(false);
  const [showKanban, setShowKanban] = useState(false);
  const [showOpenAi, setShowOpenAi] = useState(false);
  const [showIntegrations, setShowIntegrations] = useState(false);

  const [showSchedules, setShowSchedules] = useState(false);
  const [showInternalChat, setShowInternalChat] = useState(false);
  const [showExternalApi, setShowExternalApi] = useState(false);

  const [invisible, setInvisible] = useState(true);
  const [pageNumber, setPageNumber] = useState(1);
  const [searchParam] = useState("");
  const [chats, dispatch] = useReducer(reducer, []);
  const [version, setVersion] = useState(false);
  const [managementHover, setManagementHover] = useState(false);
  const [campaignHover, setCampaignHover] = useState(false);
  const [flowHover, setFlowHover] = useState(false);
  const { list } = useHelps();
  const [hasHelps, setHasHelps] = useState(false);

  useEffect(() => {
    async function checkHelps() {
      const helps = await list();
      setHasHelps(helps.length > 0);
    }
    checkHelps();
  }, []);

  const isManagementActive =
    location.pathname === "/" ||
    location.pathname.startsWith("/reports") ||
    location.pathname.startsWith("/moments");

  const isOperationsActive =
    location.pathname.startsWith("/schedules") ||
    location.pathname.startsWith("/chats") ||
    location.pathname.startsWith("/contacts") ||
    location.pathname.startsWith("/kanban") ||
    location.pathname.startsWith("/files") ||
    location.pathname.startsWith("/quick-messages");

  const isAdminActive =
    location.pathname.startsWith("/messages-api") ||
    location.pathname.startsWith("/connections") ||
    location.pathname.startsWith("/queues") ||
    location.pathname.startsWith("/queue-integration") ||
    location.pathname.startsWith("/reports") ||
    location.pathname.startsWith("/moments") ||
    location.pathname.startsWith("/prompts") ||
    location.pathname.startsWith("/users");

  const isCampaignRouteActive =
    location.pathname === "/campaigns" ||
    location.pathname.startsWith("/contact-lists") ||
    location.pathname.startsWith("/campaigns-config");

  const isFlowbuilderRouteActive =
    location.pathname.startsWith("/phrase-lists") ||
    location.pathname.startsWith("/flowbuilders");

  useEffect(() => {
    if (location.pathname.startsWith("/tickets")) {
      setActiveMenu("/tickets");
    } else {
      setActiveMenu("");
    }
  }, [location, setActiveMenu]);

  const { getPlanCompany } = usePlans();

  const { getVersion } = useVersion();

  useEffect(() => {
    async function fetchVersion() {
      const _version = await getVersion();
      setVersion(_version.version);
    }
    fetchVersion();
  }, []);

  useEffect(() => {
    dispatch({ type: "RESET" });
    setPageNumber(1);
  }, [searchParam]);

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
    }
    fetchData();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchChats();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchParam, pageNumber]);

  useEffect(() => {
    if (user.id) {
      const companyId = user.companyId;
      const onCompanyChatMainListItems = (data) => {
        if (data.action === "new-message") {
          dispatch({ type: "CHANGE_CHAT", payload: data });
        }
        if (data.action === "update") {
          dispatch({ type: "CHANGE_CHAT", payload: data });
        }
      };

      socket.on(`company-${companyId}-chat`, onCompanyChatMainListItems);
      return () => {
        socket.off(`company-${companyId}-chat`, onCompanyChatMainListItems);
      };
    }
  }, [socket]);

  useEffect(() => {
    let unreadsCount = 0;
    if (chats.length > 0) {
      for (let chat of chats) {
        for (let chatUser of chat.users) {
          if (chatUser.userId === user.id) {
            unreadsCount += chatUser.unreads;
          }
        }
      }
    }
    if (unreadsCount > 0) {
      setInvisible(false);
    } else {
      setInvisible(true);
    }
  }, [chats, user.id]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (whatsApps.length > 0) {
        const offlineWhats = whatsApps.filter((whats) => {
          return (
            whats.status === "qrcode" ||
            whats.status === "PAIRING" ||
            whats.status === "DISCONNECTED" ||
            whats.status === "TIMEOUT" ||
            whats.status === "OPENING"
          );
        });
        if (offlineWhats.length > 0) {
          setConnectionWarning(true);
        } else {
          setConnectionWarning(false);
        }
      }
    }, 2000);
    return () => clearTimeout(delayDebounceFn);
  }, [whatsApps]);

  const fetchChats = async () => {
    try {
      const { data } = await api.get("/chats/", {
        params: { searchParam, pageNumber },
      });
      dispatch({ type: "LOAD_CHATS", payload: data.records });
    } catch (err) {
      toastError(err);
    }
  };

  return (
    <div onClick={drawerClose}>
      <ListItemLink
        to="/"
        primary="Dashboard"
        icon={<DashboardOutlinedIcon />}
        iconKey="dashboard"
        tooltip={collapsed}
        collapsed={collapsed}
      />
      
      <ListItemLink
        to="/tickets"
        primary={i18n.t("mainDrawer.listItems.tickets")}
        icon={<WhatsAppIcon />}
        iconKey="tickets"
        tooltip={collapsed}
        collapsed={collapsed}
      />

      {/* OPERAÇÕES */}
      <ListItem
        dense
        button
        onClick={() => handleOpenMenu("operations")}
        className={`${classes.listItem} ${isOperationsActive ? "active" : ""}`}
      >
        <ListItemIcon style={{ 
          minWidth: "auto", 
          justifyContent: "center", 
          marginRight: collapsed ? 0 : 16,
          color: "inherit"
        }}>
          <div className={classes.iconHoverActive}>
            <ListIcon />
          </div>
        </ListItemIcon>
        {!collapsed && (
          <ListItemText
            primary={
              <Typography className={classes.listItemText}>
                Operações
              </Typography>
            }
          />
        )}
        {!collapsed && (openMenu === "operations" ? <ExpandLessIcon style={{ color: "white" }} /> : <ExpandMoreIcon style={{ color: "white" }} />)}
      </ListItem>

      <Collapse in={openMenu === "operations"} timeout="auto" unmountOnExit>
        <List dense component="div" disablePadding>
          {showSchedules && (
            <ListItemLink
              small
              to="/schedules"
              primary={i18n.t("mainDrawer.listItems.schedules")}
              icon={<Schedule />}
              iconKey="schedules"
              tooltip={collapsed}
              collapsed={collapsed}
            />
          )}
          {showInternalChat && (
            <ListItemLink
              small
              to="/chats"
              primary={i18n.t("mainDrawer.listItems.chats")}
              icon={<ForumIcon />}
              iconKey="chats"
              tooltip={collapsed}
              collapsed={collapsed}
            />
          )}
          <ListItemLink
            small
            to="/contacts"
            primary={i18n.t("mainDrawer.listItems.contacts")}
            icon={<ContactPhoneOutlinedIcon />}
            iconKey="contacts"
            tooltip={collapsed}
          />
          {showKanban && (
            <ListItemLink
              small
              to="/kanban"
              primary={i18n.t("mainDrawer.listItems.kanban")}
              icon={<ViewKanban />}
              iconKey="kanban"
              tooltip={collapsed}
              collapsed={collapsed}
            />
          )}
          <ListItemLink
            small
            to="/files"
            primary={i18n.t("mainDrawer.listItems.files")}
            icon={<AttachFile />}
            iconKey="files"
            tooltip={collapsed}
          />
          <ListItemLink
            small
            to="/quick-messages"
            primary={i18n.t("mainDrawer.listItems.quickMessages")}
            icon={<FlashOnIcon />}
            iconKey="messages"
            tooltip={collapsed}
          />
        </List>
      </Collapse>

      {/* CAMPANHAS */}
      {showCampaigns && (
        <Can
          role={user.profile}
          perform="dashboard:view"
          yes={() => (
            <>
              <ListItem
                dense
                button
                onClick={() => handleOpenMenu("campaigns")}
                className={`${classes.listItem} ${isCampaignRouteActive ? "active" : ""}`}
              >
                <ListItemIcon style={{ 
                  minWidth: "auto", 
                  justifyContent: "center", 
                  marginRight: collapsed ? 0 : 16,
                  color: "inherit"
                }}>
                  <div className={classes.iconHoverActive}>
                    <EventAvailableIcon />
                  </div>
                </ListItemIcon>
                {!collapsed && (
                  <ListItemText
                    primary={
                      <Typography className={classes.listItemText}>
                        {i18n.t("mainDrawer.listItems.campaigns")}
                      </Typography>
                    }
                  />
                )}
                {!collapsed && (openMenu === "campaigns" ? <ExpandLessIcon style={{ color: "white" }} /> : <ExpandMoreIcon style={{ color: "white" }} />)}
              </ListItem>
              <Collapse in={openMenu === "campaigns"} timeout="auto" unmountOnExit>
                <List dense component="div" disablePadding>
                  <ListItemLink
                    small
                    to="/campaigns"
                    primary={i18n.t("campaigns.subMenus.list")}
                    icon={<ListIcon />}
                    iconKey="campaigns"
                    tooltip={collapsed}
                    collapsed={collapsed}
                  />
                  <ListItemLink
                    small
                    to="/contact-lists"
                    primary={i18n.t("campaigns.subMenus.listContacts")}
                    icon={<PeopleIcon />}
                    iconKey="campaigns"
                    tooltip={collapsed}
                    collapsed={collapsed}
                  />
                  <ListItemLink
                    small
                    to="/campaigns-config"
                    primary={i18n.t("campaigns.subMenus.settings")}
                    icon={<SettingsOutlinedIcon />}
                    iconKey="campaigns"
                    tooltip={collapsed}
                    collapsed={collapsed}
                  />
                </List>
              </Collapse>
            </>
          )}
        />
      )}

      {/* FLOWBUILDER */}
      <Can
        role={user.profile}
        perform="dashboard:view"
        yes={() => (
          <>
            <ListItem
              dense
              button
              onClick={() => handleOpenMenu("flow")}
              className={`${classes.listItem} ${isFlowbuilderRouteActive ? "active" : ""}`}
            >
              <ListItemIcon style={{ 
                minWidth: "auto", 
                justifyContent: "center", 
                marginRight: collapsed ? 0 : 16,
                color: "inherit"
              }}>
                <div className={classes.iconHoverActive}>
                  <Webhook />
                </div>
              </ListItemIcon>
              {!collapsed && (
                <ListItemText
                  primary={
                    <Typography className={classes.listItemText}>
                      {i18n.t("mainDrawer.listItems.flowbuilder")}
                    </Typography>
                  }
                />
              )}
              {!collapsed && (openMenu === "flow" ? <ExpandLessIcon style={{ color: "white" }} /> : <ExpandMoreIcon style={{ color: "white" }} />)}
            </ListItem>
            <Collapse in={openMenu === "flow"} timeout="auto" unmountOnExit>
              <List dense component="div" disablePadding>
                <ListItemLink
                  small
                  to="/phrase-lists"
                  primary={i18n.t("flowbuilder.subMenus.campaign")}
                  icon={<EventAvailableIcon />}
                  iconKey="flowbuilder"
                  tooltip={collapsed}
                />
                <ListItemLink
                  small
                  to="/flowbuilders"
                  primary={i18n.t("flowbuilder.subMenus.conversation")}
                  icon={<ShapeLine />}
                  iconKey="flowbuilder"
                  tooltip={collapsed}
                />
              </List>
            </Collapse>
          </>
        )}
      />

      {/* ADMINISTRATIVO */}
      <Can
        role={user.profile === "user" && user.allowConnections === "enabled" ? "admin" : user.profile}
        perform="dashboard:view"
        yes={() => (
          <>
            <ListItem
              dense
              button
              onClick={() => handleOpenMenu("admin")}
              className={`${classes.listItem} ${isAdminActive ? "active" : ""}`}
            >
              <ListItemIcon style={{ 
                minWidth: "auto", 
                justifyContent: "center", 
                marginRight: collapsed ? 0 : 16,
                color: "inherit"
              }}>
                <div className={classes.iconHoverActive}>
                  <SettingsApplications />
                </div>
              </ListItemIcon>
              {!collapsed && (
                <ListItemText
                  primary={
                    <Typography className={classes.listItemText}>
                      Administrativo
                    </Typography>
                  }
                />
              )}
              {!collapsed && (openMenu === "admin" ? <ExpandLessIcon style={{ color: "white" }} /> : <ExpandMoreIcon style={{ color: "white" }} />)}
            </ListItem>
            <Collapse in={openMenu === "admin"} timeout="auto" unmountOnExit>
              <List dense component="div" disablePadding>
                {showExternalApi && (
                  <ListItemLink
                    small
                    to="/messages-api"
                    primary="API"
                    icon={<CodeRoundedIcon />}
                    iconKey="api"
                    tooltip={collapsed}
                    collapsed={collapsed}
                  />
                )}
                <ListItemLink
                  small
                  to="/connections"
                  primary="Conexões"
                  icon={<SignalCellularConnectedNoInternet4BarIcon />}
                  iconKey="connections"
                  showBadge={connectionWarning}
                  tooltip={collapsed}
                />
                <ListItemLink
                  small
                  to="/queues"
                  primary="Filas e Chatbot"
                  icon={<AccountTreeOutlinedIcon />}
                  iconKey="queues"
                  tooltip={collapsed}
                />
                {showIntegrations && (
                  <ListItemLink
                    small
                    to="/queue-integration"
                    primary="Integrações"
                    icon={<DeviceHubOutlined />}
                    iconKey="integrations"
                    tooltip={collapsed}
                    collapsed={collapsed}
                  />
                )}
                <ListItemLink
                  small
                  to="/moments"
                  primary="Painéis"
                  icon={<GridOn />}
                  iconKey="dashboard"
                  tooltip={collapsed}
                />
                <ListItemLink
                  small
                  to="/reports"
                  primary="Relatórios"
                  icon={<Description />}
                  iconKey="dashboard"
                  tooltip={collapsed}
                />
                {showOpenAi && (
                  <ListItemLink
                    small
                    to="/prompts"
                    primary="Talk.AI"
                    icon={<AllInclusive />}
                    iconKey="prompts"
                    tooltip={collapsed}
                    collapsed={collapsed}
                  />
                )}
                <ListItemLink
                  small
                  to="/users"
                  primary="Usuários"
                  icon={<PeopleAltOutlinedIcon />}
                  iconKey="users"
                  tooltip={collapsed}
                />
              </List>
            </Collapse>
          </>
        )}
      />

      <ListItemLink
        to="/financeiro"
        primary={i18n.t("mainDrawer.listItems.financeiro")}
        icon={<LocalAtmIcon />}
        iconKey="financial"
        tooltip={collapsed}
        collapsed={collapsed}
      />
      
      <ListItemLink
        to="/settings"
        primary={i18n.t("mainDrawer.listItems.settings")}
        icon={<SettingsOutlinedIcon />}
        iconKey="settings"
        tooltip={collapsed}
        collapsed={collapsed}
      />

      {user.super && (
        <ListItemLink
          to="/global-config"
          primary="Configurações Globais"
          icon={<SettingsApplications />}
          iconKey="globalConfig"
          tooltip={collapsed}
        />
      )}

      {!collapsed && (
        <React.Fragment>
          <Box style={{ padding: "16px", textAlign: "center" }}>
            <Chip
              label="V15.0.1"
              size="small"
              className={classes.versionChip}
            />
          </Box>
        </React.Fragment>
      )}
    </div>
  );
};

export default MainListItems;
