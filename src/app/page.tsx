import CameraButton from './components/CameraButton';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Camera App
          </h1>
          <p className="text-gray-600">
            Tap the button below to open your mobile camera
          </p>
        </div>
        
        <CameraButton />
        
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            Make sure to allow camera permissions when prompted
          </p>
        </div>
      </div>
    </div>
  );
}
