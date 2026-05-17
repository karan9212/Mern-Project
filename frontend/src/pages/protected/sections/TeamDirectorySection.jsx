import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Avatar, Card, CardContent, Grid, Stack, TextField, Typography } from '@mui/material';
import API from '../../../api/api';

function BoxTitle({ title, description }) {
  return (
    <Stack spacing={0.5}>
      <Typography variant="h6" fontWeight={700}>{title}</Typography>
      <Typography variant="body2" color="text.secondary">{description}</Typography>
    </Stack>
  );
}

function TeamDirectorySection({ currentEmployeeId, showToast }) {
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await API.get('/teams');
      const records = (res.data?.users || []).filter((employee) => employee.status !== 'Deleted');
      setEmployees(records);
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to load team directory.', 'error');
    }
  }, [showToast]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const filteredEmployees = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return employees;

    return employees.filter((employee) =>
      [employee.name, employee.department, employee.position, employee.employeeId]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [employees, searchTerm]);

  return (
    <Stack spacing={2.5}>
      <Card sx={{ borderRadius: 3 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2}>
            <BoxTitle
              title="Team Directory"
              description="Quick visibility into teammates, reporting functions and active internal contacts."
            />
            <TextField
              label="Search team"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              sx={{ minWidth: { xs: '100%', md: 260 } }}
            />
          </Stack>
        </CardContent>
      </Card>
      <Grid container spacing={2.5}>
        {filteredEmployees.length === 0 ? (
          <Grid size={{ xs: 12 }}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography color="text.secondary">No team members found.</Typography>
              </CardContent>
            </Card>
          </Grid>
        ) : (
          filteredEmployees.map((employee) => (
            <Grid key={employee.employeeId} size={{ xs: 12, md: 6, xl: 4 }}>
              <Card
                sx={{
                  borderRadius: 3,
                  borderWidth: employee.employeeId === currentEmployeeId ? 2 : 1,
                  borderStyle: 'solid',
                  borderColor: employee.employeeId === currentEmployeeId ? 'primary.main' : 'divider'
                }}
              >
                <CardContent>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Avatar src={employee.profileImage}>
                      {String(employee.name || 'T').charAt(0).toUpperCase()}
                    </Avatar>
                    <Stack spacing={0.25}>
                      <Typography fontWeight={700}>{employee.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {employee.position || 'N/A'} • {employee.department || 'N/A'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {employee.phoneNo || 'N/A'} • {employee.employeeId}
                      </Typography>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))
        )}
      </Grid>
    </Stack>
  );
}

export default TeamDirectorySection;
