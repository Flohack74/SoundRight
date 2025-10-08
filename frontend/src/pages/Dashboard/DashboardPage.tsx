import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
} from '@mui/material';
import {
  Inventory,
  Assignment,
  Receipt,
  LocalShipping,
  Description,
  TrendingUp,
  Warning,
  CheckCircle,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { equipmentService } from '../../services/equipmentService';
import { EquipmentStats } from '../../types/equipment';
import LoadingSpinner from '../../components/Common/LoadingSpinner';

interface DashboardStats {
  equipment: EquipmentStats;
  // Add other stats as needed
}

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const equipmentStats = await equipmentService.getStats();
        setStats({
          equipment: equipmentStats.data,
        });
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  const statCards = [
    {
      title: 'Total Equipment',
      value: stats?.equipment.total || 0,
      icon: <Inventory />,
      color: 'primary.main',
      onClick: () => navigate('/equipment'),
    },
    {
      title: 'Available Equipment',
      value: stats?.equipment.available || 0,
      icon: <CheckCircle />,
      color: 'success.main',
      onClick: () => navigate('/equipment?available=true'),
    },
    {
      title: 'Allocated Equipment',
      value: stats?.equipment.allocated || 0,
      icon: <Assignment />,
      color: 'warning.main',
      onClick: () => navigate('/equipment?available=false'),
    },
    {
      title: 'Equipment in Repair',
      value: stats?.equipment.repair || 0,
      icon: <Warning />,
      color: 'error.main',
      onClick: () => navigate('/equipment?condition=repair'),
    },
  ];

  const quickActions = [
    { text: 'Add New Equipment', icon: <Inventory />, path: '/equipment', color: 'primary' },
    { text: 'Create Project', icon: <Assignment />, path: '/projects', color: 'secondary' },
    { text: 'Generate Quote', icon: <Receipt />, path: '/quotes', color: 'success' },
    { text: 'Create Invoice', icon: <Description />, path: '/invoices', color: 'info' },
  ];

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
        Dashboard
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card
              sx={{
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                },
              }}
              onClick={card.onClick}
            >
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      {card.title}
                    </Typography>
                    <Typography variant="h4" component="div" sx={{ color: card.color }}>
                      {card.value}
                    </Typography>
                  </Box>
                  <Box sx={{ color: card.color, fontSize: 40 }}>
                    {card.icon}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Quick Actions */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              Quick Actions
            </Typography>
            <List>
              {quickActions.map((action, index) => (
                <ListItem
                  key={index}
                  button
                  onClick={() => navigate(action.path)}
                  sx={{
                    borderRadius: 2,
                    mb: 1,
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                  }}
                >
                  <ListItemIcon sx={{ color: `${action.color}.main` }}>
                    {action.icon}
                  </ListItemIcon>
                  <ListItemText primary={action.text} />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Equipment Status */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              Equipment Status
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="body2">Excellent Condition</Typography>
                <Chip
                  label={stats?.equipment.excellent || 0}
                  color="success"
                  size="small"
                />
              </Box>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="body2">Good Condition</Typography>
                <Chip
                  label={stats?.equipment.good || 0}
                  color="primary"
                  size="small"
                />
              </Box>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="body2">Fair Condition</Typography>
                <Chip
                  label={stats?.equipment.fair || 0}
                  color="warning"
                  size="small"
                />
              </Box>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="body2">Poor Condition</Typography>
                <Chip
                  label={stats?.equipment.poor || 0}
                  color="error"
                  size="small"
                />
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardPage;
