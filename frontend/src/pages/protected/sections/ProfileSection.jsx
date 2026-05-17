import React from 'react';
import { Avatar, Button, Card, CardContent, Grid, Stack, TextField, Typography } from '@mui/material';

function ProfileSection({
  profileImage,
  name,
  loginAs,
  department,
  position,
  userId,
  phoneNo,
  gender,
  address,
  status,
  dateOfJoining,
  dateOfExit,
  userCategory,
  noOfBookings,
  documents,
  education,
  fileInputRef,
  handleProfileImageUpload,
  handleChooseProfileImage,
  isUploadingImage
}) {
  const isEmployee = loginAs === 'employee';
  const toDisplayDate = (value) => (value ? new Date(value).toLocaleDateString() : 'N/A');

  return (
    <Grid container spacing={2.5}>
      <Grid size={{ xs: 12, md: 4 }}>
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Stack spacing={1.5} alignItems="center">
              <Avatar src={profileImage} sx={{ width: 82, height: 82 }}>
                {name.charAt(0).toUpperCase()}
              </Avatar>
              <Typography variant="h6" fontWeight={700}>{name}</Typography>
              <Typography variant="body2" color="text.secondary">User ID: {userId}</Typography>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleProfileImageUpload}
                style={{ display: 'none' }}
              />
              <Button
                variant="outlined"
                size="small"
                onClick={handleChooseProfileImage}
                disabled={isUploadingImage}
              >
                {isUploadingImage ? 'Uploading...' : 'Upload Profile Picture'}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, md: 8 }}>
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={700} gutterBottom>Account Details</Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Display Name" value={name} fullWidth disabled />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label={isEmployee ? 'Employee ID' : 'User ID'} value={userId} fullWidth disabled />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Phone Number" value={phoneNo} fullWidth disabled />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Status" value={status} fullWidth disabled />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Gender" value={gender} fullWidth disabled />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Date of Joining" value={toDisplayDate(dateOfJoining)} fullWidth disabled />
              </Grid>
              {isEmployee ? (
                <>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField label="Department" value={department} fullWidth disabled />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField label="Role" value={position} fullWidth disabled />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField label="Date of Exit" value={dateOfExit ? toDisplayDate(dateOfExit) : 'Still working'} fullWidth disabled />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField label="Education Records" value={Array.isArray(education) ? education.length : 0} fullWidth disabled />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField label="Documents Uploaded" value={Array.isArray(documents) ? documents.length : 0} fullWidth disabled />
                  </Grid>
                </>
              ) : (
                <>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField label="User Category" value={userCategory || 'NP'} fullWidth disabled />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField label="Bookings Completed" value={noOfBookings ?? 0} fullWidth disabled />
                  </Grid>
                </>
              )}
              <Grid size={{ xs: 12 }}>
                <TextField label="Address" value={address} fullWidth disabled multiline minRows={2} />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

export default ProfileSection;
