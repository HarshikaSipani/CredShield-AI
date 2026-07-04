import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '../../../config/axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ShieldCheck, Cpu, Activity, Award } from 'lucide-react';

const ModelPerformancePage: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['modelMetrics'],
    queryFn: async () => {
      const { data } = await axiosInstance.get('/analytics/model-metrics');
      return data;
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-t-borderActive border-borderColor rounded-full animate-spin"></div>
          <span className="text-textSecondary font-sans text-sm">Loading validation metrics...</span>
        </div>
      </div>
    );
  }

  const metadata = data?.model_metadata || {};
  const metrics = data?.overall_performance || {};
  const roc = data?.roc_curve || [];
  const matrix = data?.confusion_matrix || { true_negative: 0, false_positive: 0, false_negative: 0, true_positive: 0 };

  const metricCards = [
    { title: "Classification Accuracy", value: `${(metrics.accuracy * 100).toFixed(2)}%`, icon: ShieldCheck, color: "text-success", desc: "Overall correct outcomes ratio" },
    { title: "Precision Score", value: `${(metrics.precision * 100).toFixed(2)}%`, icon: Cpu, color: "text-borderActive", desc: "True default prediction ratio" },
    { title: "Recall / Sensitivity", value: `${(metrics.recall * 100).toFixed(2)}%`, icon: Activity, color: "text-warning", desc: "Capture of actual defaults ratio" },
    { title: "ROC-AUC Area Score", value: `${(metrics.auc_roc * 100).toFixed(2)}%`, icon: Award, color: "text-indigo-400", desc: "Overall model diagnostic ability" }
  ];

  return (
    <div className="flex flex-col gap-6">
      
      {/* 1. Header Information Panel */}
      <div className="glass-card rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h3 className="font-display font-bold text-lg text-textPrimary">
            {metadata.name}
          </h3>
          <p className="text-sm font-sans text-textSecondary">
            Active version: <span className="text-borderActive font-semibold">{metadata.version}</span> | Combines: {metadata.algorithms?.join(", ")}
          </p>
        </div>
        <div className="text-xs bg-bgTertiary border border-borderColor px-4 py-2 rounded-lg text-textSecondary font-mono">
          Weighted: LR (33%) + RF (34%) + XGB (33%)
        </div>
      </div>

      {/* 2. Core Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metricCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="glass-card rounded-xl p-5 flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-sans font-bold text-textMuted uppercase tracking-wider">
                  {card.title}
                </span>
                <span className="text-2xl font-display font-bold text-textPrimary">
                  {card.value}
                </span>
                <span className="text-[10px] font-sans text-textSecondary">
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

      {/* 3. ROC Curve & Confusion Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ROC Graph (7 Cols) */}
        <div className="lg:col-span-7 glass-card rounded-xl p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h3 className="font-display font-semibold text-base text-textPrimary">
              Receiver Operating Characteristic (ROC) Curve
            </h3>
            <p className="text-xs font-sans text-textMuted">
              True Positive Rate vs. False Positive Rate across model cutoff thresholds
            </p>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={roc} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#212534" />
                <XAxis dataKey="fpr" stroke="#64748b" fontSize={11} name="False Positive Rate" />
                <YAxis stroke="#64748b" fontSize={11} name="True Positive Rate" />
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
                <Line 
                  type="monotone" 
                  dataKey="tpr" 
                  stroke="#4a54ff" 
                  strokeWidth={2.5} 
                  dot={{ r: 3, fill: '#4a54ff' }} 
                  name="Ensemble AUC" 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Confusion Matrix (5 Cols) */}
        <div className="lg:col-span-5 glass-card rounded-xl p-6 flex flex-col justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h3 className="font-display font-semibold text-base text-textPrimary">
              Confusion Matrix
            </h3>
            <p className="text-xs font-sans text-textMuted">
              Ensemble classifier actual vs. predicted evaluation counts
            </p>
          </div>

          {/* 2x2 Grid Representation */}
          <div className="grid grid-cols-2 gap-4 my-auto p-4 bg-bgPrimary/40 rounded-xl border border-borderColor/30">
            {/* True Negative */}
            <div className="flex flex-col items-center justify-center p-4 bg-bgSecondary border border-borderColor rounded-lg text-center">
              <span className="text-[10px] font-sans font-bold text-success uppercase tracking-wider">True Negative</span>
              <span className="text-xl font-display font-bold text-textPrimary mt-1">
                {matrix.true_negative.toLocaleString()}
              </span>
              <span className="text-[9px] text-textMuted mt-1">Predicted Non-Default</span>
            </div>

            {/* False Positive */}
            <div className="flex flex-col items-center justify-center p-4 bg-bgSecondary border border-borderColor rounded-lg text-center">
              <span className="text-[10px] font-sans font-bold text-danger uppercase tracking-wider">False Positive</span>
              <span className="text-xl font-display font-bold text-textPrimary mt-1">
                {matrix.false_positive.toLocaleString()}
              </span>
              <span className="text-[9px] text-textMuted mt-1">Predicted Default</span>
            </div>

            {/* False Negative */}
            <div className="flex flex-col items-center justify-center p-4 bg-bgSecondary border border-borderColor rounded-lg text-center">
              <span className="text-[10px] font-sans font-bold text-danger uppercase tracking-wider">False Negative</span>
              <span className="text-xl font-display font-bold text-textPrimary mt-1">
                {matrix.false_negative.toLocaleString()}
              </span>
              <span className="text-[9px] text-textMuted mt-1">Predicted Non-Default</span>
            </div>

            {/* True Positive */}
            <div className="flex flex-col items-center justify-center p-4 bg-bgSecondary border border-borderColor rounded-lg text-center">
              <span className="text-[10px] font-sans font-bold text-success uppercase tracking-wider">True Positive</span>
              <span className="text-xl font-display font-bold text-textPrimary mt-1">
                {matrix.true_positive.toLocaleString()}
              </span>
              <span className="text-[9px] text-textMuted mt-1">Predicted Default</span>
            </div>
          </div>

          <div className="text-xs font-sans text-textMuted text-center">
            Total Validation Samples Evaluated: <span className="text-textSecondary font-semibold">28,750</span>
          </div>

        </div>

      </div>

    </div>
  );
};

export default ModelPerformancePage;
