import React, { useEffect, useState } from 'react';
import {
  Button,
  Card,
  CardContent,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import API from '../../../api/api';

const DOCUMENT_OPTIONS = [
  'Resume',
  'Offer Letter',
  'Education Certificate',
  'Identity Proof',
  'Address Proof',
  'Experience Letter',
  'Other'
];

function EmployeeDocumentsSection({ employeeId, documents, onDocumentsUpdated, showToast }) {
  const [documentList, setDocumentList] = useState(documents || []);
  const [formData, setFormData] = useState({
    label: 'Resume',
    customLabel: '',
    fileName: '',
    fileData: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setDocumentList(documents || []);
  }, [documents]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast('Document must be 2MB or smaller.', 'warning');
      return;
    }

    try {
      const fileData = await fileToBase64(file);
      setFormData((prev) => ({
        ...prev,
        fileName: file.name,
        fileData
      }));
    } catch (error) {
      showToast('Failed to read document.', 'error');
    } finally {
      event.target.value = '';
    }
  };

  const persistDocuments = async (nextDocuments, successMessage) => {
    try {
      setIsSaving(true);
      const res = await API.put(`/employee-portal/${employeeId}/documents`, { documents: nextDocuments });
      const updatedDocuments = res.data?.documents || nextDocuments;
      setDocumentList(updatedDocuments);
      onDocumentsUpdated(updatedDocuments);
      showToast(successMessage, 'success');
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to update documents.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpload = async (event) => {
    event.preventDefault();
    const label = formData.label === 'Other' ? formData.customLabel.trim() : formData.label;

    if (!label || !formData.fileName || !formData.fileData) {
      showToast('Please select a document type and file.', 'warning');
      return;
    }

    const nextDocuments = [
      {
        id: `doc-${Date.now()}`,
        label,
        fileName: formData.fileName,
        fileData: formData.fileData,
        uploadedAt: new Date().toISOString()
      },
      ...documentList
    ];

    await persistDocuments(nextDocuments, 'Document uploaded successfully.');
    setFormData({ label: 'Resume', customLabel: '', fileName: '', fileData: '' });
  };

  const handleRemove = async (documentId) => {
    const nextDocuments = documentList.filter((document) => document.id !== documentId);
    await persistDocuments(nextDocuments, 'Document removed successfully.');
  };

  return (
    <Grid container spacing={2.5}>
      <Grid size={{ xs: 12, lg: 4 }}>
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={700} gutterBottom>Upload Document</Typography>
            <Stack component="form" spacing={2} onSubmit={handleUpload}>
              <TextField
                select
                label="Document Type"
                name="label"
                value={formData.label}
                onChange={handleChange}
                fullWidth
              >
                {DOCUMENT_OPTIONS.map((option) => (
                  <MenuItem key={option} value={option}>{option}</MenuItem>
                ))}
              </TextField>
              {formData.label === 'Other' ? (
                <TextField
                  label="Custom Label"
                  name="customLabel"
                  value={formData.customLabel}
                  onChange={handleChange}
                  fullWidth
                />
              ) : null}
              <Button variant="outlined" component="label">
                {formData.fileName || 'Choose File'}
                <input type="file" hidden accept=".pdf,image/*" onChange={handleFileSelect} />
              </Button>
              <Button type="submit" variant="contained" disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Upload'}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, lg: 8 }}>
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={700} gutterBottom>My Documents</Typography>
            <Stack spacing={1.25}>
              {documentList.length === 0 ? (
                <Typography color="text.secondary">No documents uploaded yet.</Typography>
              ) : (
                documentList.map((document) => (
                  <Card key={document.id} variant="outlined" sx={{ borderRadius: 2 }}>
                    <CardContent sx={{ py: '12px !important' }}>
                      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={1}>
                        <Stack spacing={0.25}>
                          <Typography fontWeight={700}>{document.label || 'Document'}</Typography>
                          <Typography variant="body2" color="text.secondary">{document.fileName}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            Uploaded on {document.uploadedAt ? new Date(document.uploadedAt).toLocaleDateString() : 'N/A'}
                          </Typography>
                        </Stack>
                        <Stack direction="row" spacing={1}>
                          <Button
                            size="small"
                            variant="outlined"
                            component="a"
                            href={document.fileData}
                            target="_blank"
                            rel="noreferrer"
                          >
                            View
                          </Button>
                          <Button size="small" color="error" variant="outlined" onClick={() => handleRemove(document.id)}>
                            Remove
                          </Button>
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

export default EmployeeDocumentsSection;
