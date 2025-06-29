import CameraButton from './components/CameraButton';
import Link from 'next/link';

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
          <p className="text-xs text-gray-500 mb-4">
            Make sure to allow camera permissions when prompted
          </p>
          
          <Link
            href="/list"
            className="inline-block bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-colors duration-200"
          >
            Next Page
          </Link>
        </div>
      </div>
    </div>
  );
}
