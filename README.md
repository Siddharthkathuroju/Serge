SERGE
VQGAN Compression & Image Captioning App

This project is a full-stack AI-powered application built using Next.js (frontend) and Django (backend). It combines state-of-the-art deep learning models for image compression and image-to-text captioning, making it a powerful demo of computer vision + NLP integration.

✨ Features
🔹 1. Image Compression with VQ-VAE + GAN

Implements Vector Quantized Variational Autoencoder (VQ-VAE) with GAN-based adversarial training.

Achieves high-quality compression while preserving visual details.

Trained and optimized with regularization + hyperparameter tuning.

Users can upload an image → compressed representation → reconstructed output.

🔹 2. Image Captioning with BLIP

Uses a BLIP (Bootstrapping Language-Image Pretraining)-style model for image-to-text generation.

Upload an image → AI generates a meaningful caption/description.

Supports vision encoder + transformer-based decoder.

🔹 3. Fullstack Web App

Frontend: Next.js (React + Tailwind CSS)

Backend: Django REST Framework (API for ML inference)


Extensible to plug in more ML models.

📂 Tech Stack

Frontend: Next.js, React, TailwindCSS

Backend: Django, Django REST Framework

ML/DL Frameworks: PyTorch, Transformers





3️⃣ Access the App

Frontend (Next.js): http://localhost:3000

Backend (Django): http://localhost:8000
