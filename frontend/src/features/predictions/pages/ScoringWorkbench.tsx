import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import axiosInstance from '../../../config/axios';
import { 
  ShieldCheck, 
  Search, 
  FileDown, 
  AlertCircle, 
  Play
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ReferenceLine, 
  Cell, 
  ResponsiveContainer 
} from 'recharts';

const ScoringWorkbench: React.FC = () => {
  const location = useLocation();
  const stateApplicantId = location.state?.applicant_id || '';
  
  const [selectedId, setSelectedId] = useState(stateApplicantId);
  const [prediction, setPrediction] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  // Sync state if coming from applicant details evaluate button
  useEffect(() => {
    if (stateApplicantId) {
      setSelectedId(stateApplicantId);
    }
  }, [stateApplicantId]);

  // Fetch list of applicants for the search dropdown
  const { data: applicantList } = useQuery({
    queryKey: ['applicantsDropdown'],
    queryFn: async () => {
      const { data } = await axiosInstance.get('/applicants?limit=100');
      return data.data;
    }
  });

  // Fetch active selected applicant details
  const { data: activeApplicant } = useQuery({
    queryKey: ['applicantDetail', selectedId],
    queryFn: async () => {
      if (!selectedId) return null;
      const { data } = await axiosInstance.get(`/applicants/${selectedId}`);
      return data;
    },
    enabled: !!selectedId
  });

  // Mutator: Execute Risk Prediction
  const evaluateMutation = useMutation({
    mutationFn: async (applicantId: string) => {
      setError(null);
      const { data } = await axiosInstance.post('/predictions/evaluate', {
        applicant_id: applicantId
      });
      return data;
    },
    onSuccess: (data) => {
      setPrediction(data);
    },
    onError: (err: any) => {
      setError(err.response?.data?.detail || "Prediction request failed.");
    }
  });

  const handleEvaluate = () => {
    if (!selectedId) return;
    evaluateMutation.mutate(selectedId);
  };

  const handleExportPdf = async () => {
    if (!prediction) return;
    setGeneratingPdf(true);
    try {
      // Trigger PDF compile and download directly
      const response = await axiosInstance.get(`/reports/download/${prediction.id}`, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `credit_decision_report_${prediction.id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (err) {
      console.error("PDF generation failed:", err);
      setError("Failed to download PDF report.");
    } finally {
      setGeneratingPdf(false);
    }
  };

  // Helper utility to capitalize word first letters (mimicking title case)
  const toTitleCase = (str: string): string => {
    return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());
  };

  // Convert raw SHAP values object to Array suitable for Recharts horizontal bar chart
  const formatShapData = () => {
    if (!prediction || !prediction.shap_values) return [];
    
    return Object.entries(prediction.shap_values).map(([key, val]: [string, any]) => {
      const friendlyName = key
        .replace("NumberOf", "Number of ")
        .replace("Of", " of ")
        .replace("Days", " Days")
        .replace("RealEstate", " Real Estate")
        .replace("revolving_", "Revolving ")
        .replace("debt_", "Debt ")
        .replace("monthly_", "Monthly ")
        .replace("number_", "Number ")
        .replace("_", " ")
        .replace("past_due", "Past Due");
        
      return {
        name: toTitleCase(friendlyName),
        shap: val
      };
    });
  };

  const shapData = formatShapData();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* Left Input Details Panel (4 Cols) */}
      <div className="lg:col-span-4 flex flex-col gap-6">
        
        {/* Applicant Selection Search */}
        <div className="glass-card rounded-2xl p-7 flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <h3 className="font-display font-bold text-lg text-textPrimary">
              Active Selection Directory
            </h3>
            <p className="text-sm font-sans text-textSecondary">
              Select an applicant profile below to pull parameters.
            </p>
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-textMuted pointer-events-none">
              <Search size={20} />
            </div>
            <select
              value={selectedId}
              onChange={(e) => { setSelectedId(e.target.value); setPrediction(null); }}
              className="w-full bg-bgTertiary border-2 border-borderColor rounded-xl pl-12 pr-6 py-3.5 text-base font-semibold text-textPrimary focus:outline-none focus:border-borderActive appearance-none cursor-pointer transition-all duration-300 shadow-lg shadow-black/10"
            >
              <option value="">-- Choose Applicant --</option>
              {applicantList && applicantList.map((app: any) => (
                <option key={app.id} value={app.id}>
                  {app.first_name} {app.last_name} ({app.email})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Selected Applicant Profile Parameter Summary */}
        {activeApplicant && (
          <div className="glass-card rounded-2xl p-7 flex flex-col gap-5 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-borderColor pb-4">
              <h4 className="font-display font-bold text-base text-textPrimary">
                Financial Parameters
              </h4>
              <span className="text-xs bg-indigo-500/20 text-indigo-400 px-3 py-1 rounded font-bold uppercase tracking-wider">
                Selected
              </span>
            </div>

            <div className="flex flex-col gap-4 text-base font-sans text-textSecondary">
              <div className="flex justify-between">
                <span>Monthly Gross Income</span>
                <span className="text-textPrimary font-bold">${activeApplicant.monthly_income.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Debt-to-Income Ratio</span>
                <span className="text-textPrimary font-bold">{(activeApplicant.debt_ratio * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span>Revolving Line Utilization</span>
                <span className="text-textPrimary font-bold">{(activeApplicant.revolving_utilization * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span>Open Credit & Loan Lines</span>
                <span className="text-textPrimary font-bold">{activeApplicant.number_open_credit_lines} Lines</span>
              </div>
              <div className="flex justify-between">
                <span>Debtor Age</span>
                <span className="text-textPrimary font-bold">{activeApplicant.age} Years</span>
              </div>
              <div className="flex justify-between border-t border-borderColor pt-4 mt-2">
                <span className="text-sm text-textSecondary font-bold">Total Delinquencies</span>
                <span className="text-sm text-danger font-bold">
                  {activeApplicant.number_90_days_late + activeApplicant.number_30_59_days_past_due + activeApplicant.number_60_89_days_past_due} incidents
                </span>
              </div>
            </div>

            <button
              onClick={handleEvaluate}
              disabled={evaluateMutation.isPending}
              className="flex items-center justify-center gap-2 w-full py-3.5 bg-gradient-to-br from-[#6366f1] to-[#4f46e5] hover:opacity-95 text-white rounded-xl text-base font-semibold transition-all duration-300 disabled:opacity-50 mt-2 shadow-lg shadow-indigo-500/20"
            >
              {evaluateMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-t-white border-white/20 rounded-full animate-spin"></div>
                  <span>Running Inference...</span>
                </>
              ) : (
                <>
                  <Play size={16} />
                  <span>Execute Risk Assessment</span>
                </>
              )}
            </button>
          </div>
        )}

      </div>

      {/* Right Prediction Outcomes Panel (8 Cols) */}
      <div className="lg:col-span-8 flex flex-col gap-6">
        
        {error && (
          <div className="flex items-start gap-3 rounded-lg border border-danger/20 bg-danger/10 p-3.5 text-sm text-danger animate-shake">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {prediction ? (
          <div className="flex flex-col gap-6 animate-fadeIn">
            
            {/* Top Outcomes Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Score Meter - Animated Circular Ring */}
              <div className="glass-card rounded-2xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
                <span className="text-xs font-sans font-bold text-textSecondary uppercase tracking-wider mb-4">
                  Ensemble Credit Score
                </span>
                
                <div className="relative flex items-center justify-center w-36 h-36">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="72"
                      cy="72"
                      r="54"
                      stroke="var(--bg-tertiary)"
                      strokeWidth="10"
                      fill="transparent"
                    />
                    <circle
                      cx="72"
                      cy="72"
                      r="54"
                      stroke={
                        prediction.risk_category === 'low_risk' ? '#10b981' :
                        prediction.risk_category === 'medium_risk' ? '#f59e0b' :
                        '#ef4444'
                      }
                      strokeWidth="10"
                      fill="transparent"
                      strokeDasharray={2 * Math.PI * 54}
                      strokeDashoffset={
                        2 * Math.PI * 54 - (Math.min(100, Math.max(0, ((prediction.risk_score - 300) / 550) * 100)) / 100) * (2 * Math.PI * 54)
                      }
                      strokeLinecap="round"
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-3xl font-display font-extrabold text-textPrimary leading-none">
                      {prediction.risk_score}
                    </span>
                    <span className="text-[10px] text-textMuted uppercase font-bold tracking-widest mt-1">
                      Score
                    </span>
                  </div>
                </div>

                <span className="text-[10px] text-textSecondary bg-bgTertiary px-3 py-1 rounded-full font-mono mt-4">
                  Range: 300 - 850
                </span>
              </div>

              {/* Default Probability */}
              <div className="glass-card rounded-2xl p-6 flex flex-col gap-2 items-center justify-center text-center">
                <span className="text-xs font-sans font-bold text-textSecondary uppercase tracking-wider mb-2">
                  Probability of Default
                </span>
                <span className="text-4xl font-display font-black text-textPrimary tracking-tight">
                  {(prediction.default_probability * 100).toFixed(2)}%
                </span>
                <span className={`text-xs px-3 py-1 rounded-full font-bold uppercase mt-4 ${
                  prediction.risk_category === 'low_risk' ? 'bg-success/20 text-success' :
                  prediction.risk_category === 'medium_risk' ? 'bg-warning/20 text-warning' :
                  'bg-danger/20 text-danger'
                }`}>
                  {prediction.risk_category.replace("_", " ")}
                </span>
              </div>

              {/* Action Recommendation */}
              <div className="glass-card rounded-2xl p-6 flex flex-col gap-3 items-center justify-center text-center relative overflow-hidden">
                <span className="text-xs font-sans font-bold text-textSecondary uppercase tracking-wider z-10 mb-2">
                  System Recommendation
                </span>
                <span className={`text-2xl font-display font-extrabold uppercase z-10 ${
                  prediction.decision_recommendation === 'approve' ? 'text-success' :
                  prediction.decision_recommendation === 'manual_review' ? 'text-warning' :
                  'text-danger'
                }`}>
                  {prediction.decision_recommendation.replace("_", " ")}
                </span>
                
                <button
                  onClick={handleExportPdf}
                  disabled={generatingPdf}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-bgTertiary hover:bg-borderActive text-sm text-textSecondary hover:text-white rounded-xl transition-all duration-300 font-bold z-10 mt-4 border border-borderColor"
                >
                  <FileDown size={16} />
                  <span>{generatingPdf ? 'Building PDF...' : 'Download PDF Audit'}</span>
                </button>
              </div>

            </div>

            {/* AI-Generated Explanation Summarization */}
            <div className="glass-card rounded-2xl p-7 flex flex-col gap-3">
              <h3 className="font-display font-bold text-base text-textPrimary flex items-center gap-2 border-b border-borderColor pb-3">
                <span>AI Underwriting Narration</span>
              </h3>
              <p className="text-base font-sans text-textSecondary leading-relaxed tracking-wide">
                {prediction.ai_explanation}
              </p>
            </div>

            {/* SHAP Waterfall Attribution Visualization */}
            <div className="glass-card rounded-2xl p-7 flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <h3 className="font-display font-bold text-lg text-textPrimary">
                  Explainable AI Attributions (SHAP Waterfall)
                </h3>
                <p className="text-sm font-sans text-textSecondary">
                  Feature contributions impacting default probability. Red signals increased default risk; green denotes mitigating factors.
                </p>
              </div>

              <div className="h-[420px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={shapData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#24293f" />
                    <XAxis type="number" stroke="#64748b" fontSize={13} />
                    <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={12} width={150} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#131622',
                        borderColor: '#24293f',
                        color: '#f8fafc',
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '13px',
                        borderRadius: '12px'
                      }}
                    />
                    <ReferenceLine x={0} stroke="#475569" strokeWidth={1.5} />
                    <Bar dataKey="shap" name="Impact attribution">
                      {shapData.map((entry: any, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.shap > 0 ? '#ef4444' : '#10b981'} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        ) : (
          <div className="glass-card rounded-xl p-12 flex flex-col items-center justify-center text-center min-h-[50vh]">
            <ShieldCheck size={48} className="text-textMuted mb-4 animate-pulse" />
            <h3 className="font-display font-semibold text-lg text-textPrimary mb-2">
              Workbench Idle
            </h3>
            <p className="text-sm font-sans text-textSecondary max-w-sm">
              Please search and select an applicant in the left sidebar directory panel to run risk models and fetch attributions.
            </p>
          </div>
        )}

      </div>

    </div>
  );
};

export default ScoringWorkbench;
