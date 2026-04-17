"use client";

import { useState, useRef } from "react";
import { Upload, X, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import axios from "axios";

interface FileUploadProps {
    onUploadComplete: (url: string, path: string) => void;
    type?: "avatar" | "document" | "general";
    accept?: string;
    maxSizeMB?: number;
    className?: string;
    initialValue?: string; // Added initialValue prop
}

export default function FileUpload({
    onUploadComplete,
    type = "general",
    accept = "image/*",
    maxSizeMB = 10,
    className = "",
    initialValue = "", // Default to empty string
}: FileUploadProps) {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(initialValue || null); // Initialize preview with initialValue
    const [uploading, setUploading] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Update preview when initialValue changes (e.g. after data fetch)
    // using a key or effect in parent might be cleaner, but simple effect here works
    // actually, let's just rely on initial render or key change for now to avoid complexity
    // or add a useEffect to sync if needed. For now, let's stick to initial state if component re-mounts or add basic sync.
    // Better: Add useEffect to sync initialValue changes if data loads async
    const [initialized, setInitialized] = useState(false);
    if (initialValue && !preview && !file && !initialized) {
        setPreview(initialValue);
        setInitialized(true);
    }

    const handleFileSelect = (selectedFile: File | null) => {
        if (!selectedFile) return;

        // Validate file size
        const maxSizeBytes = maxSizeMB * 1024 * 1024;
        if (selectedFile.size > maxSizeBytes) {
            setError(`File size exceeds ${maxSizeMB}MB limit`);
            return;
        }

        setFile(selectedFile);
        setError(null);
        setUploadSuccess(false);

        // Create preview for images
        if (selectedFile.type.startsWith("image/")) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(selectedFile);
        } else {
            setPreview(null);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        setError(null);

        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", type);

        try {
            const token = localStorage.getItem("auth_token");
            const response = await axios.post("http://127.0.0.1:8000/api/v1/upload", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.data.status === "Success") {
                setUploadSuccess(true);
                const { url, path } = response.data.data;
                // Backend returns full URL, so we use it directly. 
                // If it were relative, we would prepend the domain, but asset() returns absolute.
                onUploadComplete(url, path);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || "Upload failed. Please try again.");
        } finally {
            setUploading(false);
        }
    };

    const handleRemove = () => {
        setFile(null);
        setPreview(null);
        setUploadSuccess(false);
        setError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    return (
        <div className={`space-y-3 ${className}`}>
            {/* File Input */}
            <input
                ref={fileInputRef}
                type="file"
                accept={accept}
                onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
                className="hidden"
                id="file-upload"
            />

            {/* Upload Area */}
            {/* Upload Area */}
            {!file && !preview ? (
                <label
                    htmlFor="file-upload"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-purple-400 hover:bg-purple-50/30 transition-all"
                >
                    <Upload className="h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">
                        Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                        Max size: {maxSizeMB}MB
                    </p>
                </label>
            ) : (
                <div className="border border-gray-200 rounded-lg p-4 space-y-3">
                    {/* Preview */}
                    {preview && (
                        <div className="flex justify-center relative group">
                            {/* Use standard img tag for robustness */}
                            <img
                                src={preview.startsWith('http://127.0.0.1:8000http') ? preview.replace('http://127.0.0.1:8000http', 'http') : preview}
                                alt="Preview"
                                className="h-32 w-32 object-cover rounded-lg border border-gray-200"
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                }}
                            />
                            {/* Overlay to change image */}
                            <label
                                htmlFor="file-upload"
                                className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg cursor-pointer"
                            >
                                <span className="text-white text-xs font-medium">Change Photo</span>
                            </label>
                        </div>
                    )}

                    {/* File Info only if a new file is selected */}
                    {file && (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {uploadSuccess ? (
                                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                                ) : error ? (
                                    <AlertCircle className="h-5 w-5 text-red-500" />
                                ) : (
                                    <Upload className="h-5 w-5 text-gray-400" />
                                )}
                                <div>
                                    <p className="text-sm font-medium text-gray-800 truncate max-w-[200px]">
                                        {file.name}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        {(file.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Remove/Clear Button */}
                    <div className="flex justify-end">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleRemove}
                            className="text-red-500 hover:bg-red-50 hover:text-red-600 text-xs"
                        >
                            <X className="h-3 w-3 mr-1" /> Remove / Clear
                        </Button>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <p className="text-xs text-red-500 bg-red-50 p-2 rounded">{error}</p>
                    )}

                    {/* Upload Button - Only show if there is a NEW file to upload */}
                    {file && !uploadSuccess && (
                        <Button
                            onClick={handleUpload}
                            disabled={uploading}
                            className="w-full bg-gradient-to-r from-amber-500 to-purple-600 hover:from-amber-600 hover:to-purple-700 text-white rounded-full"
                        >
                            {uploading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Uploading...
                                </>
                            ) : (
                                "Upload File"
                            )}
                        </Button>
                    )}

                    {/* Success Message */}
                    {uploadSuccess && (
                        <p className="text-xs text-green-600 bg-green-50 p-2 rounded text-center font-medium">
                            ✓ Upload successful!
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
