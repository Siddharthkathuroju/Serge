"use client";
import { useState } from "react";

const getBackendUrl = () => {
  return process.env.NEXT_PUBLIC_DJANGO_BACKEND_URL || 'http://localhost:8000';
};

function buildAbsoluteUrl(path) {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${getBackendUrl()}${path}`;
}

export default function ImageCompressionUpload() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [resultImage, setResultImage] = useState(null);
  const [compressionInfo, setCompressionInfo] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMessage("Please select an image file");
      return;
    }
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
    setMessage("");
    setResultImage(null);
    setCompressionInfo(null);
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
      // First upload the image
      const res = await fetch("/api/Imageupload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Upload failed");
      setMessage("Image uploaded. Starting compression...");
      // Now call compression endpoint
      const compressRes = await fetch(`/api/compression/compress/${data.image.id}`, {
        method: "POST"
      });
      const compressData = await compressRes.json();
      if (!compressRes.ok || !compressData.success) throw new Error(compressData.error || "Compression failed");
      setResultImage(compressData.compression.compressed_url);
      setCompressionInfo(compressData.compression);
      setMessage("Compression completed!");
    } catch (err) {
      setMessage(err.message || "Upload or compression failed");
    } finally {
      setUploading(false);
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
    <div className="flex flex-col items-center gap-4 bg-white p-6 rounded-xl shadow-md w-full max-w-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Image Compression Tool</h2>
      <input type="file" accept="image/*" onChange={handleFileChange} className="mb-2" />
      {preview && <img src={preview} alt="Preview" className="w-40 h-40 object-cover rounded-lg border mb-2" />}
      <button onClick={handleUpload} disabled={uploading || !selectedFile} className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700 disabled:opacity-50">
        {uploading ? "Uploading..." : "Upload & Compress"}
      </button>
      {message && <p className="text-sm text-purple-600">{message}</p>}
      {resultImage && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Compressed Image:</h3>
          <img src={buildAbsoluteUrl(resultImage)} alt="Compressed" className="w-40 h-40 object-cover rounded border" />
          {compressionInfo && (
            <div className="mt-2 text-xs text-gray-600">
              <p>Original Size: {formatFileSize(compressionInfo.original_size)}</p>
              <p>Compressed Size: {formatFileSize(compressionInfo.compressed_size)}</p>
              <p>Compression Ratio: {((1 - compressionInfo.compression_ratio) * 100).toFixed(1)}% reduction</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
