'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ScanLine, Loader2, AlertCircle, RefreshCw, Info,
  Shield, CheckCircle, Cpu, Brain, GitBranch, Lock,
} from 'lucide-react';
import UploadZone from '@/components/UploadZone';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { verifyImage } from '@/lib/api';

type Stage = 'idle' | 'uploading' | 'analyzing' | 'done' | 'error';

const stageMsg: Record<Stage, string> = {
  idle:      '',
  uploading: 'Uploading image…',
  analyzing: 'Running OCR + LLM analysis…',
  done:      'Verification complete!',
  error:     '',
};

const pipelineSteps = [
  { icon: Cpu,       label: 'OCR Extraction',   sub: 'Tesseract reads the label'       },
  { icon: Brain,     label: 'AI Analysis',       sub: 'LLaMA 3 checks 10 auth fields'  },
  { icon: GitBranch, label: 'Blockchain Lookup', sub: 'Batch history checked on-chain' },
  { icon: Shield,    label: 'Verdict Fusion',    sub: 'Confidence score calculated'    },
];

const photoTips = [
  'Ensure the full label is inside the frame',
  'Use good lighting — avoid shadows and glare',
  'Hold the camera steady for a sharp image',
  'Crop closely to the label text area for best OCR',
];

export default function VerifyPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [medicineName, setMedicineName] = useState('');
  const [stage, setStage] = useState<Stage>('idle');
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const handleFileSelect = (f: File) => { setFile(f); setError(null); setStage('idle'); };

  const handleVerify = async () => {
    if (!file) return;
    setError(null);
    setStage('uploading');
    setProgress(20);
    try {
      const fd = new FormData();
      fd.append('file', file);
      if (medicineName.trim()) fd.append('medicine_name', medicineName.trim());

      setStage('analyzing');
      setProgress(60);

      const data = await verifyImage(fd);
      setProgress(100);
      setStage('done');
      setTimeout(() => router.push(`/result/${data.verification_id}`), 500);
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please try again.');
      setStage('error');
      setProgress(0);
    }
  };

  const isLoading = stage === 'uploading' || stage === 'analyzing';

  return (
    <div className="bg-slate-50 min-h-[calc(100vh-64px)]">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Header */}
          <div className="text-center space-y-3 max-w-lg mx-auto">
            <div className="inline-flex items-center justify-center rounded-2xl border border-blue-200 bg-blue-50 p-3.5">
              <ScanLine className="h-7 w-7 text-blue-600" />
            </div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight">Medicine Verification</h1>
            <p className="text-gray-500 text-lg">
              Upload a clear photo of the medicine package to begin the AI-powered verification process.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Upload card */}
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Upload Medicine Image</CardTitle>
                  <CardDescription>JPEG, PNG, WebP or BMP · Max 10 MB · Clear label text required</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <UploadZone onFileSelect={handleFileSelect} disabled={isLoading} />

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Medicine Name
                      <span className="ml-1.5 text-xs font-normal text-gray-400">(optional — improves accuracy)</span>
                    </label>
                    <input
                      type="text"
                      value={medicineName}
                      onChange={e => setMedicineName(e.target.value)}
                      placeholder="e.g. Paracetamol 500mg Tablets"
                      disabled={isLoading}
                      className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:opacity-60 transition-colors"
                    />
                  </div>

                  {/* Progress */}
                  <AnimatePresence>
                    {isLoading && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-3 overflow-hidden"
                      >
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500 flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                            {stageMsg[stage]}
                          </span>
                          <span className="text-blue-700 font-semibold tabular-nums">{progress}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                          <motion.div
                            className="h-full rounded-full bg-blue-600"
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.4, ease: 'easeOut' }}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Error */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm"
                      >
                        <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                        <div className="flex-1">
                          <p className="font-semibold text-red-800">Verification failed</p>
                          <p className="text-red-600 text-xs mt-0.5 leading-relaxed">{error}</p>
                        </div>
                        <button onClick={() => { setStage('idle'); setError(null); setProgress(0); }} className="text-red-400 hover:text-red-600 transition-colors">
                          <RefreshCw className="h-4 w-4" />
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleVerify}
                    disabled={!file || isLoading}
                  >
                    {isLoading ? (
                      <><Loader2 className="h-5 w-5 animate-spin" />{stageMsg[stage]}</>
                    ) : (
                      <><ScanLine className="h-5 w-5" />Verify Medicine Authenticity</>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm">
                <Info className="h-4 w-4 mt-0.5 shrink-0 text-blue-600" />
                <p className="text-blue-800">
                  OCR accuracy depends on image clarity. Blurry or partially covered labels will receive a
                  lower confidence score. Use a clear, well-lit photograph for best results.
                </p>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              <Card>
                <CardHeader><CardTitle>Verification Pipeline</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {pipelineSteps.map(({ icon: Icon, label, sub }) => (
                    <div key={label} className="flex items-start gap-3">
                      <div className="rounded-lg border border-gray-200 bg-gray-50 p-2 shrink-0 mt-0.5">
                        <Icon className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{label}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{sub}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-blue-600" />
                    Photo Tips
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2.5">
                    {photoTips.map(tip => (
                      <li key={tip} className="flex items-start gap-2 text-xs text-gray-600">
                        <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5" />
                        {tip}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <Lock className="h-4 w-4 text-blue-600" />
                  Privacy Guaranteed
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Uploaded images are deleted immediately after OCR. The LLM runs locally.
                  No data is sent to external servers.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
