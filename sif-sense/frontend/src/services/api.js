import axios from 'axios';

const BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

export const analyzeReport = (report) => api.post('/analyze', { report });
export const getReports = (sifOnly = false) => api.get(`/reports?sif_only=${sifOnly}`);
export const getReportGraph = (reportId) => api.get(`/graph/${reportId}`);
export const getPatternGraph = () => api.get('/graph/pattern/all');
export const getDashboardStats = () => api.get('/dashboard/stats');
export const getHotspots = () => api.get('/dashboard/hotspots');
export const getHazards = () => api.get('/dashboard/hazards');
export const getBarriers = () => api.get('/dashboard/barriers');
export const getPatterns = () => api.get('/dashboard/patterns');
export const getRiskTrend = () => api.get('/dashboard/trend');
export const getAlerts = (status) => api.get(`/alerts${status ? `?status=${status}` : ''}`);
export const reviewAlert = (alertId, action, notes) =>
  api.patch(`/alerts/${alertId}/review`, { action, notes });

export const getModelMetrics = () => api.get('/model/metrics');
export const getOshaSamples = () => api.get('/osha/samples');
export const quickPredict = (text) => api.post('/model/predict', { text });

export const getDatabaseStatus = () => api.get('/database/status');
export const updateDatabaseConnection = (data) => api.post('/database/connect', data);

export default api;

