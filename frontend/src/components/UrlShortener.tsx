import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  IconButton,
  Tooltip,
  Paper,
} from '@mui/material';
import {
  Add as AddIcon,
  ContentCopy as CopyIcon,
  Delete as DeleteIcon,
  Link as LinkIcon
} from '@mui/icons-material';
import { createShortUrl as apiCreateShortUrl } from '../services/api';
import type { CreateShortUrlRequest, CreateShortUrlResponse } from '../services/api';
import { logger } from '../utils/logger';

interface UrlForm {
  id: string;
  url: string;
  validity: string;
  shortcode: string;
  result?: CreateShortUrlResponse;
  error?: string;
  loading: boolean;
}

const UrlShortener: React.FC = () => {
  const [urlForms, setUrlForms] = useState<UrlForm[]>([
    {
      id: '1',
      url: '',
      validity: '30',
      shortcode: '',
      loading: false
    }
  ]);

  const [globalError, setGlobalError] = useState<string>('');

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const isValidShortcode = (shortcode: string): boolean => {
    if (!shortcode) return true;
    const regex = /^[a-zA-Z0-9]{3,20}$/;
    return regex.test(shortcode);
  };

  const isValidValidity = (validity: string): boolean => {
    const num = parseInt(validity);
    return !isNaN(num) && num > 0;
  };

  const addUrlForm = () => {
    if (urlForms.length >= 5) {
      setGlobalError('Maximum 5 URLs can be shortened at once');
      return;
    }

    const newForm: UrlForm = {
      id: Date.now().toString(),
      url: '',
      validity: '30',
      shortcode: '',
      loading: false
    };

    setUrlForms([...urlForms, newForm]);
    logger.info('Added new URL form', { formId: newForm.id });
  };
  const removeUrlForm = (id: string) => {
    setUrlForms(urlForms.filter(form => form.id !== id));
    logger.info('Removed URL form', { formId: id });
  };

  const updateForm = (id: string, field: keyof UrlForm, value: string | boolean) => {
    setUrlForms(urlForms.map(form => 
      form.id === id ? { ...form, [field]: value, error: undefined } : form
    ));
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      logger.info('Copied to clipboard', { text });
    } catch (error) {
      logger.error('Failed to copy to clipboard', error);
    }
  };

  const createShortUrl = async (form: UrlForm) => {
    if (!form.url.trim()) {
      updateForm(form.id, 'error', 'URL is required');
      return;
    }

    if (!isValidUrl(form.url)) {
      updateForm(form.id, 'error', 'Please enter a valid URL');
      return;
    }

    if (!isValidValidity(form.validity)) {
      updateForm(form.id, 'error', 'Validity must be a positive number');
      return;
    }

    if (form.shortcode && !isValidShortcode(form.shortcode)) {
      updateForm(form.id, 'error', 'Shortcode must be 3-20 alphanumeric characters');
      return;
    }

    updateForm(form.id, 'loading', true);

    try {
      const request: CreateShortUrlRequest = {
        url: form.url.trim(),
        validity: parseInt(form.validity),
        shortcode: form.shortcode.trim() || undefined
      };

      logger.info('Creating short URL', { formId: form.id, request });

      const result = await apiCreateShortUrl(request);
      
      setUrlForms(urlForms.map(f => 
        f.id === form.id 
          ? { ...f, result, error: undefined, loading: false }
          : f
      ));

      logger.info('Short URL created successfully', { 
        formId: form.id, 
        shortLink: result.shortLink 
      });
    } catch (error: unknown) {
      const errorMessage = (error as { response?: { data?: { message?: string } } } | undefined)?.response?.data?.message || 'Failed to create short URL';
      updateForm(form.id, 'error', errorMessage);
      updateForm(form.id, 'loading', false);
      
      logger.error('Failed to create short URL', error, { formId: form.id });
    }
  };

  const createAllShortUrls = async () => {
    setGlobalError('');
    
    const validForms = urlForms.filter(form => 
      form.url.trim() && 
      isValidUrl(form.url) && 
      isValidValidity(form.validity) &&
      (!form.shortcode || isValidShortcode(form.shortcode))
    );

    if (validForms.length === 0) {
      setGlobalError('Please provide at least one valid URL');
      return;
    }

    logger.info('Creating multiple short URLs', { count: validForms.length });

    for (const form of validForms) {
      await createShortUrl(form);
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        URL Shortener
      </Typography>
      
      <Typography variant="subtitle1" color="text.secondary" align="center" sx={{ mb: 4 }}>
        Shorten up to 5 URLs simultaneously with custom validity periods and shortcodes
      </Typography>

      {globalError && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setGlobalError('')}>
          {globalError}
        </Alert>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {urlForms.map((form, index) => (
          <Box key={form.id}>
            <Card elevation={2}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" component="h2">
                    URL #{index + 1}
                  </Typography>
                  {urlForms.length > 1 && (
                    <IconButton 
                      onClick={() => removeUrlForm(form.id)}
                      color="error"
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  )}
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
                  <Box>
                    <TextField
                      fullWidth
                      label="Original URL"
                      placeholder="https://example.com/very-long-url"
                      value={form.url}
                      onChange={(e) => updateForm(form.id, 'url', e.target.value)}
                      error={!!form.error && form.error.includes('URL')}
                      helperText={form.error && form.error.includes('URL') ? form.error : ''}
                      disabled={form.loading}
                    />
                  </Box>

                  <Box>
                    <TextField
                      fullWidth
                      label="Validity (minutes)"
                      type="number"
                      value={form.validity}
                      onChange={(e) => updateForm(form.id, 'validity', e.target.value)}
                      error={!!form.error && form.error.includes('Validity')}
                      helperText={form.error && form.error.includes('Validity') ? form.error : 'Default: 30 minutes'}
                      disabled={form.loading}
                    />
                  </Box>

                  <Box>
                    <TextField
                      fullWidth
                      label="Custom Shortcode (optional)"
                      placeholder="mycode"
                      value={form.shortcode}
                      onChange={(e) => updateForm(form.id, 'shortcode', e.target.value)}
                      error={!!form.error && form.error.includes('Shortcode')}
                      helperText={form.error && form.error.includes('Shortcode') ? form.error : '3-20 alphanumeric chars'}
                      disabled={form.loading}
                    />
                  </Box>
                </Box>

                {form.error && !form.error.includes('URL') && !form.error.includes('Validity') && !form.error.includes('Shortcode') && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    {form.error}
                  </Alert>
                )}

                {form.result && (
                  <Paper elevation={1} sx={{ mt: 2, p: 2, bgcolor: 'success.light', color: 'success.contrastText' }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Short URL Created Successfully!
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <LinkIcon />
                      <Typography variant="body2" sx={{ flexGrow: 1, wordBreak: 'break-all' }}>
                        {form.result.shortLink}
                      </Typography>
                      <Tooltip title="Copy to clipboard">
                        <IconButton 
                          size="small" 
                          onClick={() => copyToClipboard(form.result!.shortLink)}
                        >
                          <CopyIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    <Typography variant="caption" display="block">
                      Expires: {new Date(form.result.expiry).toLocaleString()}
                    </Typography>
                  </Paper>
                )}

                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    onClick={() => createShortUrl(form)}
                    disabled={form.loading || !form.url.trim()}
                    startIcon={<LinkIcon />}
                  >
                    {form.loading ? 'Creating...' : 'Create Short URL'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Box>
        ))}
      </Box>

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 2 }}>
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={addUrlForm}
          disabled={urlForms.length >= 5}
        >
          Add Another URL
        </Button>
        
        <Button
          variant="contained"
          size="large"
          onClick={createAllShortUrls}
          disabled={urlForms.some(form => form.loading)}
        >
          Create All Short URLs
        </Button>
      </Box>
    </Box>
  );
};

export default UrlShortener;
