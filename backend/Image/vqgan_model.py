import math
import os
from pathlib import Path
import torch
import torch.nn as nn
import torch.nn.functional as F
from torchvision import transforms, models
from PIL import Image
import io

# ---------------------------
# Utilities
# ---------------------------

def exists(x):
    return x is not None


def l2_normalize(x, eps=1e-8):
    return x / (x.norm(dim=-1, keepdim=True) + eps)


# ---------------------------
# VectorQuantizerEMA (DeepMind style)
# ---------------------------
class VectorQuantizerEMA(nn.Module):
    def __init__(self, num_embeddings, embedding_dim, commitment_cost=0.25, decay=0.99, eps=1e-5):
        super().__init__()
        self.embedding_dim = embedding_dim
        self.num_embeddings = num_embeddings
        self.commitment_cost = commitment_cost
        self.decay = decay
        self.eps = eps

        embed = torch.randn(embedding_dim, num_embeddings)
        self.register_buffer('embedding', embed)
        self.register_buffer('cluster_size', torch.zeros(num_embeddings))
        self.register_buffer('embed_avg', embed.clone())

    def forward(self, inputs):
        # inputs: (B, C, H, W)
        b, c, h, w = inputs.shape
        assert c == self.embedding_dim, 'channel mismatch'

        flat = inputs.permute(0, 2, 3, 1).contiguous().view(-1, c)  # (BHW, C)

        # distances: (BHW, N)
        embedding = self.embedding  # (C, N)
        distances = (
            torch.sum(flat ** 2, dim=1, keepdim=True)
            - 2 * torch.matmul(flat, embedding)
            + torch.sum(embedding ** 2, dim=0, keepdim=True)
        )

        encoding_indices = torch.argmin(distances, dim=1)
        encodings = F.one_hot(encoding_indices, self.num_embeddings).type(flat.dtype)

        quantized = torch.matmul(encodings, embedding.t()).view(b, h, w, c).permute(0, 3, 1, 2).contiguous()

        if self.training:
            enc_sum = encodings.sum(0)
            dw = torch.matmul(flat.t(), encodings)

            self.cluster_size.data.mul_(self.decay).add_(enc_sum, alpha=1 - self.decay)
            self.embed_avg.data.mul_(self.decay).add_(dw, alpha=1 - self.decay)

            n = torch.sum(self.cluster_size)
            cluster_size = ((self.cluster_size + self.eps) / (n + self.num_embeddings * self.eps) * n)
            self.embedding.data.copy_(self.embed_avg / cluster_size.unsqueeze(0))

        commitment_loss = self.commitment_cost * F.mse_loss(quantized.detach(), inputs)
        # straight-through
        quantized = inputs + (quantized - inputs).detach()

        # also return indices for compression demo
        indices = encoding_indices.view(b, h, w)
        return quantized, commitment_loss, indices


# ---------------------------
# Encoder / Decoder (small ResNet-ish convs)
# ---------------------------
class ResidualBlock(nn.Module):
    def __init__(self, channels):
        super().__init__()
        self.net = nn.Sequential(
            nn.Conv2d(channels, channels, 3, stride=1, padding=1),
            nn.SiLU(),
            nn.Dropout2d(p=0.1),
            nn.Conv2d(channels, channels, 3, stride=1, padding=1),
        )

    def forward(self, x):
        return x + self.net(x)


