import React, { useState, useEffect, useReducer, useContext } from "react";
import { toast } from "react-toastify";
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
import CircularProgress from "@material-ui/core/CircularProgress";
import DeleteOutlineIcon from "@material-ui/icons/DeleteOutline";
import EditIcon from "@material-ui/icons/Edit";
import { AccountCircle } from "@material-ui/icons";
import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import MainHeaderButtonsWrapper from "../../components/MainHeaderButtonsWrapper";
import Title from "../../components/Title";
import whatsappIcon from "../../assets/nopicture.png"
import api from "../../services/api";
import { i18n } from "../../translate/i18n"; // Já importado, ótimo!
import TableRowSkeleton from "../../components/TableRowSkeleton";
import UserModal from "../../components/UserModal";
import ConfirmationModal from "../../components/ConfirmationModal";
import toastError from "../../errors/toastError";
import { SocketContext, socketManager } from "../../context/Socket/SocketContext";
import UserStatusIcon from "../../components/UserModal/statusIcon";
import { getBackendUrl } from "../../config";
import { AuthContext } from "../../context/Auth/AuthContext";
import { Avatar, Box, Chip, Typography } from "@material-ui/core";
import ForbiddenPage from "../../components/ForbiddenPage";

const backendUrl = getBackendUrl();

const reducer = (state, action) => {
  if (action.type === "LOAD_USERS") {
    const users = action.payload;
    const newUsers = [];

    users.forEach((user) => {
      const userIndex = state.findIndex((u) => u.id === user.id);
      if (userIndex !== -1) {
        state[userIndex] = user;
      } else {
        newUsers.push(user);
      }
    });

    return [...state, ...newUsers];
  }

  if (action.type === "UPDATE_USERS") {
    const user = action.payload;
    const userIndex = state.findIndex((u) => u.id === user.id);

    if (userIndex !== -1) {
      state[userIndex] = user;
      return [...state];
    } else {
      return [user, ...state];
    }
  }

  if (action.type === "DELETE_USER") {
    const userId = action.payload;

    const userIndex = state.findIndex((u) => u.id === userId);
    if (userIndex !== -1) {
      state.splice(userIndex, 1);
    }
    return [...state];
  }

  if (action.type === "RESET") {
    return [];
  }
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
    padding: theme.spacing(2),
    borderRadius: "12px",
    border: "1px solid #E2E8F0",
    boxShadow: "none",
    overflowY: "scroll",
    ...theme.scrollbarStyles,
  },
  searchPaper: {
    padding: "4px 12px",
    display: "flex",
    alignItems: "center",
    borderRadius: "10px",
    backgroundColor: "#F1F5F9",
    border: "1px solid #E2E8F0",
    width: "100%",
    maxWidth: 400,
  },
  table: {
    "& .MuiTableCell-head": {
        fontWeight: "bold",
        color: "#64748B",
        borderBottom: "2px solid #F1F5F9",
    },
    "& .MuiTableCell-body": {
        color: "#1E293B",
        borderBottom: "1px solid #F1F5F9",
    }
  },
  actionButton: {
    borderRadius: "8px",
    textTransform: "none",
    fontWeight: "bold",
  },
  newButton: {
    backgroundColor: "#006B76",
    color: "#FFFFFF",
    "&:hover": {
      backgroundColor: "#00565E",
    },
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: "50%",
  }
}));

