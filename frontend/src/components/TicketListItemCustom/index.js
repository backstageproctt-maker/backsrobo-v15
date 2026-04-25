import React, { useState, useEffect, useRef, useContext, useCallback } from "react";

import { useHistory, useParams } from "react-router-dom";
import { parseISO, format, isSameDay } from "date-fns";
import clsx from "clsx";

import { makeStyles, useTheme } from "@material-ui/core/styles";
import { green, grey } from "@material-ui/core/colors";
import { i18n } from "../../translate/i18n";

import api from "../../services/api";
import ButtonWithSpinner from "../ButtonWithSpinner";
import MarkdownWrapper from "../MarkdownWrapper";
import { List, Tooltip } from "@material-ui/core";
import { AuthContext } from "../../context/Auth/AuthContext";
import { TicketsContext } from "../../context/Tickets/TicketsContext";
import toastError from "../../errors/toastError";
import { v4 as uuidv4 } from "uuid";

import GroupIcon from '@material-ui/icons/Group';
import ContactTag from "../ContactTag";
import ConnectionIcon from "../ConnectionIcon";
import AcceptTicketWithouSelectQueue from "../AcceptTicketWithoutQueueModal";
import TransferTicketModalCustom from "../TransferTicketModalCustom";
import ShowTicketOpen from "../ShowTicketOpenModal";
import { isNil } from "lodash";
import { toast } from "react-toastify";
import { Done, HighlightOff, Replay, SwapHoriz, Block } from "@material-ui/icons";
import useCompanySettings from "../../hooks/useSettings/companySettings";
import { 
    Avatar, 
    Badge, 
    ListItemAvatar, 
    ListItem, 
    ListItemSecondaryAction, 
    ListItemText, 
    Typography, 
    Dialog, 
    DialogTitle, 
    DialogContent,
    Box,
    Chip,
    IconButton, 
    Paper, 
    Divider 
} from "@material-ui/core";
import { blue } from "@material-ui/core/colors";
import VisibilityIcon from "@material-ui/icons/Visibility";
import CloseIcon from "@material-ui/icons/Close";
import MessageIcon from "@material-ui/icons/Message";

