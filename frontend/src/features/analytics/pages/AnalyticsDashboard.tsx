import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '../../../config/axios';
import { 
  CheckCircle2, 
  AlertTriangle, 
  BarChart2, 
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { Link } from 'react-router-dom';

const AnalyticsDashboard: React.FC = () => {
  // Fetch Dashboard Summary & Trends
  const { data, isLoading } = useQuery({
    queryKey: ['dashboardSummary'],
    queryFn: async () => {
      const { data } = await axiosInstance.get('/analytics/dashboard-summary');
      return data;
    },
    refetchInterval: 10000 // Poll every 10 seconds for real-time evaluations
  });

  // Fetch Recent Predictions
  const { data: recentData, isLoading: recentLoading } = useQuery({
    queryKey: ['recentPredictions'],
    queryFn: async () => {
      const { data } = await axiosInstance.get('/applicants?limit=5'); // Fetch recent applicants directory
      return data.data;
    }
  });

  if (isLoading || recentLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-t-borderActive border-borderColor rounded-full animate-spin"></div>
          <span className="text-textSecondary font-sans text-sm">Syncing risk intelligence dashboard...</span>
        </div>
      </div>
    );
  }

  const summary = data?.summary || {
    total_evaluations: 0,
    approval_rate: 0.0,
    review_rate: 0.0,
    rejection_rate: 0.0,
    average_risk_score: 720,
    active_review_queue: 0
  };

  const trends = data?.monthly_trends || [];

  const cards = [
    {
      title: "Total App Evaluations",
      value: summary.total_evaluations,
      desc: "Processed credit decisions",
      icon: BarChart2,
      color: "text-borderActive"
    },
    {
      title: "Ensemble Approval Rate",
      value: `${(summary.approval_rate * 100).toFixed(1)}%`,
      desc: "Instantly auto-approved",
      icon: CheckCircle2,
      color: "text-success"
    },
    {
      title: "Underwriter Review Queue",
      value: summary.active_review_queue,
      desc: "Pending manual evaluation",
      icon: AlertTriangle,
      color: "text-warning"
    },
    {
      title: "Average Risk Score",
      value: summary.average_risk_score,
      desc: "Normalized Credit score",
      icon: TrendingUp,
      color: "text-indigo-400"
    }
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Header Grid Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="glass-card rounded-xl p-5 flex items-center justify-between transition-all duration-300 hover:translate-y-[-2px] hover:shadow-lg">
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-sans font-bold text-textMuted uppercase tracking-wider">
                  {card.title}
                </span>
                <span className="text-2xl font-display font-bold text-textPrimary">
                  {card.value}
                </span>
                <span className="text-xs font-sans text-textSecondary">
                  {card.desc}
                </span>
              </div>
              <div className={`p-3 rounded-lg bg-bgTertiary ${card.color}`}>
                <Icon size={24} />
              </div>
            </div>
          );
        })}
      </div>

      {/* 2. Charts & Trends Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Default Activity Trends */}
        <div className="lg:col-span-2 glass-card rounded-xl p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <h3 className="font-display font-semibold text-base text-textPrimary">
                Risk Decision Allocation Trends
              </h3>
              <p className="text-xs font-sans text-textMuted">
                Chronological monthly count of underwriting allocations
              </p>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorApprove" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorReject" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#212534" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#12141c', 
                    borderColor: '#212534', 
                    color: '#f8fafc',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '12px',
                    borderRadius: '8px'
                  }} 
                />
                <Area type="monotone" dataKey="approved" stroke="#10b981" fillOpacity={1} fill="url(#colorApprove)" strokeWidth={2} name="Approved" />
                <Area type="monotone" dataKey="rejected" stroke="#ef4444" fillOpacity={1} fill="url(#colorReject)" strokeWidth={2} name="Rejected" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Challenger vs Champion Quick Stats */}
        <div className="glass-card rounded-xl p-6 flex flex-col justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h3 className="font-display font-semibold text-base text-textPrimary">
              Active Credit Predictor Core
            </h3>
            <p className="text-xs font-sans text-textMuted">
              Current production classifier pipeline parameters
            </p>
          </div>

          <div className="flex flex-col gap-4 my-auto">
            <div className="flex items-center justify-between border-b border-borderColor pb-3">
              <span className="text-sm font-sans text-textSecondary">Champion Model</span>
              <span className="text-sm font-sans font-bold text-textPrimary">Ensemble v1.0.0</span>
            </div>
            <div className="flex items-center justify-between border-b border-borderColor pb-3">
              <span className="text-sm font-sans text-textSecondary">Validation AUC-ROC</span>
              <span className="text-sm font-sans font-bold text-success">0.8636</span>
            </div>
            <div className="flex items-center justify-between border-b border-borderColor pb-3">
              <span className="text-sm font-sans text-textSecondary">Optimal Threshold</span>
              <span className="text-sm font-sans font-bold text-textPrimary">Youden Index (0.437)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-sans text-textSecondary">Minority Balancing</span>
              <span className="text-sm font-sans font-bold text-indigo-400">SMOTE Over-sampled</span>
            </div>
          </div>

          <Link
            to="/model-health"
            className="flex items-center justify-center gap-2 w-full py-2 bg-bgTertiary hover:bg-borderActive text-textSecondary hover:text-white rounded-lg text-sm transition-all duration-300 font-sans font-medium"
          >
            <span>Analyze Performance Curves</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      {/* 3. Recents Table */}
      <div className="glass-card rounded-xl p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-semibold text-base text-textPrimary">
            Recent Credit Directory Onboardings
          </h3>
          <Link to="/applicants" className="text-xs font-sans font-semibold text-borderActive hover:text-indigo-400 flex items-center gap-1.5 transition-all">
            <span>View All Applicants</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-sm font-sans border-collapse">
            <thead>
              <tr className="border-b border-borderColor text-textMuted font-bold">
                <th className="py-3 px-4">Applicant ID</th>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Age</th>
                <th className="py-3 px-4">Monthly Income</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {recentData && recentData.length > 0 ? (
                recentData.map((app: any) => (
                  <tr key={app.id} className="border-b border-borderColor/50 hover:bg-bgTertiary/30 text-textSecondary hover:text-textPrimary transition-all">
                    <td className="py-3 px-4 font-mono text-xs">{app.id.substring(0, 8)}...</td>
                    <td className="py-3 px-4 font-medium">{app.first_name} {app.last_name}</td>
                    <td className="py-3 px-4">{app.email}</td>
                    <td className="py-3 px-4">{app.age}</td>
                    <td className="py-3 px-4">${app.monthly_income.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to="/evaluate"
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-borderActive/20 text-borderActive hover:bg-borderActive hover:text-white rounded text-xs font-semibold transition-all"
                      >
                        <span>Evaluate Risk</span>
                        <ArrowRight size={12} />
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-textMuted">
                    No applicants registered yet. Go to Applicants directory to add one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
