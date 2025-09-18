import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AppBar, Toolbar, Typography, Button, Box, Container } from '@mui/material';
import { Link as LinkIcon, BarChart as BarChartIcon } from '@mui/icons-material';
import UrlShortener from './components/UrlShortener';
import Statistics from './components/Statistics';
import { logger } from './utils/logger';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

const Navigation: React.FC = () => {
  const location = useLocation();

  const handleNavigation = (path: string) => {
    logger.info('Navigation', { from: location.pathname, to: path });
  };

  return (
    <AppBar position="static" elevation={2}>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          URL Shortener
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            color="inherit"
            component={Link}
            to="/"
            onClick={() => handleNavigation('/')}
            startIcon={<LinkIcon />}
            sx={{ 
              backgroundColor: location.pathname === '/' ? 'rgba(255,255,255,0.1)' : 'transparent'
            }}
          >
            Shorten URLs
          </Button>
          <Button
            color="inherit"
            component={Link}
            to="/statistics"
            onClick={() => handleNavigation('/statistics')}
            startIcon={<BarChartIcon />}
            sx={{ 
              backgroundColor: location.pathname === '/statistics' ? 'rgba(255,255,255,0.1)' : 'transparent'
            }}
          >
            Statistics
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

const App: React.FC = () => {
  React.useEffect(() => {
    logger.info('Application started', { 
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    });
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Navigation />
          <Container component="main" sx={{ flexGrow: 1, py: 3 }}>
            <Routes>
              <Route path="/" element={<UrlShortener />} />
              <Route path="/statistics" element={<Statistics />} />
            </Routes>
          </Container>
          <Box 
            component="footer" 
            sx={{ 
              py: 2, 
              px: 2, 
              mt: 'auto', 
              backgroundColor: (theme) => 
                theme.palette.mode === 'light' 
                  ? theme.palette.grey[200] 
                  : theme.palette.grey[800] 
            }}
          >
            <Container maxWidth="sm">
              <Typography variant="body2" color="text.secondary" align="center">
                {'© '}
                {new Date().getFullYear()}{' '}
                Afford Medical Technologies Private Limited. All rights reserved.
              </Typography>
            </Container>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
};

export default App;