const useStyles = makeStyles((theme) => ({
    ticket: {
        position: "relative",
        borderBottom: "1px solid #F1F5F9",
        padding: "12px 16px",
        transition: "all 0.2s",
        "&:hover": {
            backgroundColor: "#F8FAFC",
        },
        "&.Mui-selected": {
            backgroundColor: "#EFF6FF",
            borderLeft: "4px solid #2563EB",
            "&:hover": {
                backgroundColor: "#EFF6FF",
            }
        }
    },

    contactNameWrapper: {
        display: "flex",
        justifyContent: "space-between",
        fontWeight: 700,
        color: "#1E293B",
        fontSize: "0.95rem",
        marginBottom: "4px",
    },

    lastMessageTime: {
        fontSize: "0.75rem",
        color: "#94A3B8",
        fontWeight: 500,
    },

    contactLastMessage: {
        color: "#64748B",
        fontSize: "0.85rem",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
    },

    contactLastMessageUnread: {
        color: "#1E293B",
        fontWeight: 700,
        fontSize: "0.85rem",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
    },

    badgeStyle: {
        backgroundColor: "#2563EB",
        color: "#FFFFFF",
        fontWeight: "bold",
    },

    acceptButton: {
        color: "#2563EB",
    },

    connectionTag: {
        fontSize: "0.65rem",
        padding: "2px 6px",
        borderRadius: "4px",
        color: "#FFFFFF",
        fontWeight: "bold",
        textTransform: "uppercase",
        marginLeft: "4px",
    },

    secondaryContentSecond: {
        display: 'flex',
        alignItems: "center",
        marginTop: "8px",
        gap: "4px",
        flexWrap: "wrap",
    },
    
    dialogTitle: {
        backgroundColor: "#FFFFFF",
        color: "#1E293B",
        borderBottom: "1px solid #E2E8F0",
    },
    
    messagesContainer: {
        backgroundColor: "#F8FAFC",
        padding: theme.spacing(2),
    },
    
    messageItem: {
        padding: "8px 12px",
        borderRadius: "12px",
        fontSize: "0.9rem",
        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
    },
    
    fromMe: {
        backgroundColor: "#2563EB",
        color: "#FFFFFF",
        marginLeft: "auto",
        borderBottomRightRadius: "4px",
    },
    
    fromThem: {
        backgroundColor: "#FFFFFF",
        color: "#1E293B",
        marginRight: "auto",
        borderBottomLeftRadius: "4px",
        border: "1px solid #E2E8F0",
    },
    
    // NEW PREMIUM CARD STYLES
    ticketCard: {
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        borderRadius: "12px",
        margin: "8px 12px",
        padding: "12px",
        border: "1px solid #E2E8F0",
        boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
        transition: "all 0.2s",
        position: "relative",
        overflow: "hidden",
        "&:hover": {
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
            transform: "translateY(-1px)",
        },
        "&.Mui-selected": {
            backgroundColor: "#F8FAFC",
            border: "1px solid #CBD5E1",
        }
    },
    ticketQueueColorIndicator: {
        position: "absolute",
        left: 0,
        top: 0,
        bottom: 0,
        width: "6px",
        borderTopLeftRadius: "12px",
        borderBottomLeftRadius: "12px",
    },
    avatarGradient: {
        background: "linear-gradient(135deg, #0ea5e9 0%, #10b981 100%)",
        color: "#FFFFFF",
        fontWeight: "bold",
        width: 48,
        height: 48,
        fontSize: "1.2rem",
    },
    whatsappIconSmall: {
        width: 16,
        height: 16,
        marginRight: 4,
        color: "#25D366"
    },
    ticketHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        width: "100%",
        marginBottom: "4px"
    },
    ticketName: {
        display: "flex",
        alignItems: "center",
        fontWeight: 700,
        color: "#1E293B",
        fontSize: "1rem",
    },
    dateAndActions: {
        display: "flex",
        alignItems: "center",
        gap: "6px"
    },
    dateWrapper: {
        display: "flex",
        alignItems: "center",
        color: "#10b981",
        fontWeight: 600,
        fontSize: "0.75rem",
    },
    unreadBadge: {
        backgroundColor: "#10b981",
        color: "white",
        borderRadius: "50%",
        width: 20,
        height: 20,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "0.7rem",
        fontWeight: "bold",
        marginRight: "6px"
    },
    actionButtonPrimary: {
        backgroundColor: "#10b981",
        color: "white",
        width: 24,
        height: 24,
        minHeight: 24,
        padding: 4,
        borderRadius: "50%",
        "&:hover": { backgroundColor: "#059669" }
    },
    actionButtonBlue: {
        backgroundColor: "#3b82f6",
        color: "white",
        width: 24,
        height: 24,
        minHeight: 24,
        padding: 4,
        borderRadius: "50%",
        "&:hover": { backgroundColor: "#2563eb" }
    },
    actionButtonOrange: {
        backgroundColor: "#f97316",
        color: "white",
        width: 24,
        height: 24,
        minHeight: 24,
        padding: 4,
        borderRadius: "50%",
        "&:hover": { backgroundColor: "#ea580c" }
    },
    actionButtonRed: {
        backgroundColor: "#ef4444",
        color: "white",
        width: 24,
        height: 24,
        minHeight: 24,
        padding: 4,
        borderRadius: "50%",
        "&:hover": { backgroundColor: "#dc2626" }
    },
    actionButtonEye: {
        color: "#3b82f6",
        padding: 0,
        marginRight: 4,
        "&:hover": { backgroundColor: "transparent", color: "#2563eb" }
    },
    tagsContainer: {
        display: "flex",
        gap: "4px",
        marginTop: "6px",
        flexWrap: "wrap"
    },
    pillTag: {
        padding: "2px 8px",
        borderRadius: "12px",
        fontSize: "0.6rem",
        fontWeight: "bold",
        color: "#FFFFFF",
        textTransform: "uppercase"
    }
}));

