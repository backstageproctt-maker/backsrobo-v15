import React, { useState, useEffect, useMemo } from "react";
import api from "./services/api";
import "react-toastify/dist/ReactToastify.css";
import { QueryClient, QueryClientProvider } from "react-query";
import { ptBR } from "@material-ui/core/locale";
import { createTheme, ThemeProvider } from "@material-ui/core/styles";
import { useMediaQuery } from "@material-ui/core";
import ColorModeContext from "./layout/themeContext";
import { ActiveMenuProvider } from "./context/ActiveMenuContext";
import Favicon from "react-favicon";
import { getBackendUrl } from "./config";
import Routes from "./routes";
import defaultLogoLight from "./assets/logo.png";
import defaultLogoDark from "./assets/logo-black.png";
import defaultLogoFavicon from "./assets/favicon.ico";
import useSettings from "./hooks/useSettings";

const queryClient = new QueryClient();

const App = () => {
  const [locale, setLocale] = useState();
  const appColorLocalStorage = localStorage.getItem("primaryColorLight") || localStorage.getItem("primaryColorDark") || "#065183";
  const appNameLocalStorage = localStorage.getItem("appName") || "";
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  const preferredTheme = window.localStorage.getItem("preferredTheme");
  const [mode, setMode] = useState(preferredTheme ? preferredTheme : prefersDarkMode ? "dark" : "light");
  const [primaryColorLight, setPrimaryColorLight] = useState(appColorLocalStorage);
  const [primaryColorDark, setPrimaryColorDark] = useState(appColorLocalStorage);
  const [appLogoLight, setAppLogoLight] = useState(defaultLogoLight);
  const [appLogoDark, setAppLogoDark] = useState(defaultLogoDark);
  const [appLogoFavicon, setAppLogoFavicon] = useState(defaultLogoFavicon);
  const [appName, setAppName] = useState(appNameLocalStorage);
  const { getPublicSetting } = useSettings();
  // Estado para controlar o prompt de instalação do PWA
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => {
          const newMode = prevMode === "light" ? "dark" : "light";
          window.localStorage.setItem("preferredTheme", newMode); // Persistindo o tema no localStorage
          return newMode;
        });
      },
      setPrimaryColorLight,
      setPrimaryColorDark,
      setAppLogoLight,
      setAppLogoDark,
      setAppLogoFavicon,
      setAppName,
      appLogoLight,
      appLogoDark,
      appLogoFavicon,
      appName,
      mode,
    }),
    [appLogoLight, appLogoDark, appLogoFavicon, appName, mode]
  );

  const theme = useMemo(
    () =>
      createTheme(
        {
          scrollbarStyles: {
            "&::-webkit-scrollbar": {
              width: "6px",
              height: "6px",
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: mode === "light" ? "#cbd5e1" : "#475569",
              borderRadius: "10px",
            },
          },
          palette: {
            type: mode,
            primary: { 
              main: mode === "light" ? primaryColorLight : primaryColorDark,
              light: "#818cf8",
              dark: "#4338ca",
              contrastText: "#ffffff"
            },
            secondary: {
              main: "#10b981",
              contrastText: "#ffffff"
            },
            background: {
              default: mode === "light" ? "#F1F5F9" : "#020617",
              paper: mode === "light" ? "#FFFFFF" : "#0F172A",
            },
            text: {
              primary: mode === "light" ? "#1E293B" : "#F1F5F9",
              secondary: mode === "light" ? "#64748b" : "#94a3b8",
            },
            action: {
              active: mode === "light" ? primaryColorLight : primaryColorDark,
              hover: mode === "light" ? "rgba(15, 23, 42, 0.04)" : "rgba(248, 250, 252, 0.08)",
              selected: mode === "light" ? "rgba(15, 23, 42, 0.08)" : "rgba(248, 250, 252, 0.12)",
            }
          },
          shape: {
            borderRadius: 16,
          },
          typography: {
            fontFamily: [
              'Outfit',
              'Inter',
              '-apple-system',
              'BlinkMacSystemFont',
              '"Segoe UI"',
              'Roboto',
              'sans-serif',
            ].join(','),
            h1: { fontWeight: 800, letterSpacing: "-0.02em" },
            h2: { fontWeight: 800, letterSpacing: "-0.02em" },
            h3: { fontWeight: 700, letterSpacing: "-0.01em" },
            h4: { fontWeight: 700, letterSpacing: "-0.01em" },
            h5: { fontWeight: 600 },
            h6: { fontWeight: 600 },
            button: { textTransform: "none", fontWeight: 600, letterSpacing: "0.01em" },
          },
          overrides: {
            MuiButton: {
              root: {
                borderRadius: 12,
                padding: "10px 20px",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: "0 8px 20px -4px rgba(0,0,0,0.2)",
                },
              },
              containedPrimary: {
                background: `linear-gradient(135deg, ${primaryColorLight} 0%, ${mode === 'light' ? '#4f46e5' : '#818cf8'} 100%)`,
                boxShadow: "0 4px 12px rgba(99, 102, 241, 0.2)",
              }
            },
            MuiPaper: {
              rounded: {
                borderRadius: 20,
              },
              elevation1: {
                boxShadow: mode === "light" 
                  ? "0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)" 
                  : "none",
                border: mode === "light" ? "1px solid #f1f5f9" : "1px solid #1e293b",
                backdropFilter: "blur(12px)",
              }
            },
            MuiDialog: {
              paper: {
                borderRadius: 24,
                padding: 12,
                border: mode === "light" ? "1px solid #f1f5f9" : "1px solid #1e293b",
              }
            },
            MuiDrawer: {
              paper: {
                backgroundColor: mode === "light" ? "#FFFFFF" : "#020617",
                borderRight: mode === "light" ? "1px solid #f1f5f9" : "1px solid #1e293b",
                backgroundImage: mode === "dark" 
                  ? "radial-gradient(at 0% 0%, rgba(99, 102, 241, 0.1) 0px, transparent 50%)" 
                  : "none",
              }
            },
            MuiAppBar: {
              root: {
                boxShadow: "none",
                backdropFilter: "blur(12px)",
                background: mode === "light" 
                  ? "rgba(255, 255, 255, 0.8) !important" 
                  : "rgba(2, 6, 23, 0.8) !important",
                color: mode === "light" ? "#1e293b !important" : "#f1f5f9 !important",
              }
            },
            MuiTab: {
              root: {
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.9rem",
              }
            }
          },
          mode,
          appLogoLight,
          appLogoDark,
          appLogoFavicon,
          appName,
        },
        locale
      ),
    [appLogoLight, appLogoDark, appLogoFavicon, appName, locale, mode, primaryColorDark, primaryColorLight]
  );

  // Detecta quando o navegador está pronto para mostrar o prompt de instalação do PWA
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // Previne o comportamento padrão do navegador
      e.preventDefault();
      // Armazena o evento para uso posterior
      setDeferredPrompt(e);
      
      // Mostra o prompt de instalação imediatamente
      setTimeout(() => {
        showInstallPrompt();
      }, 2000); // Pequeno delay para garantir que a página já carregou
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Função para mostrar o prompt de instalação
  const showInstallPrompt = () => {
    if (deferredPrompt) {
      // Verifica se o PWA já está instalado
      if (!window.matchMedia('(display-mode: standalone)').matches) {
        // Mostra o prompt de instalação
        deferredPrompt.prompt();
        
        // Espera pela resposta do usuário
        deferredPrompt.userChoice.then((choiceResult) => {
          if (choiceResult.outcome === 'accepted') {
            console.log('Usuário aceitou instalar o app');
          } else {
            console.log('Usuário recusou instalar o app');
          }
          // Limpa o prompt armazenado, só pode ser usado uma vez
          setDeferredPrompt(null);
        });
      }
    }
  };

  useEffect(() => {
    const i18nlocale = localStorage.getItem("i18nextLng");
    const browserLocale = i18nlocale.substring(0, 2) + i18nlocale.substring(3, 5);

    if (browserLocale === "ptBR") {
      setLocale(ptBR);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("preferredTheme", mode);
  }, [mode]);

  useEffect(() => {
    console.log("|=========== handleSaveSetting ==========|")
    console.log("APP START")
    console.log("|========================================|")
   
    
    getPublicSetting("primaryColorLight")
      .then((color) => {
        setPrimaryColorLight(color || "#0000FF");
      })
      .catch((error) => {
        console.log("Error reading setting", error);
      });
    getPublicSetting("primaryColorDark")
      .then((color) => {
        setPrimaryColorDark(color || "#39ACE7");
      })
      .catch((error) => {
        console.log("Error reading setting", error);
      });
    getPublicSetting("appLogoLight")
      .then((file) => {
        setAppLogoLight(file ? getBackendUrl() + "/public/" + file : defaultLogoLight);
      })
      .catch((error) => {
        console.log("Error reading setting", error);
      });
    getPublicSetting("appLogoDark")
      .then((file) => {
        setAppLogoDark(file ? getBackendUrl() + "/public/" + file : defaultLogoDark);
      })
      .catch((error) => {
        console.log("Error reading setting", error);
      });
    getPublicSetting("appLogoFavicon")
      .then((file) => {
        setAppLogoFavicon(file ? getBackendUrl() + "/public/" + file : defaultLogoFavicon);
      })
      .catch((error) => {
        console.log("Error reading setting", error);
      });
    getPublicSetting("appName")
      .then((name) => {
        setAppName(name || "Whaticket - V15.0.1");
      })
      .catch((error) => {
        console.log("!==== Erro ao carregar temas: ====!", error);
        setAppName("Whaticket - V15.0.1");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--primaryColor", mode === "light" ? primaryColorLight : primaryColorDark);
  }, [primaryColorLight, primaryColorDark, mode]);

  useEffect(() => {
    async function fetchVersionData() {
      try {
        const response = await api.get("/version");
        const { data } = response;
        window.localStorage.setItem("frontendVersion", data.version);
      } catch (error) {
        console.log("Error fetching data", error);
      }
    }
    fetchVersionData();
  }, []);

  return (
    <>
      <Favicon url={appLogoFavicon ? getBackendUrl() + "/public/" + appLogoFavicon : defaultLogoFavicon} />
      <ColorModeContext.Provider value={{ colorMode }}>
        <ThemeProvider theme={theme}>
          <QueryClientProvider client={queryClient}>
            <ActiveMenuProvider>
  <div style={{ position: "relative", overflow: "visible", zIndex: 0, minHeight: "100vh" }}>
    <Routes />
  </div>
            </ActiveMenuProvider>
          </QueryClientProvider>
        </ThemeProvider>
      </ColorModeContext.Provider>
    </>
  );
};

export default App;