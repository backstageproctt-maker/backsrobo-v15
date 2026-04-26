import React, { useState, useCallback, useContext, useEffect, useRef } from "react";
import { useParams, useHistory } from "react-router-dom";
import Paper from "@material-ui/core/Paper";
import Hidden from "@material-ui/core/Hidden";
import { makeStyles } from "@material-ui/core/styles";
import TicketsManager from "../../components/TicketsManagerTabs";
import Ticket from "../../components/Ticket";

import { QueueSelectedProvider } from "../../context/QueuesSelected/QueuesSelectedContext";
import { TicketsContext } from "../../context/Tickets/TicketsContext";
import { i18n } from "../../translate/i18n";
import { AuthContext } from "../../context/Auth/AuthContext";
import api from "../../services/api";
import { CircularProgress } from "@material-ui/core";
import { getBackendUrl } from "../../config";
import logo from "../../assets/logo.png";
import logoDark from "../../assets/logo-black.png";
import MainContainer from "../../components/MainContainer";

const defaultTicketsManagerWidth = 550;
const minTicketsManagerWidth = 404;
const maxTicketsManagerWidth = 700;

const useStyles = makeStyles((theme) => ({
	chatContainer: {
		flex: 1,
		padding: "4px",
		height: "100%",
		overflow: "hidden",
	},
	chatPapper: {
		display: "flex",
		height: "100%",
    gap: "10px",
	},
	contactsWrapper: {
		display: "flex",
		height: "100%",
		flexDirection: "column",
		overflowY: "hidden",
		position: "relative",
    borderRadius: "24px",
    border: "1px solid rgba(255, 255, 255, 0.3)",
    background: "rgba(255, 255, 255, 0.8)",
    backdropFilter: "blur(10px)",
    boxShadow: "0 10px 40px rgba(0,0,0,0.03)",
	},
	messagesWrapper: {
		display: "flex",
		height: "100%",
		flexDirection: "column",
		flexGrow: 1,
    borderRadius: "24px",
    overflow: "hidden",
    border: "1px solid rgba(255, 255, 255, 0.3)",
    background: "rgba(255, 255, 255, 0.8)",
    backdropFilter: "blur(10px)",
    boxShadow: "0 10px 40px rgba(0,0,0,0.03)",
	},
	welcomeMsg: {
		background: "transparent",
		display: "flex",
		justifyContent: "space-evenly",
		alignItems: "center",
		height: "100%",
		textAlign: "center",
    border: "none !important",
	},
	dragger: {
		width: "4px",
		cursor: "ew-resize",
		position: "absolute",
		top: 0,
		right: 0,
		bottom: 0,
		zIndex: 100,
		backgroundColor: "rgba(0,0,0,0.05)",
    transition: "background 0.3s ease",
    "&:hover": {
      backgroundColor: "rgba(0,180,219,0.5)",
    },
		userSelect: "none",
	},
	logo: {
		logo: theme.logo,
		content: "url(" + (theme.mode === "light" ? theme.calculatedLogoLight() : theme.calculatedLogoDark()) + ")"
	},
}));

const TicketsCustom = () => {
	const { user } = useContext(AuthContext);

	const classes = useStyles({ ticketsManagerWidth: user.defaultTicketsManagerWidth || defaultTicketsManagerWidth });

	const { ticketId } = useParams();

	const [ticketsManagerWidth, setTicketsManagerWidth] = useState(0);
	const ticketsManagerWidthRef = useRef(ticketsManagerWidth);

	useEffect(() => {
		if (user && user.defaultTicketsManagerWidth) {
			setTicketsManagerWidth(user.defaultTicketsManagerWidth);
		}
	}, [user]);

	const handleMouseDown = (e) => {
		document.addEventListener("mouseup", handleMouseUp, true);
		document.addEventListener("mousemove", handleMouseMove, true);
	};
	const handleSaveContact = async value => {
		if (value < 404)
			value = 404
		await api.put(`/users/toggleChangeWidht/${user.id}`, { defaultTicketsManagerWidth: value });

	}
	const handleMouseMove = useCallback(
		(e) => {
			const newWidth = e.clientX - document.body.offsetLeft;
			if (
				newWidth > minTicketsManagerWidth &&
				newWidth < maxTicketsManagerWidth
			) {
				ticketsManagerWidthRef.current = newWidth;
				setTicketsManagerWidth(newWidth);
			}
		},
		[]
	);

	const handleMouseUp = async () => {
		document.removeEventListener("mouseup", handleMouseUp, true);
		document.removeEventListener("mousemove", handleMouseMove, true);

		const newWidth = ticketsManagerWidthRef.current;

		if (newWidth !== ticketsManagerWidth) {
			await handleSaveContact(newWidth);
		}
	};

	return (
    <MainContainer>
      <QueueSelectedProvider>
        <div className={classes.chatContainer}>
          <div className={classes.chatPapper}>
            <div
              className={classes.contactsWrapper}
              style={{ width: ticketsManagerWidth }}
            >
              <TicketsManager />
              <div onMouseDown={e => handleMouseDown(e)} className={classes.dragger} />
            </div>
            <div className={classes.messagesWrapper}>
              {ticketId ? (
                <>
                  <Ticket />
                </>
              ) : (
                <Hidden only={["sm", "xs"]}>
                  <Paper square variant="outlined" className={classes.welcomeMsg}>
                    <span>
                      <center>
                        <img className={classes.logo} width="50%" alt="" />
                      </center>
                      {i18n.t("chat.noTicketMessage")}
                    </span>								</Paper>
                </Hidden>
              )}
            </div>
          </div>
        </div>
      </QueueSelectedProvider>
    </MainContainer>
	);
};

export default TicketsCustom;