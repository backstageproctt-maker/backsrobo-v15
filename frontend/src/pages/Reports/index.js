import React, { useState, useEffect, useReducer, useContext } from "react";

import { toast } from "react-toastify";
import { useHistory } from "react-router-dom";

import { makeStyles } from "@material-ui/core/styles";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import Paper from "@material-ui/core/Paper";
import Button from "@material-ui/core/Button";
import Pagination from "@material-ui/lab/Pagination";
import * as XLSX from 'xlsx';

import api from "../../services/api";
import TableRowSkeleton from "../../components/TableRowSkeleton";


import { i18n } from "../../translate/i18n";
import MainHeader from "../../components/MainHeader";
import Title from "../../components/Title";
import MainHeaderButtonsWrapper from "../../components/MainHeaderButtonsWrapper";
import MainContainer from "../../components/MainContainer";
import toastError from "../../errors/toastError";
import { AuthContext } from "../../context/Auth/AuthContext";
import { Can } from "../../components/Can";

import { Box, Chip, CircularProgress, FormControl, FormControlLabel, Grid, IconButton, InputLabel, MenuItem, Select, Switch, TextField, Tooltip, Typography } from "@material-ui/core";
import { UsersFilter } from "../../components/UsersFilter";
import { TagsFilter } from "../../components/TagsFilter";
import { WhatsappsFilter } from "../../components/WhatsappsFilter";
import { StatusFilter } from "../../components/StatusFilter";
import useDashboard from "../../hooks/useDashboard";

import QueueSelectCustom from "../../components/QueueSelectCustom";
import moment from "moment";
import ShowTicketLogModal from "../../components/ShowTicketLogModal";

import { blue, green } from "@material-ui/core/colors";
import { Facebook, Forward, History, Instagram, SaveAlt, Visibility, WhatsApp } from "@material-ui/icons";
import Autocomplete, { createFilterOptions } from "@material-ui/lab/Autocomplete";
import { Field } from "formik";

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
  filterPaper: {
    padding: theme.spacing(3),
    borderRadius: "12px",
    border: "1px solid #E2E8F0",
    marginBottom: theme.spacing(3),
  },
  tablePaper: {
    borderRadius: "12px",
    border: "1px solid #E2E8F0",
    overflow: "hidden",
  },
  filterButton: {
    backgroundColor: "#006B76",
    color: "#FFFFFF",
    fontWeight: "bold",
    borderRadius: "8px",
    textTransform: "none",
    padding: "8px 24px",
    "&:hover": {
      backgroundColor: "#00565E",
    },
  },
  clearButton: {
    color: "#64748B",
    fontWeight: "bold",
    textTransform: "none",
    marginRight: theme.spacing(1),
  },
}));