const Users = () => {
  const classes = useStyles();

  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [searchParam, setSearchParam] = useState("");
  const [users, dispatch] = useReducer(reducer, []);
  const { user: loggedInUser, socket } = useContext(AuthContext)
  const { profileImage } = loggedInUser;

  useEffect(() => {
    dispatch({ type: "RESET" });
    setPageNumber(1);
  }, [searchParam]);

  useEffect(() => {
    setLoading(true);
    const fetchUsers = async () => {
      try {
        const { data } = await api.get("/users/", {
          params: { searchParam, pageNumber },
        });
	    dispatch({ type: "LOAD_USERS", payload: data.users });
        setHasMore(data.hasMore);
      } catch (err) {
        toastError(err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    };
    fetchUsers();
  }, [searchParam, pageNumber]);

  useEffect(() => {
    if (loggedInUser) {
      const companyId = loggedInUser.companyId;
      const onCompanyUser = (data) => {
        if (data.action === "update" || data.action === "create") {
          dispatch({ type: "UPDATE_USERS", payload: data.user });
        }
        if (data.action === "delete") {
          dispatch({ type: "DELETE_USER", payload: +data.userId });
        }
      };
      socket.on(`company-${companyId}-user`, onCompanyUser);
      return () => {
        socket.off(`company-${companyId}-user`, onCompanyUser);
      };
    }
  }, [socket, loggedInUser]);

  const handleOpenUserModal = () => {
    setSelectedUser(null);
    setUserModalOpen(true);
  };

  const handleCloseUserModal = () => {
    setSelectedUser(null);
    setUserModalOpen(false);
  };

  const handleSearch = (event) => {
    setSearchParam(event.target.value.toLowerCase());
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setUserModalOpen(true);
  };

  const handleDeleteUser = async (userId) => {
    try {
      await api.delete(`/users/${userId}`);
      toast.success(i18n.t("users.toasts.deleted"));
    } catch (err) {
      toastError(err);
    }
    setDeletingUser(null);
    setSearchParam("");
    setPageNumber(1);
  };

  const loadMore = () => {
    setLoadingMore(true);
    setPageNumber((prevPage) => prevPage + 1);
  };

  const handleScroll = (e) => {
    if (!hasMore || loading) return;
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - (scrollTop + 100) < clientHeight) {
      loadMore();
    }
  };
  
const renderProfileImage = (user) => {
  const src =
    user.id === loggedInUser.id
      ? (profileImage ? `${backendUrl}/public/avatar/${profileImage}` : whatsappIcon)
      : (user.profileImage ? `${backendUrl}/public/avatar/${user.profileImage}` : whatsappIcon);

  return <Avatar src={src} alt={user.name} className={classes.userAvatar} />;
};
  
  return (
    <MainContainer className={classes.mainContainer}>
      <ConfirmationModal
        title={
          deletingUser &&
          `${i18n.t("users.confirmationModal.deleteTitle")} ${deletingUser.name}?`
        }
        open={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={() => handleDeleteUser(deletingUser.id)}
      >
        {i18n.t("users.confirmationModal.deleteMessage")}
      </ConfirmationModal>
      
      <UserModal
        open={userModalOpen}
        onClose={handleCloseUserModal}
        userId={selectedUser && selectedUser.id}
        key={i18n.language}
      />

      {loggedInUser.profile === "user" ? <ForbiddenPage /> : (
        <>
          <Box className={classes.headerBox} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Box>
                <Typography variant="h5" style={{ fontWeight: "bold", color: "#1E293B" }}>
                Gestão de Usuários
                </Typography>
                <Typography variant="body2" style={{ color: "#64748B" }}>
                Adicione e gerencie os membros da sua equipe e seus níveis de acesso.
                </Typography>
            </Box>
            <Button 
                variant="contained" 
                className={`${classes.actionButton} ${classes.newButton}`}
                onClick={handleOpenUserModal}
            >
                Novo Usuário
            </Button>
          </Box>

          <Paper className={classes.mainPaper} variant="outlined" onScroll={handleScroll}>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
                <div className={classes.searchPaper}>
                    <SearchIcon sx={{ color: "#94A3B8", mr: 1 }} />
                    <TextField
                        placeholder="Pesquisar usuários..."
                        fullWidth
                        value={searchParam}
                        onChange={handleSearch}
                        InputProps={{ disableUnderline: true }}
                        style={{ backgroundColor: "transparent" }}
                    />
                </div>
            </Box>

            <Table size="small" className={classes.table}>
              <TableHead>
                <TableRow>
                  <TableCell align="center">Status</TableCell>
                  <TableCell align="center">Avatar</TableCell>
                  <TableCell align="left">Nome</TableCell>
                  <TableCell align="left">E-mail</TableCell>
                  <TableCell align="center">Perfil</TableCell>
                  <TableCell align="center">Horário</TableCell>
                  <TableCell align="center">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} hover>
                    <TableCell align="center"><UserStatusIcon user={user} /></TableCell>
                    <TableCell align="center">{renderProfileImage(user)}</TableCell>
                    <TableCell align="left" style={{ fontWeight: "bold" }}>{user.name}</TableCell>
                    <TableCell align="left">{user.email}</TableCell>
                    <TableCell align="center">
                        <Chip label={user.profile} size="small" variant="outlined" style={{ borderRadius: 4, fontWeight: "bold" }} />
                    </TableCell>
                    <TableCell align="center">
                        {user.startWork} - {user.endWork}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton size="small" onClick={() => handleEditUser(user)}>
                        <EditIcon sx={{ color: "#64748B" }} />
                      </IconButton>
                      <IconButton size="small" onClick={() => { setConfirmModalOpen(true); setDeletingUser(user); }}>
                        <DeleteOutlineIcon sx={{ color: "#EF4444" }} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {loadingMore && <TableRowSkeleton columns={7} />}
              </TableBody>
            </Table>
            {loading && !loadingMore && (
              <div className={classes.loadingContainer}>
                <CircularProgress size={24} />
                <span className={classes.loadingText}>{i18n.t("loading")}</span>
              </div>
            )}
          </Paper>
        </>
      )}
    </MainContainer>
  );
};

export default Users;