import { i18n } from "../../translate/i18n";

import React, { useState, useEffect, useContext } from "react";
import { Link as RouterLink } from "react-router-dom";

import { Button, TextField, Typography } from "@material-ui/core";
import { makeStyles, useTheme } from "@material-ui/core/styles";

import { IconButton, InputAdornment, Switch } from "@mui/material";
import Visibility from "@material-ui/icons/Visibility";
import VisibilityOff from "@material-ui/icons/VisibilityOff";
import EmailIcon from "@material-ui/icons/Email";
import LockIcon from "@material-ui/icons/Lock";
import WhatsAppIcon from "@material-ui/icons/WhatsApp";
import { Helmet } from "react-helmet";

import api from "../../services/api";
import { AuthContext } from "../../context/Auth/AuthContext";
import defaultLoginLogo from "../../assets/login-logo-default.png";

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    width: "100vw",
    height: "100vh",
    backgroundColor: "#F8FAFC",
    [theme.breakpoints.down("sm")]: { flexDirection: "column" },
  },
  imageSide: {
    flex: 1.2,
    backgroundSize: "cover",
    backgroundPosition: "center center",
    height: "100%",
    [theme.breakpoints.down("md")]: { display: "none" },
  },
  formSide: {
    flex: 1,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "40px",
    [theme.breakpoints.down("sm")]: { padding: "20px" },
  },
  formContainer: {
    width: "100%",
    maxWidth: "420px",
    background: "#FFFFFF",
    borderRadius: "16px",
    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
    padding: "40px",
    animation: "$fadeIn 0.8s ease-out",
  },
  "@keyframes fadeIn": {
    "0%": { opacity: 0, transform: "translateY(10px)" },
    "100%": { opacity: 1, transform: "translateY(0)" },
  },
  logoImg: {
    display: "block",
    margin: "0 auto 32px",
    maxWidth: "180px",
    height: "auto",
  },
  submitBtn: {
    marginTop: "24px",
    backgroundColor: "#006B76",
    color: "#fff",
    borderRadius: "10px",
    padding: "12px",
    fontSize: "1rem",
    fontWeight: "bold",
    textTransform: "none",
    width: "100%",
    transition: "all 0.2s",
    "&:hover": {
      backgroundColor: "#00565E",
      transform: "translateY(-1px)",
      boxShadow: "0 4px 12px rgba(0, 107, 118, 0.3)",
    },
  },
  registerBtn: {
    color: "#006B76",
    borderRadius: "10px",
    padding: "10px",
    fontWeight: "600",
    textTransform: "none",
    width: "100%",
    marginTop: "12px",
    border: "1px solid #006B76",
    "&:hover": {
      backgroundColor: "rgba(0, 107, 118, 0.04)",
    },
  },
  forgotPassword: { marginTop: "24px", textAlign: "center" },
  forgotPasswordLink: {
    color: "#64748B",
    textDecoration: "none",
    fontSize: "0.875rem",
    "&:hover": { color: "#006B76" },
  },
  rememberMeContainer: {
    display: "flex",
    alignItems: "center",
    marginTop: "16px",
    color: "#64748B",
  },
  whatsappButton: {
    position: "fixed",
    bottom: "32px",
    right: "32px",
    backgroundColor: "#25D366",
    borderRadius: "50%",
    width: "56px",
    height: "56px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    boxShadow: "0 10px 15px -3px rgba(37, 211, 102, 0.4)",
    cursor: "pointer",
    zIndex: 999,
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    "&:hover": {
      transform: "scale(1.1) rotate(10deg)",
    },
  },
  whatsappIcon: {
    fontSize: 30,
    color: "#fff",
  },
}));

const backendUrl = process.env.REACT_APP_BACKEND_URL || "";

// resolve URL vinda do backend (relativa ou absoluta) com fallback
const resolveImageUrl = (value, fallback) => {
  if (!value) return fallback;
  if (value.startsWith("http")) return value;
  if (!backendUrl) return value;
  const base = backendUrl.replace(/\/+$/, "");
  const clean = value.replace(/^\/+/, "");
  return `${base}/${clean}`;
};

