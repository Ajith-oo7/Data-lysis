/**
 * Custom Dashboard Component
 * 
 * Allows users to create, save, and manage custom dashboards with
 * their favorite visualizations and reports.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Fab,
  Menu,
  MenuList,
  MenuItem as MUIMenuItem,
  Switch,
  FormControlLabel,
  Paper,
  Divider,
  Tooltip,
  LinearProgress,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Share as ShareIcon,
  Download as DownloadIcon,
  MoreVert as MoreIcon,
  Dashboard as DashboardIcon,
  GridView as GridIcon,
  ViewList as ListIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  FullscreenExit as ExitFullscreenIcon,
  Fullscreen as FullscreenIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

export interface DashboardWidget {
  id: string;
  type: 'chart' | 'table' | 'metric' | 'text' | 'image' | 'python_output';
  title: string;
  description?: string;
  config: WidgetConfig;
  data?: any;
  position: WidgetPosition;
  size: WidgetSize;
  isStarred: boolean;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
}

export interface WidgetConfig {
  // Chart config
  chartType?: 'bar' | 'line' | 'scatter' | 'pie' | 'heatmap' | 'box';
  xAxis?: string;
  yAxis?: string;
  colorBy?: string;
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max';
  
  // Table config
  columns?: string[];
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  
  // Metric config
  metric?: string;
  format?: 'number' | 'percentage' | 'currency' | 'time';
  threshold?: { warning: number; critical: number };
  
  // Text config
  content?: string;
  fontSize?: number;
  alignment?: 'left' | 'center' | 'right';
  
  // Python output config
  scriptId?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
  
  // Common config
  dataSource?: string;
  filters?: FilterConfig[];
  theme?: 'light' | 'dark' | 'auto';
  showLegend?: boolean;
  showGrid?: boolean;
  animation?: boolean;
}

export interface FilterConfig {
  field: string;
  operator: 'equals' | 'contains' | 'greater' | 'less' | 'between';
  value: any;
}

export interface WidgetPosition {
  x: number;
  y: number;
}

export interface WidgetSize {
  width: number;
  height: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
}

export interface Dashboard {
  id: string;
  name: string;
  description?: string;
  widgets: DashboardWidget[];
  layout: DashboardLayout;
  theme: DashboardTheme;
  isPublic: boolean;
  isStarred: boolean;
  tags: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  sharedWith: string[];
  autoRefresh: boolean;
  refreshInterval: number;
}

export interface DashboardLayout {
  type: 'grid' | 'freeform' | 'masonry';
  columns: number;
  rowHeight: number;
  gap: number;
  responsive: boolean;
}

export interface DashboardTheme {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    accent: string;
  };
  typography: {
    fontFamily: string;
    titleSize: number;
    bodySize: number;
  };
  spacing: {
    small: number;
    medium: number;
    large: number;
  };
}

const defaultThemes: DashboardTheme[] = [
  {
    name: 'Light',
    colors: {
      primary: '#1976d2',
      secondary: '#dc004e',
      background: '#ffffff',
      surface: '#f5f5f5',
      text: '#000000',
      accent: '#ff9800'
    },
    typography: {
      fontFamily: 'Roboto, Arial, sans-serif',
      titleSize: 24,
      bodySize: 14
    },
    spacing: {
      small: 8,
      medium: 16,
      large: 24
    }
  },
  {
    name: 'Dark',
    colors: {
      primary: '#90caf9',
      secondary: '#f48fb1',
      background: '#121212',
      surface: '#1e1e1e',
      text: '#ffffff',
      accent: '#ffb74d'
    },
    typography: {
      fontFamily: 'Roboto, Arial, sans-serif',
      titleSize: 24,
      bodySize: 14
    },
    spacing: {
      small: 8,
      medium: 16,
      large: 24
    }
  },
  {
    name: 'Professional',
    colors: {
      primary: '#2c3e50',
      secondary: '#e74c3c',
      background: '#ecf0f1',
      surface: '#ffffff',
      text: '#2c3e50',
      accent: '#f39c12'
    },
    typography: {
      fontFamily: 'Helvetica, Arial, sans-serif',
      titleSize: 22,
      bodySize: 13
    },
    spacing: {
      small: 6,
      medium: 12,
      large: 18
    }
  }
];

const CustomDashboard: React.FC = () => {
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [currentDashboard, setCurrentDashboard] = useState<Dashboard | null>(null);
  const [isCreatingDashboard, setIsCreatingDashboard] = useState(false);
  const [isEditingWidget, setIsEditingWidget] = useState(false);
  const [editingWidget, setEditingWidget] = useState<DashboardWidget | null>(null);
  const [viewMode, setViewMode] = useState<'edit' | 'view'>('view');
  const [layoutMode, setLayoutMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{open: boolean; message: string; severity: 'success' | 'error' | 'warning' | 'info'}>({
    open: false,
    message: '',
    severity: 'info'
  });

  // Dialog states
  const [dashboardDialog, setDashboardDialog] = useState(false);
  const [widgetDialog, setWidgetDialog] = useState(false);
  const [shareDialog, setShareDialog] = useState(false);
  const [settingsDialog, setSettingsDialog] = useState(false);

  // Widget menu
  const [widgetMenuAnchor, setWidgetMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedWidget, setSelectedWidget] = useState<DashboardWidget | null>(null);

  // Form states
  const [newDashboard, setNewDashboard] = useState<Partial<Dashboard>>({
    name: '',
    description: '',
    theme: defaultThemes[0],
    layout: {
      type: 'grid',
      columns: 12,
      rowHeight: 100,
      gap: 16,
      responsive: true
    },
    isPublic: false,
    autoRefresh: false,
    refreshInterval: 30000,
    tags: []
  });

  useEffect(() => {
    loadDashboards();
  }, []);

  const loadDashboards = async () => {
    setLoading(true);
    try {
      // Simulate API call
      const response = await fetch('/api/dashboards');
      const data = await response.json();
      setDashboards(data.dashboards || []);
    } catch (error) {
      console.error('Failed to load dashboards:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load dashboards',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const createDashboard = async () => {
    try {
      const dashboard: Dashboard = {
        ...newDashboard,
        id: `dashboard_${Date.now()}`,
        widgets: [],
        isStarred: false,
        createdBy: 'current_user',
        createdAt: new Date(),
        updatedAt: new Date(),
        sharedWith: []
      } as Dashboard;

      // Simulate API call
      const response = await fetch('/api/dashboards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dashboard)
      });

      if (response.ok) {
        setDashboards([...dashboards, dashboard]);
        setCurrentDashboard(dashboard);
        setDashboardDialog(false);
        setViewMode('edit');
        setSnackbar({
          open: true,
          message: 'Dashboard created successfully',
          severity: 'success'
        });
      }
    } catch (error) {
      console.error('Failed to create dashboard:', error);
      setSnackbar({
        open: true,
        message: 'Failed to create dashboard',
        severity: 'error'
      });
    }
  };

  const addWidget = (widget: Partial<DashboardWidget>) => {
    if (!currentDashboard) return;

    const newWidget: DashboardWidget = {
      ...widget,
      id: `widget_${Date.now()}`,
      position: findAvailablePosition(),
      size: getDefaultSize(widget.type!),
      isStarred: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: []
    } as DashboardWidget;

    const updatedDashboard = {
      ...currentDashboard,
      widgets: [...currentDashboard.widgets, newWidget],
      updatedAt: new Date()
    };

    setCurrentDashboard(updatedDashboard);
    updateDashboardOnServer(updatedDashboard);
  };

  const updateWidget = (widgetId: string, updates: Partial<DashboardWidget>) => {
    if (!currentDashboard) return;

    const updatedWidgets = currentDashboard.widgets.map(widget =>
      widget.id === widgetId
        ? { ...widget, ...updates, updatedAt: new Date() }
        : widget
    );

    const updatedDashboard = {
      ...currentDashboard,
      widgets: updatedWidgets,
      updatedAt: new Date()
    };

    setCurrentDashboard(updatedDashboard);
    updateDashboardOnServer(updatedDashboard);
  };

  const deleteWidget = (widgetId: string) => {
    if (!currentDashboard) return;

    const updatedWidgets = currentDashboard.widgets.filter(widget => widget.id !== widgetId);
    const updatedDashboard = {
      ...currentDashboard,
      widgets: updatedWidgets,
      updatedAt: new Date()
    };

    setCurrentDashboard(updatedDashboard);
    updateDashboardOnServer(updatedDashboard);
  };

  const onDragEnd = (result: any) => {
    if (!result.destination || !currentDashboard) return;

    const widgets = Array.from(currentDashboard.widgets);
    const [reorderedWidget] = widgets.splice(result.source.index, 1);
    widgets.splice(result.destination.index, 0, reorderedWidget);

    const updatedDashboard = {
      ...currentDashboard,
      widgets,
      updatedAt: new Date()
    };

    setCurrentDashboard(updatedDashboard);
    updateDashboardOnServer(updatedDashboard);
  };

  const toggleDashboardStar = (dashboardId: string) => {
    const updatedDashboards = dashboards.map(dashboard =>
      dashboard.id === dashboardId
        ? { ...dashboard, isStarred: !dashboard.isStarred }
        : dashboard
    );
    setDashboards(updatedDashboards);
  };

  const toggleWidgetStar = (widgetId: string) => {
    updateWidget(widgetId, { isStarred: !currentDashboard?.widgets.find(w => w.id === widgetId)?.isStarred });
  };

  const exportDashboard = async () => {
    if (!currentDashboard) return;

    try {
      const response = await fetch(`/api/dashboards/${currentDashboard.id}/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${currentDashboard.name}_dashboard.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Failed to export dashboard:', error);
      setSnackbar({
        open: true,
        message: 'Failed to export dashboard',
        severity: 'error'
      });
    }
  };

  const updateDashboardOnServer = async (dashboard: Dashboard) => {
    try {
      await fetch(`/api/dashboards/${dashboard.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dashboard)
      });
    } catch (error) {
      console.error('Failed to update dashboard:', error);
    }
  };

  const findAvailablePosition = (): WidgetPosition => {
    if (!currentDashboard) return { x: 0, y: 0 };

    const columns = currentDashboard.layout.columns;
    let x = 0;
    let y = 0;

    // Simple placement algorithm - find first available spot
    while (true) {
      const isOccupied = currentDashboard.widgets.some(widget =>
        widget.position.x === x && widget.position.y === y
      );
      
      if (!isOccupied) break;
      
      x += 3;
      if (x >= columns) {
        x = 0;
        y += 1;
      }
    }

    return { x, y };
  };

  const getDefaultSize = (type: string): WidgetSize => {
    switch (type) {
      case 'metric':
        return { width: 3, height: 2 };
      case 'chart':
        return { width: 6, height: 4 };
      case 'table':
        return { width: 8, height: 6 };
      case 'text':
        return { width: 4, height: 2 };
      default:
        return { width: 4, height: 3 };
    }
  };

  const filteredDashboards = dashboards.filter(dashboard => {
    const matchesSearch = dashboard.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         dashboard.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTags = selectedTags.length === 0 || selectedTags.every(tag => dashboard.tags.includes(tag));
    return matchesSearch && matchesTags;
  });

  if (!currentDashboard) {
    return (
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">My Dashboards</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setDashboardDialog(true)}
          >
            Create Dashboard
          </Button>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <TextField
            placeholder="Search dashboards..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="small"
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
            }}
            sx={{ flexGrow: 1 }}
          />
          <IconButton onClick={() => setLayoutMode(layoutMode === 'grid' ? 'list' : 'grid')}>
            {layoutMode === 'grid' ? <ListIcon /> : <GridIcon />}
          </IconButton>
          <IconButton onClick={loadDashboards}>
            <RefreshIcon />
          </IconButton>
        </Box>

        {loading && <LinearProgress sx={{ mb: 2 }} />}

        <Grid container spacing={3}>
          {filteredDashboards.map((dashboard) => (
            <Grid item xs={12} sm={6} md={4} key={dashboard.id}>
              <Card
                sx={{
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'translateY(-2px)' }
                }}
                onClick={() => setCurrentDashboard(dashboard)}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h6" component="div">
                      {dashboard.name}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleDashboardStar(dashboard.id);
                      }}
                    >
                      {dashboard.isStarred ? <StarIcon color="primary" /> : <StarBorderIcon />}
                    </IconButton>
                  </Box>
                  
                  {dashboard.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {dashboard.description}
                    </Typography>
                  )}
                  
                  <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                    {dashboard.tags.slice(0, 3).map(tag => (
                      <Chip key={tag} label={tag} size="small" />
                    ))}
                    {dashboard.tags.length > 3 && (
                      <Chip label={`+${dashboard.tags.length - 3}`} size="small" variant="outlined" />
                    )}
                  </Box>
                  
                  <Typography variant="caption" color="text.secondary">
                    {dashboard.widgets.length} widgets • Updated {dashboard.updatedAt.toLocaleDateString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Create Dashboard Dialog */}
        <Dialog open={dashboardDialog} onClose={() => setDashboardDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>Create New Dashboard</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
              <TextField
                label="Dashboard Name"
                fullWidth
                value={newDashboard.name}
                onChange={(e) => setNewDashboard({ ...newDashboard, name: e.target.value })}
              />
              
              <TextField
                label="Description"
                fullWidth
                multiline
                rows={3}
                value={newDashboard.description}
                onChange={(e) => setNewDashboard({ ...newDashboard, description: e.target.value })}
              />
              
              <FormControl fullWidth>
                <InputLabel>Theme</InputLabel>
                <Select
                  value={newDashboard.theme?.name || ''}
                  onChange={(e) => {
                    const theme = defaultThemes.find(t => t.name === e.target.value);
                    setNewDashboard({ ...newDashboard, theme });
                  }}
                >
                  {defaultThemes.map(theme => (
                    <MenuItem key={theme.name} value={theme.name}>
                      {theme.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={newDashboard.isPublic}
                    onChange={(e) => setNewDashboard({ ...newDashboard, isPublic: e.target.checked })}
                  />
                }
                label="Make Public"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDashboardDialog(false)}>Cancel</Button>
            <Button onClick={createDashboard} variant="contained">Create</Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    );
  }

  // Dashboard view when a dashboard is selected
  return (
    <Box sx={{ 
      minHeight: '100vh',
      bgcolor: currentDashboard.theme.colors.background,
      color: currentDashboard.theme.colors.text
    }}>
      {/* Dashboard Header */}
      <Paper sx={{ p: 2, mb: 2, bgcolor: currentDashboard.theme.colors.surface }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={() => setCurrentDashboard(null)}
            >
              ← Back
            </Button>
            <Typography variant="h5">{currentDashboard.name}</Typography>
            <IconButton onClick={() => toggleDashboardStar(currentDashboard.id)}>
              {currentDashboard.isStarred ? <StarIcon color="primary" /> : <StarBorderIcon />}
            </IconButton>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant={viewMode === 'edit' ? 'contained' : 'outlined'}
              onClick={() => setViewMode('edit')}
            >
              Edit
            </Button>
            <Button
              variant={viewMode === 'view' ? 'contained' : 'outlined'}
              onClick={() => setViewMode('view')}
            >
              View
            </Button>
            <IconButton onClick={() => setIsFullscreen(!isFullscreen)}>
              {isFullscreen ? <ExitFullscreenIcon /> : <FullscreenIcon />}
            </IconButton>
            <IconButton onClick={() => setShareDialog(true)}>
              <ShareIcon />
            </IconButton>
            <IconButton onClick={exportDashboard}>
              <DownloadIcon />
            </IconButton>
            <IconButton onClick={() => setSettingsDialog(true)}>
              <SettingsIcon />
            </IconButton>
          </Box>
        </Box>
      </Paper>

      {/* Dashboard Content */}
      <Box sx={{ p: isFullscreen ? 0 : 2 }}>
        {viewMode === 'edit' && (
          <Box sx={{ mb: 2 }}>
            <Fab
              color="primary"
              aria-label="add widget"
              onClick={() => setWidgetDialog(true)}
              sx={{ position: 'fixed', bottom: 16, right: 16, zIndex: 1000 }}
            >
              <AddIcon />
            </Fab>
          </Box>
        )}

        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="dashboard">
            {(provided) => (
              <Grid
                container
                spacing={currentDashboard.layout.gap / 8}
                {...provided.droppableProps}
                ref={provided.innerRef}
              >
                {currentDashboard.widgets.map((widget, index) => (
                  <Draggable
                    key={widget.id}
                    draggableId={widget.id}
                    index={index}
                    isDragDisabled={viewMode === 'view'}
                  >
                    {(provided, snapshot) => (
                      <Grid
                        item
                        xs={12}
                        sm={Math.min(12, widget.size.width)}
                        md={Math.min(12, widget.size.width)}
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        sx={{
                          transform: snapshot.isDragging ? 'rotate(5deg)' : 'none',
                          opacity: snapshot.isDragging ? 0.8 : 1
                        }}
                      >
                        <WidgetComponent
                          widget={widget}
                          isEditing={viewMode === 'edit'}
                          onEdit={() => {
                            setEditingWidget(widget);
                            setIsEditingWidget(true);
                          }}
                          onDelete={() => deleteWidget(widget.id)}
                          onStar={() => toggleWidgetStar(widget.id)}
                          theme={currentDashboard.theme}
                        />
                      </Grid>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </Grid>
            )}
          </Droppable>
        </DragDropContext>
      </Box>

      {/* Widget Dialog */}
      <WidgetCreationDialog
        open={widgetDialog}
        onClose={() => setWidgetDialog(false)}
        onCreateWidget={addWidget}
        theme={currentDashboard.theme}
      />

      {/* Edit Widget Dialog */}
      <WidgetEditDialog
        open={isEditingWidget}
        widget={editingWidget}
        onClose={() => {
          setIsEditingWidget(false);
          setEditingWidget(null);
        }}
        onUpdateWidget={(updates) => {
          if (editingWidget) {
            updateWidget(editingWidget.id, updates);
          }
        }}
        theme={currentDashboard.theme}
      />
    </Box>
  );
};

// Widget Component
interface WidgetComponentProps {
  widget: DashboardWidget;
  isEditing: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onStar: () => void;
  theme: DashboardTheme;
}

const WidgetComponent: React.FC<WidgetComponentProps> = ({
  widget,
  isEditing,
  onEdit,
  onDelete,
  onStar,
  theme
}) => {
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  return (
    <Card
      sx={{
        height: widget.size.height * 100,
        bgcolor: theme.colors.surface,
        border: isEditing ? `2px dashed ${theme.colors.primary}` : 'none',
        position: 'relative'
      }}
    >
      <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6" sx={{ color: theme.colors.text }}>
            {widget.title}
          </Typography>
          
          {isEditing && (
            <Box>
              <IconButton size="small" onClick={onStar}>
                {widget.isStarred ? <StarIcon color="primary" /> : <StarBorderIcon />}
              </IconButton>
              <IconButton
                size="small"
                onClick={(e) => setMenuAnchor(e.currentTarget)}
              >
                <MoreIcon />
              </IconButton>
              
              <Menu
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={() => setMenuAnchor(null)}
              >
                <MUIMenuItem onClick={() => { onEdit(); setMenuAnchor(null); }}>
                  <EditIcon sx={{ mr: 1 }} /> Edit
                </MUIMenuItem>
                <MUIMenuItem onClick={() => { onDelete(); setMenuAnchor(null); }}>
                  <DeleteIcon sx={{ mr: 1 }} /> Delete
                </MUIMenuItem>
              </Menu>
            </Box>
          )}
        </Box>
        
        <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
          <WidgetRenderer widget={widget} theme={theme} />
        </Box>
      </CardContent>
    </Card>
  );
};

// Widget Renderer Component
interface WidgetRendererProps {
  widget: DashboardWidget;
  theme: DashboardTheme;
}

const WidgetRenderer: React.FC<WidgetRendererProps> = ({ widget, theme }) => {
  switch (widget.type) {
    case 'metric':
      return (
        <Box sx={{ textAlign: 'center', py: 2 }}>
          <Typography variant="h3" sx={{ color: theme.colors.primary, fontWeight: 'bold' }}>
            {widget.data?.value || '0'}
          </Typography>
          <Typography variant="body2" sx={{ color: theme.colors.text, opacity: 0.7 }}>
            {widget.config.metric}
          </Typography>
        </Box>
      );
    
    case 'chart':
      return (
        <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography variant="body2" sx={{ color: theme.colors.text, opacity: 0.7 }}>
            Chart: {widget.config.chartType} ({widget.config.xAxis} vs {widget.config.yAxis})
          </Typography>
        </Box>
      );
    
    case 'table':
      return (
        <Box sx={{ height: '100%', overflow: 'auto' }}>
          <Typography variant="body2" sx={{ color: theme.colors.text, opacity: 0.7 }}>
            Table with {widget.config.columns?.length || 0} columns
          </Typography>
        </Box>
      );
    
    case 'text':
      return (
        <Box sx={{ height: '100%', overflow: 'auto' }}>
          <Typography
            variant="body1"
            sx={{
              color: theme.colors.text,
              textAlign: widget.config.alignment || 'left',
              fontSize: widget.config.fontSize || theme.typography.bodySize
            }}
          >
            {widget.config.content || 'Text content'}
          </Typography>
        </Box>
      );
    
    default:
      return (
        <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography variant="body2" sx={{ color: theme.colors.text, opacity: 0.7 }}>
            {widget.type} widget
          </Typography>
        </Box>
      );
  }
};

// Widget Creation Dialog Component
interface WidgetCreationDialogProps {
  open: boolean;
  onClose: () => void;
  onCreateWidget: (widget: Partial<DashboardWidget>) => void;
  theme: DashboardTheme;
}

const WidgetCreationDialog: React.FC<WidgetCreationDialogProps> = ({
  open,
  onClose,
  onCreateWidget,
  theme
}) => {
  const [widgetType, setWidgetType] = useState<DashboardWidget['type']>('chart');
  const [title, setTitle] = useState('');
  const [config, setConfig] = useState<Partial<WidgetConfig>>({});

  const handleCreate = () => {
    onCreateWidget({
      type: widgetType,
      title,
      config: config as WidgetConfig
    });
    onClose();
    setTitle('');
    setConfig({});
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Add New Widget</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
          <FormControl fullWidth>
            <InputLabel>Widget Type</InputLabel>
            <Select
              value={widgetType}
              onChange={(e) => setWidgetType(e.target.value as DashboardWidget['type'])}
            >
              <MenuItem value="chart">Chart</MenuItem>
              <MenuItem value="table">Table</MenuItem>
              <MenuItem value="metric">Metric</MenuItem>
              <MenuItem value="text">Text</MenuItem>
              <MenuItem value="python_output">Python Output</MenuItem>
            </Select>
          </FormControl>
          
          <TextField
            label="Widget Title"
            fullWidth
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          
          {/* Widget-specific configuration forms would go here */}
          <Typography variant="body2" color="text.secondary">
            Additional configuration options will be available based on widget type.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleCreate} variant="contained" disabled={!title}>
          Create Widget
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Widget Edit Dialog Component
interface WidgetEditDialogProps {
  open: boolean;
  widget: DashboardWidget | null;
  onClose: () => void;
  onUpdateWidget: (updates: Partial<DashboardWidget>) => void;
  theme: DashboardTheme;
}

const WidgetEditDialog: React.FC<WidgetEditDialogProps> = ({
  open,
  widget,
  onClose,
  onUpdateWidget,
  theme
}) => {
  const [title, setTitle] = useState('');
  const [config, setConfig] = useState<Partial<WidgetConfig>>({});

  useEffect(() => {
    if (widget) {
      setTitle(widget.title);
      setConfig(widget.config);
    }
  }, [widget]);

  const handleUpdate = () => {
    onUpdateWidget({
      title,
      config: config as WidgetConfig
    });
    onClose();
  };

  if (!widget) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Edit Widget</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
          <TextField
            label="Widget Title"
            fullWidth
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          
          {/* Widget-specific edit forms would go here */}
          <Typography variant="body2" color="text.secondary">
            Widget configuration options for {widget.type} widget.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleUpdate} variant="contained">
          Update Widget
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CustomDashboard; 