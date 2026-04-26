import React, { useContext } from "react";
import { makeStyles } from "@material-ui/core/styles";

import MomentsUser from "../../components/MomentsUser";
// import MomentsQueues from "../../components/MomentsQueues";

import MainHeader from "../../components/MainHeader";
import { Grid, Paper } from "@material-ui/core";
import Title from "../../components/Title";
import ForbiddenPage from "../../components/ForbiddenPage";
import { AuthContext } from "../../context/Auth/AuthContext";
import MainContainer from "../../components/MainContainer";

const useStyles = makeStyles((theme) => ({
  container: {
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1),
    paddingLeft: "5px",
    maxWidth: "100%"
  },
  mainPaper: {
    display: "flex",
    padding: theme.spacing(3),
    overflowY: "auto",
    ...theme.scrollbarStyles,
    alignItems: "center",
    borderRadius: "24px",
    border: "1px solid rgba(255, 255, 255, 0.3)",
    background: "rgba(255, 255, 255, 0.8)",
    backdropFilter: "blur(10px)",
    boxShadow: "0 10px 40px rgba(0,0,0,0.03)",
    flex: 1,
    height: "100%",
  },
  fixedHeightPaper: {
    padding: theme.spacing(2),
    display: "flex",
    flexDirection: "column",
    height: 100,
  },
  chatPapper: {
    display: "flex",
    height: "100%",
  },
  contactsHeader: {
    display: "flex",
    flexWrap: "wrap",
    padding: "0px 6px 6px 6px",
  }
}));

const ChatMoments = () => {
  const classes = useStyles();
  const { user } = useContext(AuthContext)
  return (
    <MainContainer>
      {user.profile === "user" && user.allowRealTime === "disabled" ?
        <ForbiddenPage />
        :
        <>
          <MainHeader>
            <Title>{"Painel de Atendimentos"}</Title>
          </MainHeader>
          <Paper
            className={classes.mainPaper}
            variant="outlined"
          >
            <MomentsUser />
          </Paper>
        </>
      }
    </MainContainer>
  );
};

export default ChatMoments;
