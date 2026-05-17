import React, { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography
} from '@mui/material';

function EmployeeTasksSection({ userId }) {
  const storageKey = useMemo(() => `dashboard-tasks:${userId}`, [userId]);
  const [tasks, setTasks] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    dueDate: '',
    priority: 'Medium'
  });

  useEffect(() => {
    const savedTasks = localStorage.getItem(storageKey);
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks));
      return;
    }

    const defaults = [
      { id: `${storageKey}-1`, title: 'Review today’s queue', dueDate: '', priority: 'High', done: false },
      { id: `${storageKey}-2`, title: 'Update pending follow-ups', dueDate: '', priority: 'Medium', done: false }
    ];
    setTasks(defaults);
  }, [storageKey]);

  useEffect(() => {
    if (tasks.length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(tasks));
    }
  }, [storageKey, tasks]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!formData.title.trim()) return;

    setTasks((prev) => [
      {
        id: `task-${Date.now()}`,
        title: formData.title.trim(),
        dueDate: formData.dueDate,
        priority: formData.priority,
        done: false
      },
      ...prev
    ]);
    setFormData({ title: '', dueDate: '', priority: 'Medium' });
  };

  const toggleTaskStatus = (taskId) => {
    setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, done: !task.done } : task)));
  };

  return (
    <Grid container spacing={2.5}>
      <Grid size={{ xs: 12, lg: 4 }}>
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={700} gutterBottom>Plan Your Work</Typography>
            <Stack component="form" spacing={2} onSubmit={handleSubmit}>
              <TextField
                label="Task Title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                fullWidth
              />
              <TextField
                label="Due Date"
                name="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <TextField
                select
                label="Priority"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                fullWidth
              >
                <MenuItem value="High">High</MenuItem>
                <MenuItem value="Medium">Medium</MenuItem>
                <MenuItem value="Low">Low</MenuItem>
              </TextField>
              <Button type="submit" variant="contained">Add Task</Button>
            </Stack>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, lg: 8 }}>
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={700} gutterBottom>My Tasks</Typography>
            <Stack spacing={1.25}>
              {tasks.length === 0 ? (
                <Typography color="text.secondary">No tasks yet.</Typography>
              ) : (
                tasks.map((task) => (
                  <Card
                    key={task.id}
                    variant="outlined"
                    sx={{
                      borderRadius: 2,
                      cursor: 'pointer',
                      borderColor: task.done ? 'success.main' : 'divider'
                    }}
                    onClick={() => toggleTaskStatus(task.id)}
                  >
                    <CardContent sx={{ py: '12px !important' }}>
                      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={1}>
                        <Typography sx={{ textDecoration: task.done ? 'line-through' : 'none' }}>
                          {task.title}
                        </Typography>
                        <Stack direction="row" spacing={1} alignItems="center">
                          {task.dueDate ? <Chip size="small" label={task.dueDate} /> : null}
                          <Chip size="small" label={task.priority} color={task.priority === 'High' ? 'error' : task.priority === 'Medium' ? 'warning' : 'default'} />
                          <Chip size="small" label={task.done ? 'Done' : 'Pending'} color={task.done ? 'success' : 'primary'} />
                        </Stack>
                      </Stack>
                    </CardContent>
                  </Card>
                ))
              )}
            </Stack>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

export default EmployeeTasksSection;