const Reports = () => {
  const classes = useStyles();
  const history = useHistory();
  const { getReport } = useDashboard();
  const { user } = useContext(AuthContext);

  const [loading, setLoading] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [searchParam, setSearchParam] = useState("");
  const [selectedContactId, setSelectedContactId] = useState(null);
  const [selectedWhatsapp, setSelectedWhatsapp] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState([]);
  const [options, setOptions] = useState([]);
  const [queueIds, setQueueIds] = useState([]);
  const [userIds, setUserIds] = useState([]);
  const [dateFrom, setDateFrom] = useState(moment("1", "D").format("YYYY-MM-DD"));
  const [dateTo, setDateTo] = useState(moment().format("YYYY-MM-DD"));
  const [onlyRated, setOnlyRated] = useState(false);
  const [totalTickets, setTotalTickets] = useState(0);
  const [tickets, setTickets] = useState([]);

  const [openTicketMessageDialog, setOpenTicketMessageDialog] = useState(false);
  const [ticketOpen, setTicketOpen] = useState(null);

  useEffect(() => {
    setLoading(true);
    const fetchContacts = async () => {
      try {
        const { data } = await api.get("contacts", {
          params: { searchParam },
        });
        setOptions(data.contacts);
        setLoading(false);
      } catch (err) {
        setLoading(false);
        toastError(err);
      }
    };

    if (searchParam.length > 0) {
      const delayDebounceFn = setTimeout(() => {
        fetchContacts();
      }, 500);
      return () => clearTimeout(delayDebounceFn);
    } else {
      fetchContacts();
    }
  }, [searchParam]);

  const handleFilter = async (page) => {
    setLoading(true);
    try {
      const data = await getReport({
        searchParam,
        contactId: selectedContactId,
        whatsappId: JSON.stringify(selectedWhatsapp),
        users: JSON.stringify(userIds),
        queueIds: JSON.stringify(queueIds),
        status: JSON.stringify(selectedStatus),
        dateFrom,
        dateTo,
        page: page,
        pageSize: pageSize,
        onlyRated: onlyRated ? "true" : "false"
      });

      setTotalTickets(data.totalTickets.total);
      setTickets(data.tickets);
      setPageNumber(page);
    } catch (error) {
      toastError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setSearchParam("");
    setSelectedContactId(null);
    setSelectedWhatsapp([]);
    setSelectedStatus([]);
    setQueueIds([]);
    setUserIds([]);
    setDateFrom(moment("1", "D").format("YYYY-MM-DD"));
    setDateTo(moment().format("YYYY-MM-DD"));
    setOnlyRated(false);
    setTickets([]);
  };

  return (
    <MainContainer className={classes.mainContainer}>
      {openTicketMessageDialog && (
        <ShowTicketLogModal
          isOpen={openTicketMessageDialog}
          handleClose={() => setOpenTicketMessageDialog(false)}
          ticketId={ticketOpen.id}
        />
      )}

      {/* Cabeçalho no estilo Pro */}
      <Box className={classes.headerBox}>
        <Typography variant="h5" fontWeight="bold" sx={{ color: "#1E293B" }}>
          Relatórios de Atendimentos
        </Typography>
        <Typography variant="body2" sx={{ color: "#64748B" }}>
          Painel analítico de atendimentos com filtros, exportação e navegação rápida para tickets.
        </Typography>
      </Box>

      {/* Card de Filtros */}
      <Paper className={classes.filterPaper} elevation={0}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2, gap: 1 }}>
            <Visibility sx={{ color: "#006B76", fontSize: 20 }} />
            <Typography sx={{ fontWeight: "bold", color: "#1E293B" }}>Filtros de Relatório</Typography>
        </Box>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <Autocomplete
              fullWidth
              options={options}
              size="small"
              getOptionLabel={(option) => option.name || ""}
              onChange={(e, newValue) => setSelectedContactId(newValue?.id || null)}
              renderInput={(params) => (
                <TextField 
                    {...params} 
                    label="Pesquisar Contato" 
                    variant="outlined" 
                    onChange={e => setSearchParam(e.target.value)}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <WhatsappsFilter onFiltered={(s) => setSelectedWhatsapp(s.map(t => t.id))} />
          </Grid>
          <Grid item xs={12} md={3}>
            <StatusFilter onFiltered={(s) => setSelectedStatus(s.map(t => t.status))} />
          </Grid>
          <Grid item xs={12} md={3}>
            <UsersFilter onFiltered={(s) => setUserIds(s.map(t => t.id))} />
          </Grid>
          <Grid item xs={12} md={3}>
            <QueueSelectCustom
              selectedQueueIds={queueIds}
              onChange={values => setQueueIds(values)}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              label="Data Inicial"
              type="date"
              value={dateFrom}
              variant="outlined"
              fullWidth
              size="small"
              onChange={(e) => setDateFrom(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              label="Data Final"
              type="date"
              value={dateTo}
              variant="outlined"
              fullWidth
              size="small"
              onChange={(e) => setDateTo(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={3} sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
            <FormControlLabel
              control={<Switch color="primary" checked={onlyRated} onChange={() => setOnlyRated(!onlyRated)} />}
              label="Apenas Avaliados"
            />
          </Grid>
        </Grid>

        <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
            <Button className={classes.clearButton} onClick={handleClearFilters}>Limpar filtros</Button>
            <Button className={classes.filterButton} onClick={() => handleFilter(1)}>Aplicar Filtro</Button>
        </Box>
      </Paper>

      {/* Tabela de Resultados */}
      <Paper className={classes.tablePaper} elevation={0}>
        <Table size="medium">
          <TableHead sx={{ backgroundColor: "#F8FAFC" }}>
            <TableRow>
              <TableCell align="center">ID</TableCell>
              <TableCell align="left">Conexão</TableCell>
              <TableCell align="left">Cliente</TableCell>
              <TableCell align="left">Usuário</TableCell>
              <TableCell align="left">Fila</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="center">Tempo</TableCell>
              <TableCell align="center">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tickets.map((ticket) => (
              <TableRow key={ticket.id} hover>
                <TableCell align="center">{ticket.id}</TableCell>
                <TableCell align="left">{ticket?.whatsappName}</TableCell>
                <TableCell align="left">{ticket?.contactName}</TableCell>
                <TableCell align="left">{ticket?.userName}</TableCell>
                <TableCell align="left">{ticket?.queueName}</TableCell>
                <TableCell align="center">
                    <Chip 
                        label={ticket?.status} 
                        size="small" 
                        sx={{ 
                            backgroundColor: ticket?.status === 'OPEN' ? '#DBEAFE' : '#F1F5F9',
                            color: ticket?.status === 'OPEN' ? '#2563EB' : '#64748B',
                            fontWeight: 'bold'
                        }} 
                    />
                </TableCell>
                <TableCell align="center">{ticket?.supportTime}</TableCell>
                <TableCell align="center">
                    <IconButton size="small" onClick={() => { setTicketOpen(ticket); setOpenTicketMessageDialog(true); }}>
                        <History sx={{ color: "#64748B" }} />
                    </IconButton>
                    <IconButton size="small" onClick={() => history.push(`/tickets/${ticket.uuid}`)}>
                        <Visibility sx={{ color: "#2563EB" }} />
                    </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {loading && <TableRowSkeleton columns={8} />}
          </TableBody>
        </Table>
        
        <Box sx={{ p: 2, display: "flex", justifyContent: "center" }}>
          <Pagination
            count={Math.ceil(totalTickets / pageSize)}
            page={pageNumber}
            onChange={(event, value) => handleFilter(value)}
            color="primary"
          />
        </Box>
      </Paper>
    </MainContainer>
  );
};

export default Reports;