const Login = () => {
  const classes = useStyles();
  const theme = useTheme();
  const { handleLogin, loading } = useContext(AuthContext);

  const [user, setUser] = useState({
    email: "",
    password: "",
    remember: false,
  });

  if (loading) return null; // Não mostra nada enquanto estiver pensando

  const [branding, setBranding] = useState({
    loginLogo: "/logo.png",
    loginBackground: "https://soushop.com.br/capa.png",
    loginWhatsapp: "https://wa.me/5500000000000",
  });

  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [userCreationEnabled, setUserCreationEnabled] = useState(true);

  // ========= Tema e aparência da página =============
  useEffect(() => {
    try {
      localStorage.setItem("theme", "light");
    } catch (e) {}
    document.documentElement.classList.remove("dark");
    document.documentElement.setAttribute("data-theme", "light");
    document.body.classList.add("login-page");
    return () => document.body.classList.remove("login-page");
  }, []);

  // ========= Buscar settings globais ============
  useEffect(() => {
  const fetchBranding = async () => {
    try {
      const { data } = await api.get("/global-config/public-branding");

      setBranding({
        loginLogo: data.loginLogo || "/logo.png",
        loginBackground:
          data.loginBackground ||
          "https://soushop.com.br/capa.png",
        loginWhatsapp: data.loginWhatsapp || "https://wa.me/5500000000000",
      });
    } catch (err) {
      console.error("Erro ao carregar branding:", err);
    }
  };

  fetchBranding();
}, []);


  // ========== Verificar se cadastro está habilitado ==========
  useEffect(() => {
    const fetchUserCreationStatus = async () => {
      try {
        const { data } = await api.get("/settings/userCreation");
        setUserCreationEnabled(data.userCreation === "enabled");
      } catch (err) {
        setUserCreationEnabled(false);
      }
    };

    fetchUserCreationStatus();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const lang = localStorage.getItem("i18nextLng") || "pt";
    i18n.changeLanguage(lang);
    handleLogin(user);
  };

  return (
    <>
      <Helmet>
        <title>Login</title>
      </Helmet>

      <div className={classes.root}>
        {/* ===== Capa dinâmica ===== */}
        <div
          className={classes.imageSide}
          style={{
            backgroundImage: `url('${resolveImageUrl(
              branding.loginBackground,
              "https://soushop.com.br/capa.png"
            )}')`,
          }}
        ></div>

        <div className={classes.formSide}>
          <form className={classes.formContainer} onSubmit={handleSubmit}>
            {/* LOGO DINÂMICO */}
            <img
              src={resolveImageUrl(branding.loginLogo, defaultLoginLogo)}
              alt="Logo"
              className={classes.logoImg}
            />

            {error && <Typography color="error">{error}</Typography>}

            <TextField
              label="Email"
              variant="outlined"
              fullWidth
              margin="normal"
              type="email"
              value={user.email}
              onChange={(e) => setUser({ ...user, email: e.target.value })}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              label="Senha"
              variant="outlined"
              fullWidth
              margin="normal"
              type={showPassword ? "text" : "password"}
              value={user.password}
              onChange={(e) => setUser({ ...user, password: e.target.value })}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      style={{ color: "#374151" }}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <div className={classes.rememberMeContainer}>
              <Switch
                checked={user.remember}
                onChange={(e) =>
                  setUser({ ...user, remember: e.target.checked })
                }
              />
              <Typography>Lembrar de mim</Typography>
            </div>

            <Button
              type="submit"
              variant="contained"
              color="primary"
              className={classes.submitBtn}
            >
              Entrar
            </Button>

            {userCreationEnabled && (
              <Button
                component={RouterLink}
                to="/signup"
                variant="contained"
                className={classes.registerBtn}
              >
                Cadastre-se
              </Button>
            )}

            <div className={classes.forgotPassword}>
              <RouterLink
                to="/forgot-password"
                className={classes.forgotPasswordLink}
              >
                Esqueceu a senha?
              </RouterLink>
            </div>
          </form>
        </div>

        {/* ===== BOTÃO WHATSAPP DINÂMICO ===== */}
        <div
          className={classes.whatsappButton}
          onClick={() => window.open(branding.loginWhatsapp)}
        >
          <WhatsAppIcon className={classes.whatsappIcon} />
        </div>
      </div>
    </>
  );
};

export default Login;
