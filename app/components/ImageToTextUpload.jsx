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

export default function ImageToTextUpload() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [caption, setCaption] = useState(null);

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
    setCaption(null);
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
      // This endpoint should be implemented in Django for image captioning
      const res = await fetch("/api/image2text", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Captioning failed");
      setCaption(data.caption);
      setMessage("Caption generated successfully!");
    } catch (err) {
      setMessage(err.message || "Upload or captioning failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 bg-white p-6 rounded-xl shadow-md w-full max-w-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Image to Text (Caption) Tool</h2>
      <input type="file" accept="image/*" onChange={handleFileChange} className="mb-2" />
      {preview && <img src={buildAbsoluteUrl(preview)} alt="Preview" className="w-40 h-40 object-cover rounded-lg border mb-2" />}
      <button onClick={handleUpload} disabled={uploading || !selectedFile} className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50">
        {uploading ? "Uploading..." : "Upload & Get Caption"}
      </button>
      {message && <p className="text-sm text-green-600">{message}</p>}
      {caption && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Generated Caption:</h3>
          <p className="text-base text-gray-700 bg-gray-100 p-3 rounded">{caption}</p>
        </div>
      )}
    </div>
  );
}
