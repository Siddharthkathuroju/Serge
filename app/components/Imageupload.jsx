"use client";
import { useState, useEffect } from "react";

export default function ImageUpload({ onUpload }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [uploadedImage, setUploadedImage] = useState(null);
  const [textRemovalStatus, setTextRemovalStatus] = useState(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [compressionStatus, setCompressionStatus] = useState(null);
  const [compressing, setCompressing] = useState(false);

  const getBackendUrl = () => {
    try {
      return process.env.NEXT_PUBLIC_DJANGO_BACKEND_URL || 'http://localhost:8000';
    } catch {
      return 'http://localhost:8000';
    }
  };

  const buildAbsoluteUrl = (path) => {
    if (!path) return null;
    const backend = getBackendUrl();
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return `${backend}${path}`;
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setMessage("Please select an image file (JPEG, PNG, GIF)");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setMessage("File size too large (max 5MB)");
      return;
    }

    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
    setMessage("");
    setUploadedImage(null);
    setTextRemovalStatus(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage("Please select an image to upload.");
      return;
    }

    setUploading(true);
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("image", selectedFile);

      const res = await fetch("/api/Imageupload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      console.log("Upload response:", data); // Debug log

      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      // Validate response structure
      if (!data || !data.success) {
        throw new Error("Invalid response from server");
      }

      if (!data.image) {
        throw new Error("No image data received");
      }

      setMessage("Image uploaded successfully! Starting text removal...");
      setUploadedImage(data.image);
      
      // Safely set text removal status
      if (data.text_removal) {
        setTextRemovalStatus(data.text_removal);
        
        // Start monitoring text removal status if we have a task ID
        if (data.text_removal.success && data.text_removal.task_id) {
          monitorTextRemovalStatus(data.image.id);
        }
      } else {
        setTextRemovalStatus({
          success: false,
          error: "No text removal data received"
        });
      }

      setSelectedFile(null);
      setPreview(null);
      if (onUpload) onUpload();
    } catch (err) {
      console.error("Upload error:", err);
      setMessage(err instanceof Error ? err.message : "Upload failed");
      setTextRemovalStatus({
        success: false,
        error: err.message
      });
    } finally {
      setUploading(false);
    }
  };

  const monitorTextRemovalStatus = async (imageId) => {
    setCheckingStatus(true);
    
    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/Imageupload/status/${imageId}`);
        const data = await res.json();
        console.log("Status check response:", data); // Debug log
        
        if (!data || !data.success) {
          console.error("Invalid status response:", data);
          return false;
        }
        
        setTextRemovalStatus(prevStatus => ({
          ...prevStatus,
          status: data.status,
          ...(data.result || {})
        }));
        
        if (data.status === 'completed') {
          setMessage("Text removal completed successfully!");
          // Refresh image details to get processed image URL
          fetchImageDetails(imageId);
          return true; // Stop monitoring
        } else if (data.status === 'failed') {
          setMessage(`Text removal failed: ${data.result?.error || 'Unknown error'}`);
          return true; // Stop monitoring
        }
        
        return false; // Continue monitoring
      } catch (error) {
        console.error("Status check error:", error);
        return false;
      }
    };

    // Check status every 2 seconds
    const interval = setInterval(async () => {
      const shouldStop = await checkStatus();
      if (shouldStop) {
        clearInterval(interval);
        setCheckingStatus(false);
      }
    }, 2000);

    // Initial check
    const shouldStop = await checkStatus();
    if (shouldStop) {
      clearInterval(interval);
      setCheckingStatus(false);
    }
  };

  const fetchImageDetails = async (imageId) => {
    try {
      const res = await fetch(`/api/Imageupload/details/${imageId}`);
      const data = await res.json();
      console.log("Image details response:", data); // Debug log
      
      if (data && data.success && data.image) {
        setUploadedImage(data.image);
      }
    } catch (error) {
      console.error("Error fetching image details:", error);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'text-yellow-600',
      'processing': 'text-blue-600',
      'completed': 'text-green-600',
      'failed': 'text-red-600'
    };
    return colors[status] || 'text-gray-600';
  };

  const getStatusIcon = (status) => {
    const icons = {
      'pending': '⏳',
      'processing': '🔄',
      'completed': '✅',
      'failed': '❌'
    };
    return icons[status] || '❓';
  };

  const handleCompress = async () => {
    if (!uploadedImage) return;
    
    setCompressing(true);
    setMessage("Starting image compression...");
    
    try {
      const res = await fetch(`/api/compression/compress/${uploadedImage.id}`, {
        method: 'POST'
      });
      
      const data = await res.json();
      console.log("Compression response:", data);
      
      if (data && data.success) {
        setMessage("Image compressed successfully!");
        setCompressionStatus(data.compression);
        
        // Update uploaded image with compression data
        setUploadedImage(prev => ({
          ...prev,
          compressed_url: data.compression.compressed_url,
          compression_processed: true,
          compression_status: 'completed',
          original_size: data.compression.original_size,
          compressed_size: data.compression.compressed_size,
          compression_ratio: data.compression.compression_ratio
        }));
      } else {
        setMessage(data.error || "Compression failed");
        setCompressionStatus({
          success: false,
          error: data.error || "Compression failed"
        });
      }
    } catch (err) {
      console.error("Compression error:", err);
      setMessage(err.message || "Compression failed");
      setCompressionStatus({
        success: false,
        error: err.message
      });
    } finally {
      setCompressing(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };


  return (
    <div className="flex flex-col items-center gap-4 bg-white p-6 rounded-xl shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Text Removal Tool</h2>
      
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="mb-2"
      />
      
      {preview && (
        <img
          src={preview}
          alt="Preview"
          className="w-40 h-40 object-cover rounded-lg border mb-2"
          onLoad={() => URL.revokeObjectURL(preview)}
        />
      )}
      
      <button
        onClick={handleUpload}
        disabled={uploading || !selectedFile}
        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {uploading ? "Uploading..." : "Upload & Remove Text"}
      </button>
      
      {message && (
        <p className={`text-sm ${message.includes("success") ? "text-green-600" : message.includes("failed") ? "text-red-600" : "text-blue-600"}`}>
          {message}
        </p>
      )}
      
      {/* Text Removal Status */}
      {textRemovalStatus && (
        <div className="w-full max-w-md bg-gray-50 p-4 rounded-lg border">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Text Removal Status</h3>
          
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">{getStatusIcon(textRemovalStatus.status)}</span>
              <span className={`font-semibold ${getStatusColor(textRemovalStatus.status)}`}>
                {textRemovalStatus.status ? 
                  textRemovalStatus.status.charAt(0).toUpperCase() + textRemovalStatus.status.slice(1) : 
                  'Unknown'
                }
              </span>
            </div>
            
            {textRemovalStatus.message && (
              <p className="text-sm text-gray-700">{textRemovalStatus.message}</p>
            )}
            
            {textRemovalStatus.error && (
              <p className="text-sm text-red-600">{textRemovalStatus.error}</p>
            )}
            
            {checkingStatus && (
              <div className="flex items-center gap-2 text-blue-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm">Checking status...</span>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Uploaded Image Display */}
      {uploadedImage && (
        <div className="w-full max-w-md bg-gray-50 p-4 rounded-lg border">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Uploaded Image</h3>
          
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Original Image:</p>
              <img 
                src={buildAbsoluteUrl(uploadedImage.original_url || uploadedImage.url)} 
                alt="Original" 
                className="w-full h-32 object-cover rounded border"
              />
            </div>
            
            {/* Text Removal Results - Show if available */}
            {uploadedImage.processed_url && (
              <div className="w-full border-t pt-4 mt-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Text Removal Results</h3>
                <div>
                  <p className="text-sm text-gray-600 mb-2">Text Removed Image:</p>
                  <img 
                    src={buildAbsoluteUrl(uploadedImage.processed_url)} 
                    alt="Text Removed" 
                    className="w-full h-32 object-cover rounded border"
                  />
                  <a 
                    href={`${getBackendUrl()}/image/download/${uploadedImage.id}/`}
                    download 
                    className="inline-block mt-2 bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700"
                  >
                    Download Text-Removed Image
                  </a>
                </div>
              </div>
            )}
            
            {/* Image Compression Section - Independent of text removal */}
            <div className="w-full border-t pt-4 mt-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">AI-Powered Image Compression</h3>
              
              {!uploadedImage.compression_processed ? (
                <div className="text-center">
                  <button
                    onClick={handleCompress}
                    disabled={compressing}
                    className={`px-6 py-2 rounded text-white font-medium ${
                      compressing 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700'
                    }`}
                  >
                    {compressing ? 'AI Compressing...' : '🤖 AI Compress Image'}
                  </button>
                  <p className="text-sm text-gray-600 mt-2">
                    Advanced VQGAN compression for superior quality and file size reduction
                  </p>
                  <div className="mt-2 text-xs text-gray-500">
                    <p>✨ Uses deep learning for optimal compression</p>
                    <p>🎯 Maintains visual quality while reducing size</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">✅</span>
                    <span className="text-sm text-gray-700">AI Compression completed</span>
                    {compressionStatus?.method && (
                      <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                        {compressionStatus.method}
                      </span>
                    )}
                  </div>
                  
                  {uploadedImage.original_size && uploadedImage.compressed_size && (
                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border border-purple-200">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-gray-600 text-sm">Original Size:</p>
                          <p className="font-medium text-lg">{formatFileSize(uploadedImage.original_size)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 text-sm">Compressed Size:</p>
                          <p className="font-medium text-lg text-purple-600">{formatFileSize(uploadedImage.compressed_size)}</p>
                        </div>
                      </div>
                      {uploadedImage.compression_ratio && (
                        <div className="mt-3 pt-3 border-t border-purple-200">
                          <div className="flex items-center justify-between">
                            <p className="text-gray-600 text-sm">Compression Ratio:</p>
                            <p className="font-medium text-green-600 text-lg">
                              {((1 - uploadedImage.compression_ratio) * 100).toFixed(1)}% reduction
                            </p>
                          </div>
                          <div className="mt-2">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${(1 - uploadedImage.compression_ratio) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {uploadedImage.compressed_url && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">AI Compressed Image:</p>
                      <div className="relative">
                        <img 
                          src={buildAbsoluteUrl(uploadedImage.compressed_url)} 
                          alt="AI Compressed" 
                          className="w-full h-32 object-cover rounded border border-purple-200"
                        />
                        <div className="absolute top-2 right-2 bg-purple-600 text-white text-xs px-2 py-1 rounded">
                          AI Enhanced
                        </div>
                      </div>
                      <a 
                        href={`${getBackendUrl()}/image/download-compressed/${uploadedImage.id}/`}
                        download 
                        className="inline-block mt-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded text-sm hover:from-purple-700 hover:to-blue-700 transition-all duration-200"
                      >
                        🤖 Download AI Compressed Image
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="text-xs text-gray-500">
              <p>ID: {uploadedImage.id}</p>
              <p>Uploaded by: {uploadedImage.created_by}</p>
              <p>Date: {uploadedImage.date} at {uploadedImage.time}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}