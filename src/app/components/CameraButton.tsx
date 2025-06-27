'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function CameraButton() {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [cropArea, setCropArea] = useState<CropArea>({ x: 50, y: 50, width: 200, height: 150 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Effect to handle video element when stream changes
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      
      // Add event listeners for debugging
      videoRef.current.onloadedmetadata = () => {
        console.log('Video metadata loaded');
        setDebugInfo('Video loaded successfully');
      };
      
      videoRef.current.onplay = () => {
        console.log('Video started playing');
        setDebugInfo('Video is playing');
      };
      
      videoRef.current.onerror = (e) => {
        console.error('Video error:', e);
        setDebugInfo('Video error occurred');
      };
    }
  }, [stream]);

  const openCamera = async () => {
    setIsLoading(true);
    setError(null);
    setDebugInfo('Requesting camera access...');
    setCapturedImage(null);
    setCroppedImage(null);
    
    try {
      // Check if the browser supports getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported in this browser');
      }

      // Check if we're on HTTPS or localhost
      if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
        throw new Error('Camera access requires HTTPS. Please use https:// or localhost');
      }

      setDebugInfo('Getting user media...');
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      console.log('Media stream obtained:', mediaStream);
      setDebugInfo('Camera stream obtained');
      setStream(mediaStream);
      setIsCameraOpen(true);
      
    } catch (error: unknown) {
      console.error('Error accessing camera:', error);
      
      let errorMessage = 'Unable to access camera. ';
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage += 'Please allow camera permissions and refresh the page.';
        } else if (error.name === 'NotFoundError') {
          errorMessage += 'No camera found on this device.';
        } else if (error.name === 'NotSupportedError') {
          errorMessage += 'Camera access is not supported in this browser.';
        } else if (error.message) {
          errorMessage += error.message;
        } else {
          errorMessage += 'Please check your camera permissions and try again.';
        }
      } else {
        errorMessage += 'Please check your camera permissions and try again.';
      }
      
      setError(errorMessage);
      setDebugInfo('Camera access failed');
    } finally {
      setIsLoading(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (context) {
        // Set canvas size to match video dimensions
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Draw the video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert canvas to data URL
        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(imageDataUrl);
        setCroppedImage(null);
        setDebugInfo('Photo captured successfully!');
        
        console.log('Photo captured:', imageDataUrl.substring(0, 50) + '...');
      }
    }
  };

  const cropImage = () => {
    if (capturedImage && canvasRef.current) {
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      const img = document.createElement('img') as HTMLImageElement;
      
      img.onload = () => {
        if (context) {
          // Calculate scale factor between displayed image and actual image
          const displayWidth = 400; // max-w-md width
          const scaleX = img.width / displayWidth;
          const scaleY = img.height / (img.height * displayWidth / img.width);
          
          // Scale crop area to actual image dimensions
          const actualCropX = cropArea.x * scaleX;
          const actualCropY = cropArea.y * scaleY;
          const actualCropWidth = cropArea.width * scaleX;
          const actualCropHeight = cropArea.height * scaleY;
          
          // Set canvas to crop dimensions
          canvas.width = actualCropWidth;
          canvas.height = actualCropHeight;
          
          // Draw the cropped portion
          context.drawImage(
            img,
            actualCropX, actualCropY, actualCropWidth, actualCropHeight,
            0, 0, actualCropWidth, actualCropHeight
          );
          
          // Convert to data URL
          const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
          setCroppedImage(croppedDataUrl);
          setDebugInfo('Image cropped successfully!');
        }
      };
      
      img.src = capturedImage;
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!capturedImage) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Check if click is inside crop area
    if (x >= cropArea.x && x <= cropArea.x + cropArea.width &&
        y >= cropArea.y && y <= cropArea.y + cropArea.height) {
      setIsDragging(true);
      setDragStart({ x: x - cropArea.x, y: y - cropArea.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !capturedImage) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - dragStart.x;
    const y = e.clientY - rect.top - dragStart.y;
    
    // Constrain to image bounds
    const maxX = 400 - cropArea.width; // max-w-md width
    const maxY = (400 * (imageRef.current?.naturalHeight || 1) / (imageRef.current?.naturalWidth || 1)) - cropArea.height;
    
    setCropArea(prev => ({
      ...prev,
      x: Math.max(0, Math.min(x, maxX)),
      y: Math.max(0, Math.min(y, maxY))
    }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const closeCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => {
        console.log('Stopping track:', track.kind);
        track.stop();
      });
      setStream(null);
    }
    setIsCameraOpen(false);
    setError(null);
    setDebugInfo('');
    setCapturedImage(null);
    setCroppedImage(null);
  };

  const downloadPhoto = () => {
    if (capturedImage) {
      const link = document.createElement('a');
      link.download = `camera-photo-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.jpg`;
      link.href = capturedImage;
      link.click();
    }
  };

  const downloadCroppedPhoto = () => {
    if (croppedImage) {
      const link = document.createElement('a');
      link.download = `cropped-photo-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.jpg`;
      link.href = croppedImage;
      link.click();
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 w-full max-w-md">
          <div className="flex items-center gap-2 text-red-800">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">Camera Error</span>
          </div>
          <p className="text-red-700 text-sm mt-2">{error}</p>
          <button
            onClick={() => setError(null)}
            className="text-red-600 hover:text-red-800 text-sm mt-2 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {debugInfo && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 w-full max-w-md">
          <p className="text-blue-700 text-sm">Debug: {debugInfo}</p>
        </div>
      )}

      {!isCameraOpen ? (
        <button
          onClick={openCamera}
          disabled={isLoading}
          className={`font-bold py-3 px-6 rounded-lg shadow-lg transition-colors duration-200 flex items-center gap-2 ${
            isLoading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin w-6 h-6" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Opening Camera...
            </>
          ) : (
            <>
              <svg 
                className="w-6 h-6" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" 
                />
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" 
                />
              </svg>
              Open Camera
            </>
          )}
        </button>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full max-w-md rounded-lg shadow-lg border-2 border-gray-200"
              style={{ transform: 'scaleX(-1)' }} // Mirror the video
            />
            <div className="absolute top-2 right-2">
              <button
                onClick={closeCamera}
                className="bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-lg transition-colors duration-200"
              >
                <svg 
                  className="w-5 h-5" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M6 18L18 6M6 6l12 12" 
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Camera Controls */}
          <div className="flex gap-3">
            <button
              onClick={capturePhoto}
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg shadow-lg transition-colors duration-200 flex items-center gap-2"
            >
              <svg 
                className="w-5 h-5" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" 
                />
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" 
                />
              </svg>
              Take Photo
            </button>
          </div>

          {/* Captured Image Display with Crop Area */}
          {capturedImage && (
            <div className="flex flex-col items-center gap-3">
              <h3 className="text-lg font-semibold text-gray-800">Captured Photo</h3>
              <div className="relative">
                <div 
                  className="relative cursor-move"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                >
                  <Image
                    ref={imageRef}
                    src={capturedImage}
                    alt="Captured photo"
                    width={400}
                    height={300}
                    className="w-full max-w-md rounded-lg shadow-lg border-2 border-gray-200"
                    unoptimized
                  />
                  {/* Crop Rectangle */}
                  <div
                    className="absolute border-2 border-yellow-400 bg-yellow-400 bg-opacity-20 cursor-move"
                    style={{
                      left: cropArea.x,
                      top: cropArea.y,
                      width: cropArea.width,
                      height: cropArea.height,
                    }}
                  >
                    {/* Corner handles */}
                    <div className="absolute -top-1 -left-1 w-2 h-2 bg-yellow-400 rounded-full"></div>
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full"></div>
                    <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-yellow-400 rounded-full"></div>
                    <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full"></div>
                  </div>
                </div>
                <button
                  onClick={downloadPhoto}
                  className="absolute top-2 right-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-2 shadow-lg transition-colors duration-200"
                >
                  <svg 
                    className="w-4 h-4" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                    />
                  </svg>
                </button>
              </div>
              
              {/* Crop Button */}
              <button
                onClick={cropImage}
                className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded-lg shadow-lg transition-colors duration-200 flex items-center gap-2"
              >
                <svg 
                  className="w-5 h-5" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
                  />
                </svg>
                Crop Image
              </button>
              
              <p className="text-sm text-gray-600 text-center">
                Drag the yellow rectangle to select the area you want to crop.
              </p>
            </div>
          )}

          {/* Cropped Image Display */}
          {croppedImage && (
            <div className="flex flex-col items-center gap-3">
              <h3 className="text-lg font-semibold text-gray-800">Cropped Image</h3>
              <div className="relative">
                <Image
                  src={croppedImage}
                  alt="Cropped photo"
                  width={400}
                  height={300}
                  className="w-full max-w-md rounded-lg shadow-lg border-2 border-gray-200"
                  unoptimized
                />
                <button
                  onClick={downloadCroppedPhoto}
                  className="absolute top-2 right-2 bg-green-500 hover:bg-green-600 text-white rounded-full p-2 shadow-lg transition-colors duration-200"
                >
                  <svg 
                    className="w-4 h-4" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                    />
                  </svg>
                </button>
              </div>
              <p className="text-sm text-gray-600 text-center">
                Cropped image ready! Click the download button to save it.
              </p>
            </div>
          )}

          <p className="text-sm text-gray-600 text-center">
            Camera is active. Use the green button to take a photo.
          </p>
          {stream && (
            <div className="text-xs text-gray-500">
              Stream tracks: {stream.getTracks().map(track => track.kind).join(', ')}
            </div>
          )}
        </div>
      )}

      {/* Hidden canvas for photo capture and cropping */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
} 