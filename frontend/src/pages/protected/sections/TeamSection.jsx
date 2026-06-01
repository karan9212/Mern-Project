import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography
} from '@mui/material';

function TeamSection({
  editingEmployeeId,
  handleSaveEmployee,
  employeeForm,
  handleEmployeeInputChange,
  handleEducationEntryChange,
  addEducationEntry,
  removeEducationEntry,
  handleEducationCertificateUpload,
  isEmployeeSaving,
  resetEmployeeForm,
  isEmployeesLoading,
  employees,
  handleEditEmployee,
  currentEmployeeRole,
  canEditEmployee,
  collegeDepartments,
  schoolClasses,
  schoolBoards
}) {
  const navigate = useNavigate();
  const canAssignAdmin = currentEmployeeRole === 'admin';

  return (
    <Grid container spacing={2.5}>
      <Grid size={{ xs: 12, lg: 5 }}>
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1.2} mb={2}>
              <Typography variant="h6" fontWeight={700}>
                {editingEmployeeId ? 'Update Employee' : 'Create Employee'}
              </Typography>
              <Stack direction="row" spacing={1}>
                <Button size="small" variant="outlined" onClick={() => navigate('/sellers')}>
                  Add Seller
                </Button>
                <Button size="small" variant="outlined" onClick={() => navigate('/deliveries')}>
                  Add Delivery Guy
                </Button>
              </Stack>
            </Stack>
            <Box component="form" onSubmit={handleSaveEmployee}>
              <Stack spacing={2}>
                <TextField label="Name" name="name" value={employeeForm.name} onChange={handleEmployeeInputChange} required fullWidth />
                <FormControl fullWidth required>
                  <InputLabel id="position-label">Position</InputLabel>
                  <Select
                    labelId="position-label"
                    name="position"
                    value={employeeForm.position}
                    label="Position"
                    onChange={handleEmployeeInputChange}
                  >
                    <MenuItem value="Manager">Manager</MenuItem>
                    <MenuItem value="Team Lead">Team Lead</MenuItem>
                    <MenuItem value="HR Executive">HR Executive</MenuItem>
                    <MenuItem value="Recruiter">Recruiter</MenuItem>
                    <MenuItem value="Staff">Staff</MenuItem>
                  </Select>
                </FormControl>
                <TextField label="Phone Number" name="phoneNo" value={employeeForm.phoneNo} onChange={handleEmployeeInputChange} required fullWidth />
                <TextField label="Aadhaar Number" name="aadhaarNumber" value={employeeForm.aadhaarNumber} onChange={handleEmployeeInputChange} required fullWidth />
                <FormControl fullWidth>
                  <InputLabel id="team-user-type-label">Employee Type</InputLabel>
                  <Select
                    labelId="team-user-type-label"
                    name="employeeType"
                    multiple
                    value={employeeForm.employeeType}
                    label="Employee Type"
                    onChange={handleEmployeeInputChange}
                  >
                    <MenuItem value="team">team</MenuItem>
                    <MenuItem value="subAdmin">subAdmin</MenuItem>
                    {canAssignAdmin ? <MenuItem value="admin">admin</MenuItem> : null}
                  </Select>
                </FormControl>
                <FormControl fullWidth>
                  <InputLabel id="gender-label">Gender</InputLabel>
                  <Select
                    labelId="gender-label"
                    name="gender"
                    value={employeeForm.gender}
                    label="Gender"
                    onChange={handleEmployeeInputChange}
                  >
                    <MenuItem value="male">Male</MenuItem>
                    <MenuItem value="female">Female</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  label="Date of Birth"
                  name="dateOfBirth"
                  type="date"
                  value={employeeForm.dateOfBirth}
                  onChange={handleEmployeeInputChange}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
                <TextField label="Address" name="address" value={employeeForm.address} onChange={handleEmployeeInputChange} required fullWidth multiline minRows={2} />
                <FormControl fullWidth required>
                  <InputLabel id="department-label">Department</InputLabel>
                  <Select
                    labelId="department-label"
                    name="department"
                    value={employeeForm.department}
                    label="Department"
                    onChange={handleEmployeeInputChange}
                  >
                    <MenuItem value="HR">HR</MenuItem>
                    <MenuItem value="Engineering">Engineering</MenuItem>
                    <MenuItem value="Sales">Sales</MenuItem>
                    <MenuItem value="Operations">Operations</MenuItem>
                    <MenuItem value="Finance">Finance</MenuItem>
                  </Select>
                </FormControl>
                <TextField label="Experience (yy/mm)" name="experience" value={employeeForm.experience} onChange={handleEmployeeInputChange} fullWidth />
                <Stack spacing={2}>
                  <Typography variant="subtitle1" fontWeight={700}>
                    Education
                  </Typography>
                  {employeeForm.educationEntries.map((entry, index) => {
                    const departmentOptions = Object.keys(collegeDepartments);
                    const courseOptions = collegeDepartments[entry.eduDepartment] || [];

                    return (
                      <Card key={entry.id} variant="outlined" sx={{ borderRadius: 2 }}>
                        <CardContent>
                          <Stack spacing={2}>
                            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1}>
                              <Typography fontWeight={700}>Education Entry {index + 1}</Typography>
                              {employeeForm.educationEntries.length > 1 && (
                                <Button color="error" variant="text" onClick={() => removeEducationEntry(entry.id)}>
                                  Remove
                                </Button>
                              )}
                            </Stack>

                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    checked={entry.educationType === 'school'}
                                    onChange={() => handleEducationEntryChange(entry.id, 'educationType', 'school')}
                                  />
                                }
                                label="School"
                              />
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    checked={entry.educationType === 'college'}
                                    onChange={() => handleEducationEntryChange(entry.id, 'educationType', 'college')}
                                  />
                                }
                                label="College"
                              />
                            </Stack>

                            {entry.educationType === 'college' ? (
                              <>
                                <TextField
                                  label="College Name"
                                  value={entry.collegeName}
                                  onChange={(e) => handleEducationEntryChange(entry.id, 'collegeName', e.target.value)}
                                  required
                                  fullWidth
                                />
                                <Autocomplete
                                  options={departmentOptions}
                                  value={entry.eduDepartment}
                                  onChange={(_, value) => handleEducationEntryChange(entry.id, 'eduDepartment', value || '')}
                                  renderInput={(params) => <TextField {...params} label="Department" required fullWidth />}
                                />
                                <Autocomplete
                                  options={courseOptions}
                                  value={entry.courseName}
                                  onChange={(_, value) => handleEducationEntryChange(entry.id, 'courseName', value || '')}
                                  renderInput={(params) => <TextField {...params} label="Course Name" required fullWidth />}
                                  disabled={!entry.eduDepartment}
                                />
                                <TextField
                                  label="From Date"
                                  type="date"
                                  value={entry.fromDate}
                                  onChange={(e) => handleEducationEntryChange(entry.id, 'fromDate', e.target.value)}
                                  InputLabelProps={{ shrink: true }}
                                  required
                                  fullWidth
                                />
                                <FormControlLabel
                                  control={
                                    <Checkbox
                                      checked={entry.currentlyPursuing}
                                      onChange={(e) => handleEducationEntryChange(entry.id, 'currentlyPursuing', e.target.checked)}
                                    />
                                  }
                                  label="Currently Pursuing"
                                />
                                {!entry.currentlyPursuing && (
                                  <>
                                    <TextField
                                      label="To Date"
                                      type="date"
                                      value={entry.toDate}
                                      onChange={(e) => handleEducationEntryChange(entry.id, 'toDate', e.target.value)}
                                      InputLabelProps={{ shrink: true }}
                                      required
                                      fullWidth
                                    />
                                    <Button variant="outlined" component="label">
                                      {entry.certificateName ? `Certificate: ${entry.certificateName}` : 'Upload Degree Certificate'}
                                      <input
                                        type="file"
                                        hidden
                                        accept=".pdf,image/*"
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          handleEducationCertificateUpload(entry.id, file);
                                          e.target.value = '';
                                        }}
                                      />
                                    </Button>
                                  </>
                                )}
                              </>
                            ) : (
                              <>
                                <TextField
                                  label="School Name"
                                  value={entry.schoolName}
                                  onChange={(e) => handleEducationEntryChange(entry.id, 'schoolName', e.target.value)}
                                  required
                                  fullWidth
                                />
                                <TextField
                                  label="School Address"
                                  value={entry.schoolAddress}
                                  onChange={(e) => handleEducationEntryChange(entry.id, 'schoolAddress', e.target.value)}
                                  required
                                  fullWidth
                                />
                                <Autocomplete
                                  options={schoolClasses}
                                  value={entry.schoolClass}
                                  onChange={(_, value) => handleEducationEntryChange(entry.id, 'schoolClass', value || '')}
                                  renderInput={(params) => <TextField {...params} label="Class" required fullWidth />}
                                />
                                <Autocomplete
                                  options={schoolBoards}
                                  value={entry.boardName}
                                  onChange={(_, value) => handleEducationEntryChange(entry.id, 'boardName', value || '')}
                                  renderInput={(params) => <TextField {...params} label="Board Name" required fullWidth />}
                                />
                                <TextField
                                  label="From Date"
                                  type="date"
                                  value={entry.fromDate}
                                  onChange={(e) => handleEducationEntryChange(entry.id, 'fromDate', e.target.value)}
                                  InputLabelProps={{ shrink: true }}
                                  required
                                  fullWidth
                                />
                                <TextField
                                  label="To Date"
                                  type="date"
                                  value={entry.toDate}
                                  onChange={(e) => handleEducationEntryChange(entry.id, 'toDate', e.target.value)}
                                  InputLabelProps={{ shrink: true }}
                                  required
                                  fullWidth
                                />
                                <Button variant="outlined" component="label">
                                  {entry.certificateName ? `Certificate: ${entry.certificateName}` : 'Upload Certificate'}
                                  <input
                                    type="file"
                                    hidden
                                    accept=".pdf,image/*"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      handleEducationCertificateUpload(entry.id, file);
                                      e.target.value = '';
                                    }}
                                  />
                                </Button>
                              </>
                            )}

                            {index === employeeForm.educationEntries.length - 1 && (
                              <Button variant="outlined" onClick={addEducationEntry}>
                                Add More Education
                              </Button>
                            )}
                          </Stack>
                        </CardContent>
                      </Card>
                    );
                  })}
                </Stack>
                <FormControl fullWidth>
                  <InputLabel id="recruited-via-label">Recruited Via</InputLabel>
                  <Select
                    labelId="recruited-via-label"
                    name="recruitedVia"
                    value={employeeForm.recruitedVia}
                    label="Recruited Via"
                    onChange={handleEmployeeInputChange}
                  >
                    <MenuItem value="referral">Referral</MenuItem>
                    <MenuItem value="self">Self</MenuItem>
                    <MenuItem value="hiring campaign">Hiring Campaign</MenuItem>
                  </Select>
                </FormControl>
                {employeeForm.recruitedVia === 'referral' && (
                  <>
                    <TextField label="Referral By Name" name="referralByName" value={employeeForm.referralByName} onChange={handleEmployeeInputChange} fullWidth />
                    <TextField label="Referral By Employee ID" name="referralByEmployeeId" value={employeeForm.referralByEmployeeId} onChange={handleEmployeeInputChange} fullWidth />
                  </>
                )}
                {editingEmployeeId ? (
                  <FormControl fullWidth>
                    <InputLabel id="working-status-label">Status</InputLabel>
                    <Select
                      labelId="working-status-label"
                      name="status"
                      value={employeeForm.status}
                      label="Status"
                      onChange={handleEmployeeInputChange}
                    >
                      <MenuItem value="Active">Active</MenuItem>
                      <MenuItem value="Not Active">Not Active</MenuItem>
                      <MenuItem value="Deleted">Deleted</MenuItem>
                    </Select>
                  </FormControl>
                ) : null}
                <TextField
                  label="Date of Joining"
                  name="dateOfJoining"
                  type="date"
                  value={employeeForm.dateOfJoining}
                  onChange={handleEmployeeInputChange}
                  InputLabelProps={{ shrink: true }}
                  required
                  fullWidth
                />
                {editingEmployeeId ? (
                  <TextField
                    label="Date of Exit"
                    name="dateOfExit"
                    type="date"
                    value={employeeForm.dateOfExit}
                    onChange={handleEmployeeInputChange}
                    InputLabelProps={{ shrink: true }}
                    disabled={employeeForm.status === 'Active'}
                    fullWidth
                  />
                ) : null}
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                  <Button type="submit" variant="contained" fullWidth disabled={isEmployeeSaving}>
                    {isEmployeeSaving ? 'Saving...' : editingEmployeeId ? 'Update Employee' : 'Create Employee'}
                  </Button>
                  <Button type="button" variant="outlined" fullWidth onClick={resetEmployeeForm}>
                    Reset
                  </Button>
                </Stack>
              </Stack>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, lg: 7 }}>
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={700} gutterBottom>Existing Employees</Typography>
            {isEmployeesLoading ? (
              <Typography color="text.secondary">Loading employees...</Typography>
            ) : employees.length === 0 ? (
              <Typography color="text.secondary">No user yet.</Typography>
            ) : (
              <Stack spacing={1.2}>
                {employees.map((employee) => (
                  <Card key={employee.employeeId} variant="outlined" sx={{ borderRadius: 2 }}>
                    <CardContent sx={{ py: '12px !important' }}>
                      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1.2}>
                        <Box>
                          <Typography fontWeight={700}>{employee.name}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {employee.position || 'N/A'} | {employee.department || 'N/A'} | {Array.isArray(employee.employeeType) ? employee.employeeType.join(', ') : 'team'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Phone: {employee.phoneNo || 'N/A'} | Aadhaar: {employee.aadhaarNumber || 'N/A'}
                          </Typography>
                          <Typography variant="caption" display="block" color="text.secondary">
                            DOJ: {employee.dateOfJoining ? new Date(employee.dateOfJoining).toLocaleDateString() : 'N/A'} | Exit: {employee.dateOfExit ? new Date(employee.dateOfExit).toLocaleDateString() : 'N/A'}
                          </Typography>
                        </Box>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Chip
                            size="small"
                            color={employee.status === 'Active' ? 'success' : employee.status === 'Deleted' ? 'error' : 'warning'}
                            label={employee.status || 'Not Active'}
                          />
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => handleEditEmployee(employee)}
                            disabled={!canEditEmployee(employee)}
                          >
                            Edit
                          </Button>
                        </Stack>
                      </Stack>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

export default TeamSection;
