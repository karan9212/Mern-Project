// import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Topnav from '../../components/Topnav';
import Bg from '../../assets/videos/dashboard-bg.mp4';
import { styled } from '@mui/material/styles';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Grid';
import Divider from '@mui/material/Divider';
import CardContent from '@mui/material/CardContent';

const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: '#fff',
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: 'center',
  color: (theme.vars ?? theme).palette.text.secondary,
  ...theme.applyStyles('dark', {
    backgroundColor: '#1A2027',
  }),
}));

function Dashboard() {
  const navigate = useNavigate();
  const name = localStorage.getItem('name');
  // const id = localStorage.getItem('userId');
  const sessionExpiry = localStorage.getItem('sessionExpiry');

  // useEffect(() => {
  //   const now = new Date().getTime();
  //   if (!name || !sessionExpiry || now > Number(sessionExpiry)) {
  //     handleLogout(); // logout if expired
  //   }
  // }, []);

  const handleLogout = () => {
    localStorage.removeItem('name');
    localStorage.removeItem('userId');
    localStorage.removeItem('sessionExpiry');
    alert('You have been logged out.');
    navigate('/');
  };

  return (
    <>
      <div className="mainDiv">
        <video
          className="bgVideo"
          autoPlay
          loop
          muted
          playsInline
        >
          <source src={Bg} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <Container fixed>
          <Card variant="outlined" className='dashboard-panel' style={{backgroundColor: 'transparent'}}>
            <CardContent sx={{padding: '0px'}}>
              <Topnav />
              <Box>
                <Stack>
                  <Item className='glassmo'>
                    <Grid container>
                      <Grid sx={{ xs: 6, md: 4 }}></Grid>
                      <Grid sx={{ xs: 6, md: 6 }}>
                        <Box>
                          <Stack>
                            <Item>
                              <Grid container>
                                <Grid></Grid>
                                <Grid></Grid>
                              </Grid>
                            </Item>
                            <Divider />
                            <Item>
                              <Grid container>
                                <Grid></Grid>
                                <Grid></Grid>
                              </Grid>
                            </Item>
                          </Stack>
                        </Box>
                      </Grid>
                    </Grid>
                  </Item>
                </Stack>
              </Box>


              
              <Typography gutterBottom sx={{ color: 'text.secondary', fontSize: 14 }}>
                Word of the Day
              </Typography>
              <Typography variant="h5" component="div">
                be nev o lent
              </Typography>
              <Typography sx={{ color: 'text.secondary', mb: 1.5 }}>adjective</Typography>
              <Typography variant="body2">
                well meaning and kindly.
                <br />
                {'"a benevolent smile"'}
              </Typography>
            </CardContent>
          </Card>
        </Container>


        {/* <div className="container">
          <h2>Welcome {name}</h2>
          <p>Your ID is: <strong>{id}</strong></p>
          <button onClick={handleLogout}>Logout</button>
        </div> */}
      </div>
    </>

  );
}

export default Dashboard;
