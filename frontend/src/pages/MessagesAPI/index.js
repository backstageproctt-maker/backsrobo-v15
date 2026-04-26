import React, { useState, useEffect, useContext } from "react";
import { useHistory } from "react-router-dom";
import { makeStyles } from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";

import { i18n } from "../../translate/i18n";
import { Button, CircularProgress, Grid, TextField, Typography, Box, Divider } from "@material-ui/core";
import { Field, Form, Formik } from "formik";
import toastError from "../../errors/toastError";
import { toast } from "react-toastify";

import axios from "axios";
import usePlans from "../../hooks/usePlans";
import { AuthContext } from "../../context/Auth/AuthContext";
import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import Title from "../../components/Title";

const useStyles = makeStyles((theme) => ({
  mainPaper: {
    flex: 1,
    padding: theme.spacing(4),
    borderRadius: "24px",
    border: "1px solid rgba(255, 255, 255, 0.3)",
    background: "rgba(255, 255, 255, 0.8)",
    backdropFilter: "blur(10px)",
    boxShadow: "0 10px 40px rgba(0,0,0,0.03)",
    overflowY: "auto",
    ...theme.scrollbarStyles,
  },
  elementMargin: {
    marginBottom: theme.spacing(3),
  },
  formContainer: {
    maxWidth: "100%",
  },
  codeBlock: {
    backgroundColor: "rgba(0, 118, 255, 0.05)",
    padding: theme.spacing(2),
    borderRadius: "12px",
    fontFamily: "monospace",
    color: "#0076FF",
    border: "1px solid rgba(0, 118, 255, 0.1)",
    lineHeight: 1.6,
  },
  sectionTitle: {
    fontWeight: 800,
    color: "#0076FF",
    marginBottom: theme.spacing(2),
  }
}));