const TicketListItemCustom = ({ setTabOpen, ticket }) => {
    const classes = useStyles();
    const theme = useTheme();
    const history = useHistory();
    const [loading, setLoading] = useState(false);
    const [acceptTicketWithouSelectQueueOpen, setAcceptTicketWithouSelectQueueOpen] = useState(false);
    const [transferTicketModalOpen, setTransferTicketModalOpen] = useState(false);

    const [openAlert, setOpenAlert] = useState(false);
    const [userTicketOpen, setUserTicketOpen] = useState("");
    const [queueTicketOpen, setQueueTicketOpen] = useState("");
    const [openTicketMessageDialog, setOpenTicketMessageDialog] = useState(false);
    
    // New states for the ticket messages
    const [ticketMessages, setTicketMessages] = useState([]);
    const [loadingMessages, setLoadingMessages] = useState(false);

    const { ticketId } = useParams();
    const isMounted = useRef(true);
    const { setCurrentTicket } = useContext(TicketsContext);
    const { user } = useContext(AuthContext);

    const { get: getSetting } = useCompanySettings();

    useEffect(() => {
        console.log("======== TicketListItemCustom ===========")
        console.log(ticket)
        console.log("=========================================")
    }, [ticket]);

    useEffect(() => {
        return () => {
            isMounted.current = false;
        };
    }, []);

    const handleOpenAcceptTicketWithouSelectQueue = useCallback(() => {
        setAcceptTicketWithouSelectQueueOpen(true);
    }, []);

    const handleCloseTicket = async (id) => {
        const setting = await getSetting(
            {
                "column": "requiredTag"
            }
        );

        if (setting.requiredTag === "enabled") {
            //verificar se tem uma tag   
            try {
                const contactTags = await api.get(`/contactTags/${ticket.contact.id}`);
                if (!contactTags.data.tags) {
                    toast.warning(i18n.t("messagesList.header.buttons.requiredTag"))
                } else {
                    await api.put(`/tickets/${id}`, {
                        status: "closed",
                        userId: user?.id || null,
                    });

                    if (isMounted.current) {
                        setLoading(false);
                    }

                    history.push(`/tickets/`);
                }
            } catch (err) {
                setLoading(false);
                toastError(err);
            }
        } else {
            setLoading(true);
            try {
                await api.put(`/tickets/${id}`, {
                    status: "closed",
                    userId: user?.id || null,
                });

            } catch (err) {
                setLoading(false);
                toastError(err);
            }
            if (isMounted.current) {
                setLoading(false);
            }

            history.push(`/tickets/`);
        }
    };

    const handleCloseIgnoreTicket = async (id) => {
        setLoading(true);
        try {
            await api.put(`/tickets/${id}`, {
                status: "closed",
                userId: user?.id || null,
                sendFarewellMessage: false,
                amountUsedBotQueues: 0
            });

        } catch (err) {
            setLoading(false);
            toastError(err);
        }
        if (isMounted.current) {
            setLoading(false);
        }

        history.push(`/tickets/`);
    };

    const handleStopBot = async (id) => {
        setLoading(true);
        try {
            await api.put(`/tickets/${id}`, {
                hashFlowId: null,
            });
            toast.success("Fluxo interrompido com sucesso!");
        } catch (err) {
            setLoading(false);
            toastError(err);
        }
        if (isMounted.current) {
            setLoading(false);
        }
    };

    const truncate = (str, len) => {
        if (!isNil(str)) {
            if (str.length > len) {
                return str.substring(0, len) + "...";
            }
            return str;
        }
    };

    const handleCloseTransferTicketModal = useCallback(() => {
        if (isMounted.current) {
            setTransferTicketModalOpen(false);
        }
    }, []);

    const handleOpenTransferModal = () => {
        setLoading(true)
        setTransferTicketModalOpen(true);
        if (isMounted.current) {
            setLoading(false);
        }
        handleSelectTicket(ticket);
        history.push(`/tickets/${ticket.uuid}`);
    }

    const renderContactName = (name) => {
        if (!name) return "";
        let str = name.trim();
        const firstName = str.split(" ")[0];
        return firstName;
    };

    const getInitials = (name) => {
        let initials = name.match(/\b\w/g) || [];
        initials = ((initials.shift() || '') + (initials.pop() || '')).toUpperCase();
        return initials;
    };

    const handleAcepptTicket = async (id) => {
        setLoading(true);
        try {
            const otherTicket = await api.put(`/tickets/${id}`, ({
                status: ticket.isGroup && ticket.channel === 'whatsapp' ? "group" : "open",
                userId: user?.id,
            }));

            if (otherTicket.data.id !== ticket.id) {
                if (otherTicket.data.userId !== user?.id) {
                    setOpenAlert(true);
                    setUserTicketOpen(otherTicket.data.user.name);
                    setQueueTicketOpen(otherTicket.data.queue.name);
                } else {
                    setLoading(false);
                    setTabOpen(ticket.isGroup ? "group" : "open");
                    handleSelectTicket(otherTicket.data);
                    history.push(`/tickets/${otherTicket.uuid}`);
                }
            } else {
                let setting;

                try {
                    setting = await getSetting({
                        "column": "sendGreetingAccepted"
                    });
                } catch (err) {
                    toastError(err);
                }

                if (setting.sendGreetingAccepted === "enabled" && (!ticket.isGroup || ticket.whatsapp?.groupAsTicket === "enabled")) {
                    handleSendMessage(ticket.id);
                }
                if (isMounted.current) {
                    setLoading(false);
                }

                setTabOpen(ticket.isGroup ? "group" : "open");
                handleSelectTicket(ticket);
                history.push(`/tickets/${ticket.uuid}`);
            }
        } catch (err) {
            setLoading(false);
            toastError(err);
        }
    };

    const handleSendMessage = async (id) => {
        let setting;

        try {
            setting = await getSetting({
                "column": "greetingAcceptedMessage"
            })
        } catch (err) {
            toastError(err);
        }

        const msg = `${setting.greetingAcceptedMessage}`;
        const message = {
            read: 1,
            fromMe: true,
            mediaUrl: "",
            body: `${msg.trim()}`,
        };
        try {
            await api.post(`/messages/${id}`, message);
        } catch (err) {
            toastError(err);
        }
    };

    const handleCloseAlert = useCallback(() => {
        setOpenAlert(false);
        setLoading(false);
    }, []);

    const handleSelectTicket = (ticket) => {
        const code = uuidv4();
        const { id, uuid } = ticket;
        setCurrentTicket({ id, uuid, code });
    };

    // Function to fetch messages for the ticket
    const fetchTicketMessages = async (ticketId) => {
        if (!ticketId) return;
        
        setLoadingMessages(true);
        try {
            const { data } = await api.get(`/messages/${ticketId}`);
            if (isMounted.current) {
                setTicketMessages(data.messages);
            }
        } catch (err) {
            toastError(err);
        } finally {
            setLoadingMessages(false);
        }
    };

    // Handle opening the message dialog
    const handleOpenMessageDialog = (e) => {
        e.stopPropagation();
        setOpenTicketMessageDialog(true);
        fetchTicketMessages(ticket.id);
    };

    return (
        <React.Fragment key={ticket.id}>
            {openAlert && (
                <ShowTicketOpen
                    isOpen={openAlert}
                    handleClose={handleCloseAlert}
                    user={userTicketOpen}
                    queue={queueTicketOpen}
                />
            )}
            {acceptTicketWithouSelectQueueOpen && (
                <AcceptTicketWithouSelectQueue
                    modalOpen={acceptTicketWithouSelectQueueOpen}
                    onClose={(e) => setAcceptTicketWithouSelectQueueOpen(false)}
                    ticketId={ticket.id}
                    ticket={ticket}
                />
            )}
            {transferTicketModalOpen && (
                <TransferTicketModalCustom
                    modalOpen={transferTicketModalOpen}
                    onClose={handleCloseTransferTicketModal}
                    ticketid={ticket.id}
                    ticket={ticket}
                />
            )}
            
            {/* Improved Message Dialog */}
            <Dialog 
                open={openTicketMessageDialog} 
                onClose={() => setOpenTicketMessageDialog(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle disableTypography className={classes.dialogTitle}>
                    <Typography variant="h6">
                        Espiando a conversa
                    </Typography>
                    <IconButton 
                        aria-label="close" 
                        className={classes.closeButton} 
                        onClick={() => setOpenTicketMessageDialog(false)}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                
                <div className={classes.messagesHeader}>
                    <Avatar 
                        src={ticket?.contact?.urlPicture}
                        className={classes.messageAvatar}
                    />
                    <div>
                        <Typography variant="subtitle1">
                            {ticket.contact?.name}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                            {ticket.whatsapp?.name || ticket.channel}
                        </Typography>
                    </div>
                </div>
                
                <Divider />
                
                <DialogContent className={classes.messagesContainer}>
                    {loadingMessages ? (
                        <div className={classes.loadingMessages}>
                            <Typography>Carregando mensagens...</Typography>
                        </div>
                    ) : ticketMessages.length === 0 ? (
                        <div className={classes.emptyMessages}>
                            <MessageIcon fontSize="large" />
                            <Typography variant="body1">
                                {i18n.t("ticketsList.noMessages")}
                            </Typography>
                        </div>
                    ) : (
                        ticketMessages.map((message) => (
                            <Paper 
                                key={message.id} 
                                className={clsx(
                                    classes.messageItem, 
                                    message.fromMe ? classes.fromMe : classes.fromThem
                                )}
                                elevation={0}
                            >
                                <Typography className={classes.messageText}>
                                    {message.body.includes('data:image/png;base64') ? (
                                        <MarkdownWrapper>Localização</MarkdownWrapper>
                                    ) : message.body.includes('BEGIN:VCARD') ? (
                                        <MarkdownWrapper>Contato</MarkdownWrapper>
                                    ) : (
                                        <MarkdownWrapper>{message.body}</MarkdownWrapper>
                                    )}
                                </Typography>
                                <Typography variant="caption" className={classes.messageTime}>
                                    {format(parseISO(message.createdAt), "HH:mm")}
                                </Typography>
                            </Paper>
                        ))
                    )}
                </DialogContent>
            </Dialog>
            <div
                onClick={(e) => {
                    const isCheckboxClicked = (e.target.tagName.toLowerCase() === 'input' && e.target.type === 'checkbox')
                        || (e.target.tagName.toLowerCase() === 'svg' && e.target.type === undefined)
                        || (e.target.tagName.toLowerCase() === 'path' && e.target.type === undefined)
                        || (e.target.closest && e.target.closest('button'));

                    if (isCheckboxClicked) return;
                    handleSelectTicket(ticket);
                }}
                className={clsx(classes.ticketCard, {
                    "Mui-selected": ticketId && ticketId === ticket.uuid
                })}
                style={{ cursor: "pointer" }}
            >
                {/* Left Colored Border for Queue */}
                <div 
                    className={classes.ticketQueueColorIndicator} 
                    style={{ backgroundColor: ticket.queue?.color || "#10b981" }}
                />

                {/* Avatar */}
                <ListItemAvatar style={{ minWidth: 56 }}>
                    {ticket.contact?.urlPicture && ticket.contact.urlPicture !== "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png" ? (
                        <Avatar src={ticket.contact.urlPicture} sx={{ width: 48, height: 48 }} />
                    ) : (
                        <Avatar className={classes.avatarGradient}>
                            {getInitials(ticket.contact?.name || "??")}
                        </Avatar>
                    )}
                </ListItemAvatar>
                
                {/* Content */}
                <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, overflow: "hidden" }}>
                    
                    {/* Header (Name + Date/Actions) */}
                    <div className={classes.ticketHeader}>
                        <div className={classes.ticketName}>
                            {ticket.channel === "whatsapp" && (
                                <svg className={classes.whatsappIconSmall} viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
                                </svg>
                            )}
                            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "130px" }}>
                                {ticket.contact?.name}
                            </span>
                        </div>
                        
                        <div className={classes.dateAndActions}>
                            {Number(ticket.unreadMessages) > 0 && (
                                <div className={classes.unreadBadge}>
                                    {ticket.unreadMessages}
                                </div>
                            )}
                            <div className={classes.dateWrapper}>
                                {isSameDay(parseISO(ticket.updatedAt), new Date()) ? (
                                    format(parseISO(ticket.updatedAt), "HH:mm")
                                ) : (
                                    format(parseISO(ticket.updatedAt), "dd/MM/yyyy")
                                )}
                            </div>
                            
                            {/* Eye Icon */}
                            <IconButton className={classes.actionButtonEye} size="small" onClick={handleOpenMessageDialog}>
                                <VisibilityIcon style={{ fontSize: 18 }} />
                            </IconButton>

                            {/* Ticket Actions */}
                            {ticket.status === "pending" && (
                                <>
                                    <Tooltip title="Parar Bot">
                                        <IconButton 
                                            className={classes.actionButtonRed} 
                                            onClick={(e) => { e.stopPropagation(); handleStopBot(ticket.id); }}
                                        >
                                            <Block style={{ fontSize: 16 }} />
                                        </IconButton>
                                    </Tooltip>
                                    <IconButton 
                                        className={classes.actionButtonPrimary} 
                                        onClick={(e) => { e.stopPropagation(); handleAcepptTicket(ticket.id); }}
                                    >
                                        <Done style={{ fontSize: 16 }} />
                                    </IconButton>
                                    <IconButton 
                                        className={classes.actionButtonOrange} 
                                        onClick={(e) => { e.stopPropagation(); handleCloseIgnoreTicket(ticket.id); }}
                                    >
                                        <CloseIcon style={{ fontSize: 16 }} />
                                    </IconButton>
                                </>
                            )}
                            {ticket.status === "open" && (
                                <>
                                    <IconButton 
                                        className={classes.actionButtonPrimary} 
                                        onClick={(e) => { e.stopPropagation(); handleCloseTicket(ticket.id); }}
                                    >
                                        <Done style={{ fontSize: 16 }} />
                                    </IconButton>
                                    <IconButton 
                                        className={classes.actionButtonBlue} 
                                        onClick={(e) => { e.stopPropagation(); handleOpenTransferModal(); }}
                                    >
                                        <SwapHoriz style={{ fontSize: 16 }} />
                                    </IconButton>
                                    <IconButton 
                                        className={classes.actionButtonOrange} 
                                        onClick={(e) => { e.stopPropagation(); handleCloseIgnoreTicket(ticket.id); }}
                                    >
                                        <CloseIcon style={{ fontSize: 16 }} />
                                    </IconButton>
                                </>
                            )}
                            {ticket.status === "closed" && (
                                <IconButton 
                                    className={classes.actionButtonPrimary} 
                                    onClick={(e) => { e.stopPropagation(); handleOpenAcceptTicketWithouSelectQueue(); }}
                                >
                                    <Replay style={{ fontSize: 16 }} />
                                </IconButton>
                            )}
                        </div>
                    </div>

                    {/* Message Body */}
                    <Typography
                        className={Number(ticket.unreadMessages) > 0 ? classes.contactLastMessageUnread : classes.contactLastMessage}
                        noWrap
                        variant="body2"
                        style={{ marginBottom: "2px" }}
                    >
                        {ticket.lastMessage || "Nova conversa"}
                    </Typography>

                    {/* Tags & Queue */}
                    <div className={classes.tagsContainer}>
                        {ticket.tags?.map((tag) => (
                            <div 
                                key={`ticket-tag-${tag.id}`} 
                                className={classes.pillTag} 
                                style={{ backgroundColor: tag.color || "#d946ef" }}
                            >
                                {tag.name}
                            </div>
                        ))}
                        {ticket.queue && (
                            <div 
                                className={classes.pillTag} 
                                style={{ backgroundColor: "#94a3b8" }}
                            >
                                {ticket.queue.name}
                            </div>
                        )}
                        {ticket.whatsapp && (
                            <div 
                                className={classes.pillTag} 
                                style={{ backgroundColor: "#cbd5e1", color: "#475569" }}
                            >
                                {ticket.whatsapp.name}
                            </div>
                        )}
                    </div>

                </div>
            </div>
            {/* <Divider variant="inset" component="li" /> */}
        </React.Fragment>
    );
};

export default TicketListItemCustom;