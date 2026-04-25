import React, { useState, useEffect } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import {
  TextField,
  Button,
  Box,
  Typography,
  Paper,
  Grid,
  IconButton,
  Card,
  CardContent,
  Divider,
} from '@material-ui/core';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import AddIcon from '@material-ui/icons/Add';
import ArrowForwardIcon from '@material-ui/icons/ArrowForward';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import MainContainer from "../../components/MainContainer";
import { format } from 'date-fns';

const useStyles = makeStyles((theme) => ({
  root: {
    backgroundColor: "#F8FAFC",
    minHeight: "100vh",
  },
  headerBox: {
    backgroundColor: "#EFF6FF",
    padding: theme.spacing(2, 3),
    borderRadius: "12px",
    marginBottom: theme.spacing(3),
    border: "1px solid #DBEAFE",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  kanbanContainer: {
    padding: theme.spacing(1),
  },
  column: {
    backgroundColor: "#F1F5F9",
    borderRadius: "12px",
    padding: theme.spacing(2),
    minHeight: "70vh",
    border: "1px solid #E2E8F0",
  },
  columnHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing(2),
    padding: theme.spacing(1),
    borderRadius: "8px",
    color: "#fff",
  },
  columnCount: {
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: "50%",
    width: "24px",
    height: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "0.75rem",
    fontWeight: "bold",
  },
  taskCard: {
    marginBottom: theme.spacing(2),
    borderRadius: "10px",
    border: "1px solid #E2E8F0",
    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
    transition: "all 0.2s",
    "&:hover": {
        transform: "translateY(-2px)",
        boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
    }
  },
  inputArea: {
    backgroundColor: "#fff",
    padding: theme.spacing(3),
    borderRadius: "12px",
    border: "1px solid #E2E8F0",
    marginBottom: theme.spacing(3),
    display: "flex",
    gap: theme.spacing(2),
    alignItems: "center"
  },
  colRecusada: { backgroundColor: "#EF4444" },
  colAguardando: { backgroundColor: "#F59E0B" },
  colAndamento: { backgroundColor: "#3B82F6" },
  colCompleta: { backgroundColor: "#10B981" },
  actionIcon: {
      padding: 4,
      color: "#64748B"
  }
}));

const ToDoList = () => {
  const classes = useStyles();
  const [task, setTask] = useState('');
  const [tasks, setTasks] = useState([]);
  const [editIndex, setEditIndex] = useState(-1);

  const statuses = [
    { id: 'recusada', label: 'Recusadas', class: classes.colRecusada },
    { id: 'aguardando', label: 'Aguardando Início', class: classes.colAguardando },
    { id: 'andamento', label: 'Em Andamento', class: classes.colAndamento },
    { id: 'completa', label: 'Completa', class: classes.colCompleta },
  ];

  useEffect(() => {
    const savedTasks = localStorage.getItem('tasks');
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  const handleAddTask = () => {
    if (!task.trim()) return;
    const now = new Date();
    if (editIndex >= 0) {
      const newTasks = [...tasks];
      newTasks[editIndex] = { ...newTasks[editIndex], text: task, updatedAt: now };
      setTasks(newTasks);
      setTask('');
      setEditIndex(-1);
    } else {
      setTasks([...tasks, { text: task, status: 'aguardando', createdAt: now, updatedAt: now, id: Date.now() }]);
      setTask('');
    }
  };

  const changeStatus = (taskId, newStatus) => {
    setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus, updatedAt: new Date() } : t));
  };

  const handleDeleteTask = (taskId) => {
    setTasks(tasks.filter(t => t.id !== taskId));
  };

  const handleEditTask = (index) => {
    setTask(tasks.find((t, i) => i === index).text);
    setEditIndex(index);
  };

  const renderTask = (t, index) => (
    <Card key={t.id} className={classes.taskCard} elevation={0}>
        <CardContent style={{ padding: 12 }}>
            <Typography variant="body2" style={{ fontWeight: 500, color: "#1E293B", marginBottom: 8 }}>{t.text}</Typography>
            <Typography variant="caption" style={{ color: "#94A3B8" }}>
                {format(new Date(t.updatedAt), "dd/MM/yy HH:mm")}
            </Typography>
            <Divider style={{ margin: "10px 0" }} />
            <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                    <IconButton className={classes.actionIcon} onClick={() => handleEditTask(tasks.findIndex(tk => tk.id === t.id))}><EditIcon style={{ fontSize: 16 }} /></IconButton>
                    <IconButton className={classes.actionIcon} onClick={() => handleDeleteTask(t.id)}><DeleteIcon style={{ fontSize: 16 }} /></IconButton>
                </Box>
                <Box>
                    {t.status !== 'recusada' && <IconButton className={classes.actionIcon} onClick={() => changeStatus(t.id, statuses[statuses.findIndex(s => s.id === t.status) - 1].id)}><ArrowBackIcon style={{ fontSize: 16 }} /></IconButton>}
                    {t.status !== 'completa' && <IconButton className={classes.actionIcon} onClick={() => changeStatus(t.id, statuses[statuses.findIndex(s => s.id === t.status) + 1].id)}><ArrowForwardIcon style={{ fontSize: 16 }} /></IconButton>}
                </Box>
            </Box>
        </CardContent>
    </Card>
  );

  return (
    <MainContainer className={classes.root}>
      <Box className={classes.headerBox}>
        <Box>
            <Typography variant="h5" style={{ fontWeight: "bold", color: "#1E293B" }}>Gestão de Tarefas</Typography>
            <Typography variant="body2" style={{ color: "#64748B" }}>Organize suas atividades diárias e acompanhe seu progresso.</Typography>
        </Box>
      </Box>

      <Box className={classes.inputArea}>
        <TextField
          fullWidth
          label="O que precisa ser feito?"
          value={task}
          onChange={(e) => setTask(e.target.value)}
          variant="outlined"
          size="small"
        />
        <Button 
            variant="contained" 
            onClick={handleAddTask} 
            startIcon={editIndex >= 0 ? <EditIcon /> : <AddIcon />}
            style={{ backgroundColor: "#006B76", color: "#fff", textTransform: "none", fontWeight: "bold", minWidth: 150 }}
        >
          {editIndex >= 0 ? 'Salvar Alteração' : 'Adicionar Tarefa'}
        </Button>
      </Box>

      <Grid container spacing={2} className={classes.kanbanContainer}>
        {statuses.map((status) => (
          <Grid item xs={12} sm={6} md={3} key={status.id}>
            <div className={classes.column}>
                <div className={`${classes.columnHeader} ${status.class}`}>
                    <Typography variant="subtitle2" style={{ fontWeight: 700 }}>{status.label}</Typography>
                    <div className={classes.columnCount}>
                        {tasks.filter(t => t.status === status.id).length}
                    </div>
                </div>
                {tasks.filter(t => t.status === status.id).map((t, index) => renderTask(t, index))}
                {tasks.filter(t => t.status === status.id).length === 0 && (
                    <Box textAlign="center" py={4}>
                        <Typography variant="caption" style={{ color: "#94A3B8" }}>Sem tarefas nesta coluna.</Typography>
                    </Box>
                )}
            </div>
          </Grid>
        ))}
      </Grid>
    </MainContainer>
  );
};

export default ToDoList;