const MessagesAPI = () => {
  const classes = useStyles();
  const history = useHistory();

  const [formMessageTextData] = useState({ token: '', number: '', body: '', userId: '', queueId: '' })
  const [formMessageMediaData] = useState({ token: '', number: '', medias: '', body:'', userId: '', queueId: '' })
  const [file, setFile] = useState({})
  const { user } = useContext(AuthContext);

  const { getPlanCompany } = usePlans();

  useEffect(() => {
    async function fetchData() {
      const companyId = user.companyId;
      const planConfigs = await getPlanCompany(undefined, companyId);
      if (!planConfigs.plan.useExternalApi) {
        toast.error("Esta empresa não possui permissão para acessar essa página! Estamos lhe redirecionando.");
        setTimeout(() => {
          history.push(`/`)
        }, 1000);
      }
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getEndpoint = () => {
    return process.env.REACT_APP_BACKEND_URL + '/api/messages/send'
  }

  const handleSendTextMessage = async (values) => {
    const { number, body, userId, queueId } = values;
    const data = { number, body, userId, queueId };
    try {
      await axios.request({
        url: getEndpoint(),
        method: 'POST',
        data,
        headers: {
          'Content-type': 'application/json',
          'Authorization': `Bearer ${values.token}` 
        }
      })
      toast.success('Mensagem enviada com sucesso');
    } catch (err) {
      toastError(err);
    }
  }

  const handleSendMediaMessage = async (values) => {
    try {
      const firstFile = file[0];
      const data = new FormData();
      data.append('number', values.number);
      data.append('body', values.body ? values.body: firstFile.name);
      data.append('userId', values.userId);
      data.append('queueId', values.queueId);
      data.append('medias', firstFile);
      await axios.request({
        url: getEndpoint(),
        method: 'POST',
        data,
        headers: {
          'Content-type': 'multipart/form-data',
          'Authorization': `Bearer ${values.token}`
        }
      })
      toast.success('Mensagem enviada com sucesso');
    } catch (err) {
      toastError(err);
    }
  }

  const renderFormMessageText = () => {
    return (
      <Formik
        initialValues={formMessageTextData}
        enableReinitialize={true}
        onSubmit={(values, actions) => {
          setTimeout(async () => {
            await handleSendTextMessage(values);
            actions.setSubmitting(false);
            actions.resetForm()
          }, 400);
        }}
      >
        {({ isSubmitting }) => (
          <Form className={classes.formContainer}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Field
                  as={TextField}
                  label={i18n.t("messagesAPI.textMessage.token")}
                  name="token"
                  variant="outlined"
                  margin="dense"
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <Field
                  as={TextField}
                  label={i18n.t("messagesAPI.textMessage.number")}
                  name="number"
                  variant="outlined"
                  margin="dense"
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <Field
                  as={TextField}
                  label={i18n.t("messagesAPI.textMessage.body")}
                  name="body"
                  variant="outlined"
                  margin="dense"
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12}  md={6}>
                <Field
                  as={TextField}
                  label={i18n.t("messagesAPI.textMessage.userId")}
                  name="userId"
                  variant="outlined"
                  margin="dense"
                  fullWidth
                />
              </Grid>
              <Grid item xs={12}  md={6}>
                <Field
                  as={TextField}
                  label={i18n.t("messagesAPI.textMessage.queueId")}
                  name="queueId"
                  variant="outlined"
                  margin="dense"
                  fullWidth
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{
                    background: "linear-gradient(135deg, #00b4db 0%, #045de9 100%)",
                    color: "#fff",
                    fontWeight: 700,
                    borderRadius: "12px",
                    py: 1,
                    boxShadow: "0 8px 20px rgba(0, 180, 219, 0.2)",
                  }}
                >
                  {isSubmitting ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : 'Enviar Teste'}
                </Button>
              </Grid>
            </Grid>
          </Form>
        )}
      </Formik>
    )
  }

  const renderFormMessageMedia = () => {
    return (
      <Formik
        initialValues={formMessageMediaData}
        enableReinitialize={true}
        onSubmit={(values, actions) => {
          setTimeout(async () => {
            await handleSendMediaMessage(values);
            actions.setSubmitting(false);
            actions.resetForm()
            document.getElementById('medias').files = null
            document.getElementById('medias').value = null
          }, 400);
        }}
      >
        {({ isSubmitting }) => (
          <Form className={classes.formContainer}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Field
                  as={TextField}
                  label={i18n.t("messagesAPI.mediaMessage.token")}
                  name="token"
                  variant="outlined"
                  margin="dense"
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <Field
                  as={TextField}
                  label={i18n.t("messagesAPI.mediaMessage.number")}
                  name="number"
                  variant="outlined"
                  margin="dense"
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <Field
                  as={TextField}
                  label={i18n.t("messagesAPI.textMessage.body")}
                  name="body"
                  variant="outlined"
                  margin="dense"
                  fullWidth
                />
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ p: 2, border: "1px dashed rgba(0,0,0,0.1)", borderRadius: "12px", textAlign: "center" }}>
                  <input type="file" name="medias" id="medias" required onChange={(e) => setFile(e.target.files)} />
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{
                    background: "linear-gradient(135deg, #00b4db 0%, #045de9 100%)",
                    color: "#fff",
                    fontWeight: 700,
                    borderRadius: "12px",
                    py: 1,
                    boxShadow: "0 8px 20px rgba(0, 180, 219, 0.2)",
                  }}
                >
                  {isSubmitting ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : 'Enviar Teste'}
                </Button>
              </Grid>
            </Grid>
          </Form>
        )}
      </Formik>
    )
  }

  return (
    <MainContainer>
      <MainHeader>
        <Title>{i18n.t("messagesAPI.API.title")}</Title>
      </MainHeader>
      
      <Paper className={classes.mainPaper} variant="outlined">
        <Grid container spacing={4}>
          <Grid item xs={12}>
            <Typography variant="h6" className={classes.sectionTitle}>
              {i18n.t("messagesAPI.API.methods.title")}
            </Typography>
            <Box sx={{ mb: 4 }}>
              <Typography variant="body1" sx={{ mb: 1 }}>{i18n.t("messagesAPI.API.methods.messagesText")}</Typography>
              <Typography variant="body1">{i18n.t("messagesAPI.API.methods.messagesMidia")}</Typography>
            </Box>
            
            <Divider sx={{ my: 4 }} />
            
            <Typography variant="h6" className={classes.sectionTitle}>
              {i18n.t("messagesAPI.API.instructions.title")}
            </Typography>
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle1" fontWeight={700}>{i18n.t("messagesAPI.API.instructions.comments")}</Typography>
              <ul>
                <li><Typography variant="body2">{i18n.t("messagesAPI.API.instructions.comments1")}</Typography></li>
                <li><Typography variant="body2">{i18n.t("messagesAPI.API.instructions.comments2")}</Typography></li>
              </ul>
            </Box>
          </Grid>

          <Grid item xs={12} lg={6}>
            <Typography variant="h6" className={classes.sectionTitle}>
              {i18n.t("messagesAPI.API.text.title")}
            </Typography>
            <Box className={classes.codeBlock} sx={{ mb: 3 }}>
              <b>Endpoint:</b> {getEndpoint()} <br />
              <b>Method:</b> POST <br />
              <b>Body:</b> <br />
              <pre>
{`{
  "number": "558599999999",
  "body": "Message",
  "userId": 1,
  "queueId": 1
}`}
              </pre>
            </Box>
            <Paper sx={{ p: 3, borderRadius: "16px", background: "rgba(0,0,0,0.02)", boxShadow: "none" }}>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700 }}>TESTAR ENVIO DE TEXTO</Typography>
              {renderFormMessageText()}
            </Paper>
          </Grid>

          <Grid item xs={12} lg={6}>
            <Typography variant="h6" className={classes.sectionTitle}>
              {i18n.t("messagesAPI.API.media.title")}
            </Typography>
            <Box className={classes.codeBlock} sx={{ mb: 3 }}>
              <b>Endpoint:</b> {getEndpoint()} <br />
              <b>Method:</b> POST <br />
              <b>Headers:</b> Content-Type (multipart/form-data)
            </Box>
            <Paper sx={{ p: 3, borderRadius: "16px", background: "rgba(0,0,0,0.02)", boxShadow: "none" }}>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700 }}>TESTAR ENVIO DE MÍDIA</Typography>
              {renderFormMessageMedia()}
            </Paper>
          </Grid>
        </Grid>
      </Paper>
    </MainContainer>
  );
};

export default MessagesAPI;