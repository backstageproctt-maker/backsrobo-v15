import React, { useState, useEffect, useContext, useRef, useCallback } from "react";
import { useParams, useHistory } from "react-router-dom";

import clsx from "clsx";

import { makeStyles, Paper, IconButton, TextField, Tooltip, Badge } from "@material-ui/core";

import SearchIcon from "@material-ui/icons/Search";
import CloseIcon from "@material-ui/icons/Close";
import KeyboardArrowUpIcon from "@material-ui/icons/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@material-ui/icons/KeyboardArrowDown";
import ContactDrawer from "../ContactDrawer";
import MessageInput from "../MessageInput";
import TicketHeader from "../TicketHeader";
import TicketInfo from "../TicketInfo";
import TicketActionButtons from "../TicketActionButtonsCustom";
import MessagesList from "../MessagesList";
import api from "../../services/api";
import { ReplyMessageProvider } from "../../context/ReplyingMessage/ReplyingMessageContext";
import { ForwardMessageProvider } from "../../context/ForwarMessage/ForwardMessageContext";

import toastError from "../../errors/toastError";
import { AuthContext } from "../../context/Auth/AuthContext";
import { TagsContainer } from "../TagsContainer";
import { isNil } from 'lodash';
import { EditMessageProvider } from "../../context/EditingMessage/EditingMessageContext";
import { TicketsContext } from "../../context/Tickets/TicketsContext";

const drawerWidth = 320;

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    height: "100%",
    position: "relative",
    overflow: "hidden",
  },

  mainWrapper: {
    flex: 1,
    height: "100%",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    borderLeft: "0",
    marginRight: -drawerWidth,
    transition: theme.transitions.create("margin", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
  },

  mainWrapperShift: {
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    transition: theme.transitions.create("margin", {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    marginRight: 0,
  },
}));