class Encoder(nn.Module):
    def __init__(self, in_channels=3, hidden=256, embedding_dim=256):
        super().__init__()
        self.conv_in = nn.Sequential(
            nn.Conv2d(in_channels, hidden // 2, 4, stride=2, padding=1),  # 64->32
            nn.SiLU(),
            nn.Conv2d(hidden // 2, hidden, 4, stride=2, padding=1),        # 32->16
            nn.SiLU(),
        )
        self.res = nn.Sequential(*[ResidualBlock(hidden) for _ in range(2)])
        self.conv_out = nn.Conv2d(hidden, embedding_dim, 1)

    def forward(self, x):
        return self.conv_in(x)


class Decoder(nn.Module):
    def __init__(self, embedding_dim=256, hidden=256, out_ch=3):
        super().__init__()
        self.conv_in = nn.Conv2d(embedding_dim, hidden, 1)
        self.res = nn.Sequential(*[ResidualBlock(hidden) for _ in range(2)])
        self.ups = nn.Sequential(
            nn.ConvTranspose2d(hidden, hidden // 2, 4, stride=2, padding=1),  # 16->32
            nn.SiLU(),
            nn.ConvTranspose2d(hidden // 2, out_ch, 4, stride=2, padding=1),   # 32->64
            nn.Tanh(),
        )

    def forward(self, z):
        return self.ups(self.res(self.conv_in(z)))


# ---------------------------
# VQGAN Model Wrapper
# ---------------------------
class VQGANModel(nn.Module):
    def __init__(self, embedding_dim=256, num_embeddings=1024, hidden=256):
        super().__init__()
        self.encoder = Encoder(in_channels=3, hidden=hidden, embedding_dim=embedding_dim)
        self.decoder = Decoder(embedding_dim=embedding_dim, hidden=hidden, out_ch=3)
        self.quantizer = VectorQuantizerEMA(num_embeddings, embedding_dim, commitment_cost=0.25, decay=0.99)
        
    def forward(self, x):
        z_e = self.encoder(x)
        z_q, vq_loss, indices = self.quantizer(z_e)
        x_recon = self.decoder(z_q)
        return x_recon, vq_loss, indices
    
    def encode(self, x):
        z_e = self.encoder(x)
        z_q, _, indices = self.quantizer(z_e)
        return z_q, indices
    
    def decode(self, z_q):
        return self.decoder(z_q)


# ---------------------------
# VQGAN Compression Service
# ---------------------------
class VQGANCompressionService:
    def __init__(self, model_path=None, device=None):
        self.device = device or ('cuda' if torch.cuda.is_available() else 'cpu')
        self.model = None
        self.transform = transforms.Compose([
            transforms.Resize((64, 64)),  # VQGAN expects 64x64 input
            transforms.ToTensor(),
            transforms.Normalize((0.5, 0.5, 0.5), (0.5, 0.5, 0.5))
        ])
        
        if model_path and os.path.exists(model_path):
            self.load_model(model_path)
    
    def load_model(self, model_path):
        """Load trained VQGAN model"""
        try:
            # Initialize model
            self.model = VQGANModel(embedding_dim=256, num_embeddings=1024, hidden=256)
            
            # Load checkpoint
            checkpoint = torch.load(model_path, map_location=self.device)
            
            # Load state dicts
            if 'encoder' in checkpoint:
                self.model.encoder.load_state_dict(checkpoint['encoder'])
                self.model.decoder.load_state_dict(checkpoint['decoder'])
                self.model.quantizer.load_state_dict(checkpoint['quantizer'])
            else:
                # Direct model state dict
                self.model.load_state_dict(checkpoint)
            
            self.model.to(self.device)
            self.model.eval()
            return True
        except Exception as e:
            print(f"Error loading VQGAN model: {e}")
            return False
    
    def tensor_to_pil(self, tensor):
        """Convert tensor back to PIL Image"""
        arr = tensor.permute(1, 2, 0).cpu().numpy()
        arr = (arr * 0.5 + 0.5).clip(0, 1)  # de-normalize
        arr = (arr * 255).astype("uint8")
        return Image.fromarray(arr)
    
    def compress_image(self, image_path, output_path=None):
        """
        Compress image using VQGAN
        Returns: dict with compression results
        """
        if not self.model:
            return {
                'success': False,
                'error': 'VQGAN model not loaded',
                'message': 'VQGAN model not available. Using fallback compression.'
            }
        
        try:
            # Load and preprocess image
            img = Image.open(image_path).convert("RGB")
            original_size = os.path.getsize(image_path)
            
            # Transform to tensor
            img_tensor = self.transform(img).unsqueeze(0).to(self.device)
            
            # Compress using VQGAN
            with torch.no_grad():
                recon_img, vq_loss, indices = self.model(img_tensor)
            
            # Convert back to PIL
            recon_pil = self.tensor_to_pil(recon_img[0])
            
            # Save compressed image
            if output_path is None:
                output_path = image_path.replace('.', '_vqgan_compressed.')
            
            recon_pil.save(output_path, 'JPEG', quality=95)
            compressed_size = os.path.getsize(output_path)
            compression_ratio = compressed_size / original_size if original_size > 0 else 0
            
            return {
                'success': True,
                'original_size': original_size,
                'compressed_size': compressed_size,
                'compression_ratio': compression_ratio,
                'output_path': output_path,
                'vq_loss': vq_loss.item(),
                'message': f'VQGAN compressed from {original_size} to {compressed_size} bytes ({compression_ratio:.2%} of original)'
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'message': f'VQGAN compression failed: {str(e)}'
            }
    
    def compress_image_bytes(self, image_bytes, format='JPEG'):
        """
        Compress image from bytes using VQGAN
        """
        if not self.model:
            return {
                'success': False,
                'error': 'VQGAN model not loaded'
            }
        
        try:
            # Load image from bytes
            img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            original_size = len(image_bytes)
            
            # Transform to tensor
            img_tensor = self.transform(img).unsqueeze(0).to(self.device)
            
            # Compress using VQGAN
            with torch.no_grad():
                recon_img, vq_loss, indices = self.model(img_tensor)
            
            # Convert back to PIL and then to bytes
            recon_pil = self.tensor_to_pil(recon_img[0])
            output = io.BytesIO()
            recon_pil.save(output, format=format, quality=95)
            compressed_bytes = output.getvalue()
            
            return {
                'success': True,
                'compressed_bytes': compressed_bytes,
                'original_size': original_size,
                'compressed_size': len(compressed_bytes),
                'vq_loss': vq_loss.item()
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }


# Create singleton instance
vqgan_service = VQGANCompressionService()
