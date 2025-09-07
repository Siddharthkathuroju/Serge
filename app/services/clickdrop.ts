// ClickDrop API service for text removal
// Get your API key from: https://clickdrop.co/

const CLICKDROP_API_KEY = process.env.NEXT_PUBLIC_CLICKDROP_API_KEY || '';
const CLICKDROP_API_URL = 'https://api.clickdrop.co/api/v1';

export interface TextRemovalResponse {
  success: boolean;
  image_url?: string;
  error?: string;
  task_id?: string;
}

export interface TextRemovalStatus {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  image_url?: string;
  error?: string;
}

export class ClickDropService {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || CLICKDROP_API_KEY;
    if (!this.apiKey) {
      console.warn('ClickDrop API key not found. Please set NEXT_PUBLIC_CLICKDROP_API_KEY environment variable.');
    }
  }

  /**
   * Remove text from an image
   */
  async removeText(imageFile: File): Promise<TextRemovalResponse> {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'API key not configured'
      };
    }

    try {
      // Create form data
      const formData = new FormData();
      formData.append('image', imageFile);

      // Make API request
      const response = await fetch(`${CLICKDROP_API_URL}/remove-text`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        task_id: data.task_id,
        image_url: data.image_url
      };

    } catch (error) {
      console.error('ClickDrop API error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Check the status of a text removal task
   */
  async checkStatus(taskId: string): Promise<TextRemovalStatus> {
    if (!this.apiKey) {
      return {
        status: 'failed',
        error: 'API key not configured'
      };
    }

    try {
      const response = await fetch(`${CLICKDROP_API_URL}/task-status/${taskId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      return {
        status: data.status,
        image_url: data.image_url,
        error: data.error
      };

    } catch (error) {
      console.error('Status check error:', error);
      return {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Alternative method using direct image processing (if supported)
   */
  async removeTextDirect(imageFile: File): Promise<TextRemovalResponse> {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'API key not configured'
      };
    }

    try {
      // Convert image to base64 for direct processing
      const base64Image = await this.fileToBase64(imageFile);
      
      const response = await fetch(`${CLICKDROP_API_URL}/remove-text-direct`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: base64Image,
          format: 'base64'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        image_url: data.image_url
      };

    } catch (error) {
      console.error('Direct text removal error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Convert file to base64
   */
  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data:image/jpeg;base64, prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  }
}

// Export singleton instance
export const clickDropService = new ClickDropService(); 