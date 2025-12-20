
import React, { useState, useRef, ChangeEvent } from 'react';
import { Upload, FileText, X, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface FileUploadProps {
    onFileSelect: (file: File) => void;
    isLoading?: boolean;
}

export function FileUpload({ onFileSelect, isLoading = false }: FileUploadProps) {
    const [dragActive, setDragActive] = useState<boolean>(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const handleFile = (file: File) => {
        setSelectedFile(file);
        onFileSelect(file);
    };

    const removeFile = () => {
        setSelectedFile(null);
        if (inputRef.current) {
            inputRef.current.value = '';
        }
    };

    const onButtonClick = () => {
        inputRef.current?.click();
    };

    return (
        <Card className="w-full max-w-xl mx-auto border-0 shadow-lg bg-zinc-900/50 backdrop-blur-sm">
            <CardContent className="p-6">
                {selectedFile ? (
                    <div className="flex flex-col items-center justify-center p-6 space-y-4 border-2 border-dashed border-indigo-500/50 rounded-xl bg-indigo-500/5">
                        <div className="p-4 rounded-full bg-indigo-500/20 text-indigo-400">
                            <FileText className="w-8 h-8" />
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-medium text-zinc-200">{selectedFile.name}</p>
                            <p className="text-xs text-zinc-400">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={removeFile}
                                disabled={isLoading}
                                className="text-zinc-400 hover:text-zinc-100 border-zinc-700 hover:bg-zinc-800"
                            >
                                Remove
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div
                        className={cn(
                            "relative flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-xl transition-all duration-300 ease-in-out",
                            dragActive
                                ? "border-indigo-500 bg-indigo-500/10 scale-[1.02]"
                                : "border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800/30 bg-zinc-900/30"
                        )}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                    >
                        <input
                            ref={inputRef}
                            type="file"
                            className="hidden"
                            accept="image/*,application/pdf"
                            onChange={handleChange}
                        />

                        <div className="flex flex-col items-center justify-center space-y-4 text-center p-4">
                            <div className={cn(
                                "p-4 rounded-full transition-colors duration-300",
                                dragActive ? "bg-indigo-500/20 text-indigo-400" : "bg-zinc-800 text-zinc-400"
                            )}>
                                <Upload className="w-8 h-8" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-lg font-semibold text-zinc-200">
                                    Upload Question
                                </p>
                                <p className="text-sm text-zinc-400">
                                    Drag & drop or click to upload
                                </p>
                            </div>
                            <p className="text-xs text-zinc-500">
                                Supports PDF and Images
                            </p>
                            <Button
                                onClick={onButtonClick}
                                variant="secondary"
                                className="mt-2 bg-indigo-600 hover:bg-indigo-500 text-white border-0"
                            >
                                Select File
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