const Ticket = () => {
  const { ticketId } = useParams();
  const history = useHistory();
  const classes = useStyles();

  const { user, socket } = useContext(AuthContext);
  const { setTabOpen } = useContext(TicketsContext);


  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [contact, setContact] = useState({});
  const [ticket, setTicket] = useState({});
  const [dragDropFiles, setDragDropFiles] = useState([]);

// 🔎 Busca dentro da conversa
const [chatSearchOpen, setChatSearchOpen] = useState(false);
const [chatSearchDraft, setChatSearchDraft] = useState("");
const [chatSearchQuery, setChatSearchQuery] = useState("");
const [chatSearchMatches, setChatSearchMatches] = useState([]); // array de messageIds
const [chatSearchIndex, setChatSearchIndex] = useState(0);

const chatSearchInputRef = useRef(null);
const chatSearchContainerRef = useRef(null);

// foca quando abre
useEffect(() => {
  if (!chatSearchOpen) return;
  const t = setTimeout(() => {
    try {
      chatSearchInputRef.current?.focus?.();
    } catch (e) {}
  }, 0);
  return () => clearTimeout(t);
}, [chatSearchOpen]);

// reseta índice quando muda a consulta aplicada ou ticket
useEffect(() => {
  setChatSearchIndex(0);
}, [chatSearchQuery, ticketId]);

const applyChatSearch = useCallback(() => {
  setChatSearchQuery((chatSearchDraft ?? "").toString().trim());
}, [chatSearchDraft]);

// trava o teclado no campo de busca quando aberto (evita foco ir pro input do chat)
useEffect(() => {
  if (!chatSearchOpen) return;

  const handler = (e) => {
    try {
      const container = chatSearchContainerRef.current;
      const input = chatSearchInputRef.current;
      if (!container || !input) return;

      const target = e.target;
      const inside = container.contains(target);

      // se o foco saiu da busca e o usuário digitar, força voltar
      if (!inside) {
        const isPrintable = e.key && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey;
        const isNav = ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(e.key);
        if (isPrintable || isNav) {
          e.preventDefault();
          e.stopPropagation();
          if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
          try { input.focus(); } catch (err) {}
        }
      }
    } catch (err) {}
  };

  window.addEventListener("keydown", handler, true);
  return () => window.removeEventListener("keydown", handler, true);
}, [chatSearchOpen]);
const activeMessageId =
  chatSearchMatches.length > 0
    ? chatSearchMatches[Math.min(chatSearchIndex, chatSearchMatches.length - 1)]
    : null;

const closeSearch = () => {
  setChatSearchOpen(false);
  setChatSearchDraft("");
  setChatSearchQuery("");
  setChatSearchMatches([]);
  setChatSearchIndex(0);
};

const goPrev = () => {
  if (!chatSearchMatches.length) return;
  setChatSearchIndex((prev) => (prev - 1 + chatSearchMatches.length) % chatSearchMatches.length);
};

const goNext = () => {
  if (!chatSearchMatches.length) return;
  setChatSearchIndex((prev) => (prev + 1) % chatSearchMatches.length);
};
  
  const lastSearchIdsKeyRef = useRef("");

  const handleChatSearchResults = useCallback((ids) => {
    if (!Array.isArray(ids)) {
      if (lastSearchIdsKeyRef.current !== "") {
        lastSearchIdsKeyRef.current = "";
        setChatSearchMatches([]);
        setChatSearchIndex(0);
      }
      return;
    }

    const key = ids.join(",");
    if (key === lastSearchIdsKeyRef.current) return; // evita loop de re-render
    lastSearchIdsKeyRef.current = key;

    setChatSearchMatches(ids);
    setChatSearchIndex((prev) => Math.min(prev, ids.length > 0 ? ids.length - 1 : 0));
  }, []);

const { companyId } = user;

  useEffect(() => {
    console.log("======== Ticket ===========")
    console.log(ticket)
    console.log("===========================")
}, [ticket])

  useEffect(() => {
    setLoading(true);
    const delayDebounceFn = setTimeout(() => {
      const fetchTicket = async () => {
        try {

          if (!isNil(ticketId) && ticketId !== "undefined") {

            const { data } = await api.get("/tickets/u/" + ticketId);

            setContact(data.contact);
            // setWhatsapp(data.whatsapp);
            // setQueueId(data.queueId);
            setTicket(data);
            if (["pending", "open", "group"].includes(data.status)) {
              setTabOpen(data.status);
            }
            setLoading(false);
          }
        } catch (err) {
          history.push("/tickets");   // correção para evitar tela branca uuid não encontrado Feito por Altemir 16/08/2023
          setLoading(false);
          toastError(err);
        }
      };
      fetchTicket();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [ticketId, user, history]);

  useEffect(() => {
    if (!ticket && !ticket.id && ticket.uuid !== ticketId && ticketId === "undefined") {
      return;
    }

    if (user.companyId) {
      //    const socket = socketManager.GetSocket();

      const onConnectTicket = () => {
        socket.emit("joinChatBox", `${ticket.id}`);
      }

      const onCompanyTicket = (data) => {
        if (data.action === "update" && data.ticket.id === ticket?.id) {
          setTicket(data.ticket);
        }

        if (data.action === "delete" && data.ticketId === ticket?.id) {
          history.push("/tickets");
        }
      };

      const onCompanyContactTicket = (data) => {
        if (data.action === "update") {
          // if (isMounted) {
          setContact((prevState) => {
            if (prevState.id === data.contact?.id) {
              return { ...prevState, ...data.contact };
            }
            return prevState;
          });
          // }
        }
      };

      socket.on("connect", onConnectTicket)
      socket.on(`company-${companyId}-ticket`, onCompanyTicket);
      socket.on(`company-${companyId}-contact`, onCompanyContactTicket);

      return () => {

        socket.emit("joinChatBoxLeave", `${ticket.id}`);
        socket.off("connect", onConnectTicket);
        socket.off(`company-${companyId}-ticket`, onCompanyTicket);
        socket.off(`company-${companyId}-contact`, onCompanyContactTicket);
      };
    }
  }, [ticketId, ticket, history]);

  const handleDrawerOpen = useCallback(() => {
    setDrawerOpen(true);
  }, []);

  const handleDrawerClose = useCallback(() => {
    setDrawerOpen(false);
  }, []);

  const renderMessagesList = () => {
    return (
      <>
        <MessagesList
          searchTerm={chatSearchQuery}
onSearchResults={handleChatSearchResults}
          activeMessageId={activeMessageId}
          isGroup={ticket.isGroup}
          onDrop={setDragDropFiles}
          whatsappId={ticket.whatsappId}
          queueId={ticket.queueId}
          channel={ticket.channel}
        >
        </MessagesList>
        <MessageInput
          ticketId={ticket.id}
          ticketStatus={ticket.status}
          ticketChannel={ticket.channel}
          droppedFiles={dragDropFiles}
          contactId={contact.id}
        />
      </>
    );
  };


  return (
    <div className={classes.root} id="drawer-container">
      <Paper
        variant="outlined"
        elevation={0}
        className={clsx(classes.mainWrapper, {
          [classes.mainWrapperShift]: drawerOpen,
        })}
      >
        {/* <div id="TicketHeader"> */}
        <TicketHeader loading={loading}>
          {ticket.contact !== undefined && (
            <div id="TicketHeader">
              <TicketInfo
                contact={contact}
                ticket={ticket}
                onClick={handleDrawerOpen}
              />
            </div>
          )}
          
{/* 🔎 Pesquisa dentro da conversa */}
<div ref={chatSearchContainerRef} style={{ display: "flex", alignItems: "center", gap: 8 }} onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
  {!chatSearchOpen ? (
    <Tooltip title="Pesquisar nesta conversa">
      <IconButton size="small" onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => { e.stopPropagation(); setChatSearchOpen(true); }}>
        <SearchIcon />
      </IconButton>
    </Tooltip>
  ) : (
    <>
      <TextField
        size="small"
        variant="outlined"
        placeholder="Pesquisar mensagens…"
        value={chatSearchDraft}
        inputRef={chatSearchInputRef}
        autoFocus
        onChange={(e) => {
          e.stopPropagation();
          setChatSearchDraft(e.target.value);
        }}
        onClick={(e) => e.stopPropagation()}
        onFocus={(e) => e.stopPropagation()}
        onBlur={(e) => {
          // Se algo tentar roubar o foco, volta para a busca
          if (!chatSearchOpen) return;
          const next = e.relatedTarget;
          const container = chatSearchContainerRef.current;
          if (container && next && container.contains(next)) return;
          setTimeout(() => {
            try { chatSearchInputRef.current?.focus?.(); } catch (err) {}
          }, 0);
        }}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === "Escape") closeSearch();
          if (e.key === "Enter") {
            // aplica a pesquisa (não pesquisa enquanto digita)
            applyChatSearch();
            // se já houver resultados, vai para o próximo
            setTimeout(() => goNext(), 0);
          }
        }}
        onKeyUp={(e) => e.stopPropagation()}
        style={{ width: 260 }}
      />

      <Badge color="secondary" badgeContent={chatSearchMatches.length}>
        <span style={{ fontSize: 12, opacity: 0.8, padding: "0 6px" }}>
          {chatSearchMatches.length ? `${chatSearchIndex + 1}/${chatSearchMatches.length}` : "0/0"}
        </span>
      </Badge>

      <Tooltip title="Anterior">
        <span>
          <IconButton size="small" onClick={goPrev} disabled={!chatSearchMatches.length}>
            <KeyboardArrowUpIcon />
          </IconButton>
        </span>
      </Tooltip>

      <Tooltip title="Próximo">
        <span>
          <IconButton size="small" onClick={goNext} disabled={!chatSearchMatches.length}>
            <KeyboardArrowDownIcon />
          </IconButton>
        </span>
      </Tooltip>

      <Tooltip title="Fechar">
        <IconButton size="small" onClick={closeSearch}>
          <CloseIcon />
        </IconButton>
      </Tooltip>
    </>
  )}
</div>

<TicketActionButtons
            ticket={ticket}
          />
        </TicketHeader>
        {/* </div> */}
        <Paper>
          <TagsContainer contact={contact} />
        </Paper>
        <ReplyMessageProvider>
          <ForwardMessageProvider>
            <EditMessageProvider>
              {renderMessagesList()}
            </EditMessageProvider>
          </ForwardMessageProvider>
        </ReplyMessageProvider>
      </Paper>

      <ContactDrawer
        open={drawerOpen}
        handleDrawerClose={handleDrawerClose}
        contact={contact}
        loading={loading}
        ticket={ticket}
      />

    </div>
  );
};

export default Ticket;
