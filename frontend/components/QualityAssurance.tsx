import React, { useState } from 'react';
import { Upload, CheckCircle, AlertCircle, Loader2, Sparkles, Image as ImageIcon } from 'lucide-react';
import { analyzeQuality } from '../services/geminiService';

const QualityAssurance: React.FC = () => {
  const [beforeImage, setBeforeImage] = useState<string | null>(null);
  const [afterImage, setAfterImage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'before' | 'after') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Remove data URL prefix for API
        const base64Content = base64String.split(',')[1];
        
        // Store full string for preview, but we'll use base64Content for API if needed, 
        // though the service handles splitting or we can pass just the data. 
        // The service logic expects clean base64 data usually, but let's store the full data URL for preview state
        // and clean it when sending.
        if (type === 'before') setBeforeImage(base64String);
        else setAfterImage(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const runAnalysis = async () => {
    if (!beforeImage || !afterImage) return;

    setIsAnalyzing(true);
    setAnalysisResult(null);

    // Extract base64 data part
    const beforeData = beforeImage.split(',')[1];
    const afterData = afterImage.split(',')[1];

    try {
      const result = await analyzeQuality(beforeData, afterData);
      setAnalysisResult(result);
    } catch (error) {
      setAnalysisResult("Failed to analyze images.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="w-6 h-6 text-indigo-600" />
        <h2 className="text-xl font-bold text-slate-800">AI Quality Assurance</h2>
      </div>
      <p className="text-slate-600 mb-6">
        Upload "Before" and "After" photos of the service. Our AI (Gemini Vision) will objectively score the quality of work.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Before Image */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">Before Service</label>
          <div className="relative border-2 border-dashed border-slate-300 rounded-lg p-4 h-48 flex flex-col items-center justify-center hover:bg-slate-50 transition-colors">
            {beforeImage ? (
              <img src={beforeImage} alt="Before" className="h-full w-full object-cover rounded-md" />
            ) : (
              <div className="text-center">
                <ImageIcon className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <span className="text-sm text-slate-500">Click to upload</span>
              </div>
            )}
            <input 
              type="file" 
              accept="image/*" 
              onChange={(e) => handleImageUpload(e, 'before')} 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
            />
          </div>
        </div>

        {/* After Image */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">After Service</label>
          <div className="relative border-2 border-dashed border-slate-300 rounded-lg p-4 h-48 flex flex-col items-center justify-center hover:bg-slate-50 transition-colors">
            {afterImage ? (
              <img src={afterImage} alt="After" className="h-full w-full object-cover rounded-md" />
            ) : (
              <div className="text-center">
                <ImageIcon className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <span className="text-sm text-slate-500">Click to upload</span>
              </div>
            )}
            <input 
              type="file" 
              accept="image/*" 
              onChange={(e) => handleImageUpload(e, 'after')} 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
            />
          </div>
        </div>
      </div>

      <div className="flex justify-center mb-6">
        <button
          onClick={runAnalysis}
          disabled={!beforeImage || !afterImage || isAnalyzing}
          className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-3 rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Analyzing Quality...
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5" />
              Verify Quality
            </>
          )}
        </button>
      </div>

      {analysisResult && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6 animate-fade-in">
          <h3 className="font-semibold text-emerald-800 mb-2 flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            AI Analysis Report
          </h3>
          <p className="text-emerald-900 whitespace-pre-wrap leading-relaxed">
            {analysisResult}
          </p>
        </div>
      )}
    </div>
  );
};

export default QualityAssurance;
