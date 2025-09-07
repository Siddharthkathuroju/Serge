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

export default function TextRemovalUpload() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [resultImage, setResultImage] = useState(null);

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
        // duplex option is not needed in browsers
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Upload failed");
      setMessage("Text removal started. Please wait...");
      // Poll for status
      let status = "pending";
      let processedUrl = null;
      while (status !== "completed" && status !== "failed") {
        await new Promise((r) => setTimeout(r, 2000));
        const statusRes = await fetch(`/api/Imageupload/status/${data.image.id}`);
        const statusData = await statusRes.json();
        status = statusData.status;
        if (status === "completed") {
          // Fetch processed image
          const detailsRes = await fetch(`/api/Imageupload/details/${data.image.id}`);
          const detailsData = await detailsRes.json();
          processedUrl = detailsData?.image?.processed_url;
        } else if (status === "failed") {
          setMessage("Text removal failed.");
        }
      }
      if (processedUrl) {
        setResultImage(processedUrl);
        setMessage("Text removal completed!");
      }
    } catch (err) {
      setMessage(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 bg-white p-6 rounded-xl shadow-md w-full max-w-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Text Removal Tool</h2>
      <input type="file" accept="image/*" onChange={handleFileChange} className="mb-2" />
      {preview && <img src={preview} alt="Preview" className="w-40 h-40 object-cover rounded-lg border mb-2" />}
      <button onClick={handleUpload} disabled={uploading || !selectedFile} className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50">
        {uploading ? "Uploading..." : "Upload & Remove Text"}
      </button>
      {message && <p className="text-sm text-blue-600">{message}</p>}
      {resultImage && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Text Removed Image:</h3>
          <img src={buildAbsoluteUrl(resultImage)} alt="Text Removed" className="w-40 h-40 object-cover rounded border" />
        </div>
      )}
    </div>
  );
}
