'use client';

import { useState } from 'react';
import { FileUpload } from '@/components/file-upload';
import { BrainCircuit, CheckCircle2, Sparkles, AlertCircle, Edit3, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Question {
  questionNumber?: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

interface AnalysisResult {
  questions: Question[];
}

interface CorrectionState {
  [questionIndex: number]: {
    selectedAnswers: string[];
    editedExplanation: string;
    isEditing: boolean;
    isSaved: boolean;
  };
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [corrections, setCorrections] = useState<CorrectionState>({});

  const handleFileSelect = (uploadedFile: File) => {
    setFile(uploadedFile);
    setResult(null);
    setError(null);
    setCorrections({});
  };

  const handleOptionClick = (questionIndex: number, option: string) => {
    if (!corrections[questionIndex]?.isEditing) return;
    setCorrections(prev => {
      const currentAnswers = prev[questionIndex]?.selectedAnswers || [];
      const isSelected = currentAnswers.includes(option);
      const newAnswers = isSelected
        ? currentAnswers.filter(a => a !== option)
        : [...currentAnswers, option];
      return {
        ...prev,
        [questionIndex]: {
          ...prev[questionIndex],
          selectedAnswers: newAnswers,
        }
      };
    });
  };

  const toggleEdit = (questionIndex: number, question: Question) => {
    setCorrections(prev => {
      const existingAnswers = prev[questionIndex]?.selectedAnswers;
      const defaultAnswers = Array.isArray(question.correctAnswer)
        ? question.correctAnswer
        : [question.correctAnswer];
      return {
        ...prev,
        [questionIndex]: {
          selectedAnswers: existingAnswers || defaultAnswers,
          editedExplanation: prev[questionIndex]?.editedExplanation || question.explanation,
          isEditing: !prev[questionIndex]?.isEditing,
          isSaved: false,
        }
      };
    });
  };

  const handleExplanationChange = (questionIndex: number, value: string) => {
    if (!corrections[questionIndex]?.isEditing) return;
    setCorrections(prev => ({
      ...prev,
      [questionIndex]: {
        ...prev[questionIndex],
        editedExplanation: value,
      }
    }));
  };

  const submitCorrection = async (questionIndex: number, question: Question) => {
    const correction = corrections[questionIndex];
    if (!correction?.selectedAnswers || correction.selectedAnswers.length === 0) return;

    try {
      const response = await fetch('/api/corrections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question.question,
          options: question.options,
          aiAnswer: question.correctAnswer,
          userCorrectAnswer: correction.selectedAnswers,
          aiExplanation: question.explanation,
          userExplanation: correction.editedExplanation,
        }),
      });

      if (response.ok) {
        setCorrections(prev => ({
          ...prev,
          [questionIndex]: {
            ...prev[questionIndex],
            isEditing: false,
            isSaved: true,
          }
        }));
      }
    } catch (err) {
      console.error('Failed to save correction:', err);
    }
  };

  // Image compression function to reduce file size for Vercel's 4.5MB limit
  const compressImage = (file: File, maxWidth: number = 1024, quality: number = 0.7): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = () => {
        let { width, height } = img;

        // Scale down if larger than maxWidth
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);

        // Convert to base64 with compression
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      };

      img.onerror = () => reject(new Error('Failed to load image'));

      // Read file as data URL
      const reader = new FileReader();
      reader.onloadend = () => {
        img.src = reader.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const handleAnalyze = async () => {
    if (!file) return;

    setAnalyzing(true);
    setError(null);

    try {
      // Compress image before sending to avoid Vercel's 4.5MB limit
      const base64String = await compressImage(file, 1024, 0.7);
      console.log('Compressed image size:', Math.round(base64String.length / 1024), 'KB');

      try {
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ image: base64String }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to analyze image');
        }

        const data = await response.json();
        setResult(data);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setAnalyzing(false);
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred");
      setAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-zinc-950 text-zinc-50 selection:bg-indigo-500/30">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-zinc-950/50 backdrop-blur-xl supports-[backdrop-filter]:bg-zinc-950/30 max-h-16">
        <div className="container flex items-center h-16 max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-500/10">
              <BrainCircuit className="w-6 h-6 text-indigo-400" />
            </div>
            <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-200 via-indigo-400 to-indigo-200">
              Kokushi AI Expert
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-4xl mx-auto px-4 pt-32 pb-20">
        <div className="flex flex-col items-center justify-center space-y-8 text-center sm:mb-16">
          <div className="space-y-4 max-w-3xl">
            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-white mb-6">
              Master the <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
                National Physio Exam
              </span>
            </h1>
            <p className="text-lg sm:text-x text-zinc-400 max-w-2xl mx-auto leading-relaxed">
              過去問の画像をアップロードすると、AIが即座に正確な解答と詳しい解説を提供します。※1問ずつアップロードしてください。
            </p>
          </div>
        </div>

        {/* Upload Section */}
        <section className="relative z-10 max-w-2xl mx-auto mt-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="absolute inset-0 -z-10 bg-indigo-500/5 blur-3xl rounded-full transform scale-150 opacity-50" />
          <FileUpload onFileSelect={handleFileSelect} isLoading={analyzing} />

          {error && (
            <div className="mt-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {file && !result && (
            <div className="mt-8 flex justify-center animate-in fade-in zoom-in duration-300">
              <Button
                size="lg"
                onClick={handleAnalyze}
                disabled={analyzing}
                className="relative overflow-hidden group bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-6 text-lg rounded-xl shadow-2xl shadow-indigo-500/20 transition-all hover:scale-105 hover:shadow-indigo-500/30"
              >
                {analyzing ? (
                  <>
                    <Sparkles className="w-5 h-5 mr-2 animate-spin" />
                    Analyzing Question...
                  </>
                ) : (
                  <>
                    <BrainCircuit className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
                    Analyze with AI
                  </>
                )}
              </Button>
            </div>
          )}
        </section>

        {/* Results Section */}
        {result && result.questions && (
          <section className="mt-16 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-zinc-200">
                {result.questions.length}問の解析結果
              </h2>
            </div>

            {result.questions.map((q: Question, qIndex: number) => (
              <Card key={qIndex} className="bg-zinc-900/50 border-zinc-800 overflow-hidden">
                <CardHeader className="border-b border-zinc-800 bg-zinc-900/50">
                  <CardTitle className="text-xl text-zinc-200 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-400" />
                    問題 {q.questionNumber || qIndex + 1}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-8">
                  {/* Question */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Question</h3>
                    <p className="text-lg text-zinc-100 leading-relaxed font-medium">
                      {q.question}
                    </p>
                  </div>

                  {/* Options */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Options</h3>
                      <div className="flex items-center gap-2">
                        {corrections[qIndex]?.isSaved && (
                          <span className="text-xs text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            修正済み
                          </span>
                        )}
                        {corrections[qIndex]?.isEditing ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => submitCorrection(qIndex, q)}
                            className="text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
                          >
                            <Save className="w-4 h-4 mr-1" />
                            保存
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleEdit(qIndex, q)}
                            className="text-zinc-400 border-zinc-700 hover:bg-zinc-800"
                          >
                            <Edit3 className="w-4 h-4 mr-1" />
                            修正
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="grid gap-3">
                      {(q.options || []).map((option: string, index: number) => {
                        // Check if in correction mode
                        const isEditing = corrections[qIndex]?.isEditing;
                        const userSelectedAnswers = corrections[qIndex]?.selectedAnswers || [];

                        // Handle multiple correct answers (string or array)
                        const rawAnswer = q.correctAnswer || '';
                        const correctAnswers = Array.isArray(rawAnswer)
                          ? rawAnswer.map((a: string) => String(a).trim())
                          : String(rawAnswer).split('\n').map((a: string) => a.trim());
                        const isAICorrect = correctAnswers.some((ans: string) =>
                          option.trim() === ans ||
                          ans.includes(option.trim()) ||
                          option.trim().includes(ans)
                        );

                        // Determine highlight state
                        let isHighlighted = false;
                        if (isEditing) {
                          isHighlighted = userSelectedAnswers.includes(option);
                        } else if (corrections[qIndex]?.isSaved) {
                          isHighlighted = (corrections[qIndex]?.selectedAnswers || []).includes(option);
                        } else {
                          isHighlighted = isAICorrect;
                        }

                        return (
                          <div
                            key={index}
                            onClick={() => handleOptionClick(qIndex, option)}
                            className={`p-4 rounded-lg border transition-all ${isEditing ? 'cursor-pointer hover:border-indigo-400' : ''
                              } ${isHighlighted
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200'
                                : 'bg-zinc-800/50 border-zinc-700 text-zinc-300'
                              }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center text-xs font-medium flex-shrink-0 ${isHighlighted
                                ? 'border-emerald-500 bg-emerald-500 text-black'
                                : 'border-zinc-600 text-zinc-400'
                                }`}>
                                {index + 1}
                              </div>
                              <span>{option}</span>
                              {isHighlighted && (
                                <CheckCircle2 className="w-5 h-5 text-emerald-500 ml-auto flex-shrink-0" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Explanation */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Explanation</h3>
                    {corrections[qIndex]?.isEditing ? (
                      <textarea
                        value={corrections[qIndex]?.editedExplanation || q.explanation}
                        onChange={(e) => handleExplanationChange(qIndex, e.target.value)}
                        className="w-full p-6 rounded-xl bg-zinc-800/80 border border-indigo-500/30 text-zinc-300 leading-relaxed resize-none focus:outline-none focus:border-indigo-400 min-h-[200px]"
                        placeholder="解説を編集..."
                      />
                    ) : (
                      <div className="p-6 rounded-xl bg-indigo-500/5 border border-indigo-500/10 text-zinc-300 leading-relaxed whitespace-pre-wrap">
                        {corrections[qIndex]?.isSaved ? corrections[qIndex]?.editedExplanation : q.explanation}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={() => {
                  setFile(null);
                  setResult(null);
                }}
                className="border-zinc-700 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
              >
                Analyze Another Question
              </Button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
