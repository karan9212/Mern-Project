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
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';

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
          <Card variant="outlined" className='dashboard-panel' sx={{ backgroundColor: 'transparent' }}>
            <CardContent sx={{ padding: '0px', height: '100%' }}>
              <Topnav />
              <Box sx={{ height: '100%' }}>
                <Stack sx={{ height: '100%' }}>
                  <Item className='glassmo' sx={{ height: '100%' }}>
                    <Grid container sx={{ height: '100%' }}>
                      <Grid size={12} sx={{ height: '100%' }}>
                        <Box sx={{ height: '100%' }}>
                          <Grid container sx={{ height: '100%' }}>
                            <Grid size={3} sx={{ height: '100%' }}>
                              <Card variant="outlined" className='dashboard-content-panel left'>
                                <List className='glassmo sideMenu'
                                  sx={{
                                    width: '100%',
                                    maxWidth: 360,
                                    bgcolor: 'background.paper',
                                    position: 'relative',
                                    overflow: 'auto',
                                    maxHeight: '100%',
                                    '& ul': { padding: 0 },
                                  }}
                                  subheader={<li />}
                                >
                                  {[0, 1, 2, 3, 4].map((sectionId) => (
                                    <li key={`section-${sectionId}`} className=''>
                                      <ul>
                                        <ListSubheader className='glassmo' sx={{textAlign: 'left'}}>{`I'm sticky ${sectionId}`}</ListSubheader>
                                        {[0, 1, 2].map((item) => (
                                          <ListItemButton>
                                            <ListItem key={`item-${sectionId}-${item}`}>
                                              <ListItemText primary={`Item ${item}`} />
                                            </ListItem>
                                          </ListItemButton>
                                        ))}
                                      </ul>
                                    </li>
                                  ))}
                                </List>
                              </Card>
                            </Grid>
                            <Grid size={9} sx={{ height: '100%' }}>
                              <Card variant="outlined" className='dashboard-content-panel right'></Card>
                            </Grid>
                          </Grid>
                        </Box>
                      </Grid>
                    </Grid>
                  </Item>
                </Stack>
              </Box>
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
