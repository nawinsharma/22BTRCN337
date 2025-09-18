import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Link as LinkIcon,
  AccessTime as TimeIcon,
  LocationOn as LocationIcon,
  Computer as ComputerIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { getAllShortUrls as apiGetAllShortUrls, getShortUrlStats as apiGetShortUrlStats } from '../services/api';
import type { ShortUrl, ShortUrlStats } from '../services/api';
import { logger } from '../utils/logger';

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleString();
};

const isExpired = (expiresAt: string): boolean => {
  return new Date() > new Date(expiresAt);
};

const Statistics: React.FC = () => {
  const [shortUrls, setShortUrls] = useState<ShortUrl[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [expandedStats, setExpandedStats] = useState<string | false>(false);

  const loadShortUrls = async () => {
    try {
      setLoading(true);
      setError('');
      
      logger.info('Loading short URLs for statistics');
      const urls = await apiGetAllShortUrls();
      setShortUrls(urls);
      
      logger.info('Short URLs loaded successfully', { count: urls.length });
    } catch (error: unknown) {
      const errorMessage = (error as { response?: { data?: { message?: string } } } | undefined)?.response?.data?.message || 'Failed to load short URLs';
      setError(errorMessage);
      logger.error('Failed to load short URLs', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusChip = (url: ShortUrl) => {
    if (isExpired(url.expiresAt)) {
      return <Chip label="Expired" color="error" size="small" />;
    }
    return <Chip label="Active" color="success" size="small" />;
  };

  const handleAccordionChange = (shortcode: string) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedStats(isExpanded ? shortcode : false);
  };

  useEffect(() => {
    loadShortUrls();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading statistics...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
        <Alert 
          severity="error" 
          action={
            <IconButton color="inherit" size="small" onClick={loadShortUrls}>
              <RefreshIcon />
            </IconButton>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          URL Statistics
        </Typography>
        <IconButton onClick={loadShortUrls} color="primary">
          <RefreshIcon />
        </IconButton>
      </Box>

      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 4 }}>
        View detailed analytics for all your shortened URLs
      </Typography>

      {shortUrls.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <LinkIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No shortened URLs found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Create some short URLs to see their statistics here
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {shortUrls.map((url) => (
            <Box key={url.id}>
              <Accordion 
                expanded={expandedStats === url.shortcode}
                onChange={handleAccordionChange(url.shortcode)}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" component="div">
                        {url.shortLink}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-all' }}>
                        {url.originalUrl}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getStatusChip(url)}
                      <Chip 
                        icon={<TrendingUpIcon />}
                        label={`${url.clicks.length} clicks`}
                        color="primary"
                        size="small"
                      />
                    </Box>
                  </Box>
                </AccordionSummary>
                
                <AccordionDetails>
                  <DetailedStats shortcode={url.shortcode} />
                </AccordionDetails>
              </Accordion>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

const DetailedStats: React.FC<{ shortcode: string }> = ({ shortcode }) => {
  const [stats, setStats] = useState<ShortUrlStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        setError('');
        const detailedStats = await apiGetShortUrlStats(shortcode);
        setStats(detailedStats);
      } catch (error: unknown) {
        const message = (error as { response?: { data?: { message?: string } } } | undefined)?.response?.data?.message || 'Failed to load detailed statistics';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [shortcode]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!stats) {
    return <Alert severity="warning">No statistics available</Alert>;
  }

  return (
    <Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mb: 3 }}>
        <Box>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                URL Information
              </Typography>
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Original URL:
                </Typography>
                <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                  {stats.originalUrl}
                </Typography>
              </Box>
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Short Link:
                </Typography>
                <Typography variant="body2">
                  {stats.shortLink}
                </Typography>
              </Box>
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Created:
                </Typography>
                <Typography variant="body2">
                  {formatDate(stats.createdAt)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Expires:
                </Typography>
                <Typography variant="body2">
                  {formatDate(stats.expiresAt)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Box>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Click Statistics
              </Typography>
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h3" color="primary">
                  {stats.totalClicks}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Clicks
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {stats.clicks.length > 0 ? (
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Click Details
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Timestamp</TableCell>
                    <TableCell>Referrer</TableCell>
                    <TableCell>User Agent</TableCell>
                    <TableCell>IP Address</TableCell>
                    <TableCell>Location</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stats.clicks.map((click, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <TimeIcon fontSize="small" color="action" />
                          {formatDate(click.timestamp)}
                        </Box>
                      </TableCell>
                      <TableCell>
                        {click.referrer ? (
                          <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                            {click.referrer}
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            Direct
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Tooltip title={click.userAgent || 'Unknown'}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <ComputerIcon fontSize="small" color="action" />
                            <Typography variant="body2" sx={{ 
                              maxWidth: 200, 
                              overflow: 'hidden', 
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {click.userAgent || 'Unknown'}
                            </Typography>
                          </Box>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {click.ip || 'Unknown'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LocationIcon fontSize="small" color="action" />
                          <Typography variant="body2">
                            {click.location || 'Unknown'}
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      ) : (
        <Card variant="outlined">
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <TrendingUpIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No clicks yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This short URL hasn't been clicked yet
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default Statistics;
