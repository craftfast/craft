"use client";

import { useState } from "react";
import Image from "next/image";

interface UploadedFile {
  id: string;
  fileName: string;
  url: string;
  size: number;
  mimeType: string;
  r2Key: string;
}

export default function TestUploadPage() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [error, setError] = useState<string>("");

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setSelectedFiles(Array.from(files));
      setError("");
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setError("Please select files to upload");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append("files", file);
      });

      const response = await fetch("/api/upload?purpose=upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }

      console.log("Upload response:", data);
      setUploadedFiles(data.files || []);
      setSelectedFiles([]);
      setError("");
    } catch (err) {
      console.error("Upload error:", err);
      setError(err instanceof Error ? err.message : "Failed to upload files");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-neutral-800 rounded-2xl p-8 shadow-lg">
          <h1 className="text-3xl font-bold mb-2 text-neutral-900 dark:text-neutral-50">
            File Upload Test
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mb-8">
            Test Cloudflare R2 file upload functionality
          </p>

          {/* File Selection */}
          <div className="mb-6">
            <label className="block mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Select Files
            </label>
            <input
              type="file"
              multiple
              onChange={handleFileSelect}
              className="block w-full text-sm text-neutral-900 dark:text-neutral-100 
                         border border-neutral-300 dark:border-neutral-600 
                         rounded-lg cursor-pointer 
                         bg-neutral-50 dark:bg-neutral-700 
                         focus:outline-none p-2"
            />
          </div>

          {/* Selected Files Preview */}
          {selectedFiles.length > 0 && (
            <div className="mb-6 p-4 bg-neutral-100 dark:bg-neutral-700 rounded-lg">
              <h3 className="font-semibold mb-2 text-neutral-900 dark:text-neutral-100">
                Selected Files ({selectedFiles.length}):
              </h3>
              <ul className="space-y-1">
                {selectedFiles.map((file, index) => (
                  <li
                    key={index}
                    className="text-sm text-neutral-700 dark:text-neutral-300"
                  >
                    {file.name} ({(file.size / 1024).toFixed(2)} KB)
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={uploading || selectedFiles.length === 0}
            className="w-full bg-neutral-900 dark:bg-neutral-100 
                       text-white dark:text-neutral-900 
                       font-semibold py-3 px-6 rounded-full 
                       hover:bg-neutral-800 dark:hover:bg-neutral-200 
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors"
          >
            {uploading ? "Uploading..." : "Upload Files"}
          </button>

          {/* Upload Results */}
          {uploadedFiles.length > 0 && (
            <div className="mt-8 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <h3 className="font-semibold mb-4 text-green-900 dark:text-green-100">
                ✅ Successfully Uploaded ({uploadedFiles.length} files)
              </h3>
              <div className="space-y-4">
                {uploadedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="p-3 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700"
                  >
                    <div className="flex items-start gap-4">
                      {/* Preview if image */}
                      {file.mimeType?.startsWith("image/") && (
                        <Image
                          src={file.url}
                          alt={file.fileName}
                          width={96}
                          height={96}
                          className="w-24 h-24 object-cover rounded-lg"
                          unoptimized
                        />
                      )}

                      {/* File Details */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-neutral-900 dark:text-neutral-100 mb-1">
                          {file.fileName}
                        </h4>
                        <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-1">
                          Type: {file.mimeType || "unknown"}
                        </p>
                        <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-2">
                          Size: {(file.size / 1024).toFixed(2)} KB
                        </p>
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block text-xs text-blue-600 dark:text-blue-400 
                                   hover:underline break-all"
                        >
                          {file.url}
                        </a>
                      </div>
                    </div>

                    {/* Copy URL Button */}
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(file.url);
                        alert("URL copied to clipboard!");
                      }}
                      className="mt-2 text-xs bg-neutral-100 dark:bg-neutral-700 
                               text-neutral-700 dark:text-neutral-300 
                               px-3 py-1 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-600
                               transition-colors"
                    >
                      Copy URL
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h3 className="font-semibold mb-2 text-blue-900 dark:text-blue-100">
              ℹ️ Testing Instructions
            </h3>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
              <li>Select one or more files (any type)</li>
              <li>Click &quot;Upload Files&quot; to upload to Cloudflare R2</li>
              <li>View the uploaded file URLs and preview images</li>
              <li>Open the browser console to see detailed logs</li>
              <li>You must be logged in to upload files</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
