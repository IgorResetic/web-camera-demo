'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface ListItem {
  id: string;
  type: 'text' | 'multiline' | 'image' | 'video';
  content: string;
  title?: string;
  description?: string;
}

export default function ListPage() {
  const [items, setItems] = useState<ListItem[]>([
    {
      id: '1',
      type: 'text',
      content: 'This is a simple single line text item',
      title: 'Simple Text Item'
    },
    {
      id: '2',
      type: 'multiline',
      content: 'This is a multi-line text item that contains more detailed information. It can span across multiple lines and provide a longer description of something important.',
      title: 'Multi-line Text Item',
      description: 'A detailed description that goes on multiple lines'
    },
    {
      id: '3',
      type: 'image',
      content: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
      title: 'Mountain Landscape',
      description: 'Beautiful mountain landscape with snow peaks'
    },
    {
      id: '4',
      type: 'video',
      content: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      title: 'Sample Video',
      description: 'Big Buck Bunny sample video'
    },
    {
      id: '5',
      type: 'text',
      content: 'Another simple text item for the list',
      title: 'Another Text Item'
    },
    {
      id: '6',
      type: 'image',
      content: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop',
      title: 'Forest Scene',
      description: 'Peaceful forest with tall trees'
    },
    {
      id: '7',
      type: 'multiline',
      content: 'This is another multi-line item that demonstrates how the list can handle different types of content. It shows that the drag and drop functionality works with various item sizes and formats.',
      title: 'Another Multi-line Item',
      description: 'Demonstrating different content types'
    },
    {
      id: '8',
      type: 'video',
      content: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      title: 'Elephants Dream',
      description: 'Animated short film sample'
    }
  ]);

  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [draggedElement, setDraggedElement] = useState<HTMLElement | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Effect to handle body scrolling when dragging
  useEffect(() => {
    if (isDragging) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [isDragging]);

  const handleTouchStart = (e: React.TouchEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();

    const touch = e.touches[0];
    const element = e.currentTarget as HTMLElement;
    const rect = element.getBoundingClientRect();

    setDraggedItem(id);
    setIsDragging(true);
    setDraggedElement(element);
    setDragOffset({
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    });
    setDragPosition({
      x: touch.clientX,
      y: touch.clientY
    });

    // Add dragging class
    element.style.position = 'fixed';
    element.style.zIndex = '1000';
    element.style.pointerEvents = 'none';
    element.style.transform = 'rotate(5deg) scale(1.05)';
    element.style.boxShadow = '0 10px 30px rgba(0,0,0,0.3)';
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;

    e.preventDefault();
    e.stopPropagation();

    const touch = e.touches[0];
    setDragPosition({
      x: touch.clientX,
      y: touch.clientY
    });

    if (draggedElement) {
      draggedElement.style.left = `${touch.clientX - dragOffset.x}px`;
      draggedElement.style.top = `${touch.clientY - dragOffset.y}px`;
    }

    // Find the element under the touch
    const touchY = touch.clientY;
    const listItems = listRef.current?.children;
    
    if (listItems) {
      for (let i = 0; i < listItems.length; i++) {
        const item = listItems[i] as HTMLElement;
        const rect = item.getBoundingClientRect();
        
        if (touchY >= rect.top && touchY <= rect.bottom) {
          const itemId = item.getAttribute('data-id');
          if (itemId && itemId !== draggedItem) {
            // Highlight potential drop zone
            item.style.backgroundColor = '#f0f9ff';
            item.style.border = '2px dashed #3b82f6';
          }
        } else {
          // Remove highlight
          item.style.backgroundColor = '';
          item.style.border = '';
        }
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isDragging || !draggedItem) return;

    e.preventDefault();
    e.stopPropagation();

    // Find the drop target
    const touchY = e.changedTouches[0].clientY;
    const listItems = listRef.current?.children;
    let dropTargetId = null;
    
    if (listItems) {
      for (let i = 0; i < listItems.length; i++) {
        const item = listItems[i] as HTMLElement;
        const rect = item.getBoundingClientRect();
        
        if (touchY >= rect.top && touchY <= rect.bottom) {
          dropTargetId = item.getAttribute('data-id');
          break;
        }
      }
    }

    // Reset dragged element styles
    if (draggedElement) {
      draggedElement.style.position = '';
      draggedElement.style.zIndex = '';
      draggedElement.style.pointerEvents = '';
      draggedElement.style.transform = '';
      draggedElement.style.boxShadow = '';
      draggedElement.style.left = '';
      draggedElement.style.top = '';
    }

    // Remove highlights
    if (listItems) {
      for (let i = 0; i < listItems.length; i++) {
        const item = listItems[i] as HTMLElement;
        item.style.backgroundColor = '';
        item.style.border = '';
      }
    }

    // Perform reorder if drop target found
    if (dropTargetId && dropTargetId !== draggedItem) {
      const draggedIndex = items.findIndex(item => item.id === draggedItem);
      const targetIndex = items.findIndex(item => item.id === dropTargetId);

      if (draggedIndex !== -1 && targetIndex !== -1) {
        const newItems = [...items];
        const [draggedItemData] = newItems.splice(draggedIndex, 1);
        newItems.splice(targetIndex, 0, draggedItemData);
        setItems(newItems);
      }
    }

    setDraggedItem(null);
    setIsDragging(false);
    setDraggedElement(null);
  };

  // Desktop drag and drop handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedItem(id);
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    
    if (!draggedItem || draggedItem === targetId) return;

    const draggedIndex = items.findIndex(item => item.id === draggedItem);
    const targetIndex = items.findIndex(item => item.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newItems = [...items];
    const [draggedItemData] = newItems.splice(draggedIndex, 1);
    newItems.splice(targetIndex, 0, draggedItemData);

    setItems(newItems);
    setDraggedItem(null);
    setIsDragging(false);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setIsDragging(false);
  };

  const renderItem = (item: ListItem) => {
    switch (item.type) {
      case 'text':
        return (
          <div className="p-4 bg-white rounded-lg shadow-md border border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-2">{item.title}</h3>
            <p className="text-gray-600">{item.content}</p>
          </div>
        );

      case 'multiline':
        return (
          <div className="p-4 bg-white rounded-lg shadow-md border border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-2">{item.title}</h3>
            <p className="text-gray-600 mb-2">{item.description}</p>
            <p className="text-gray-700 leading-relaxed">{item.content}</p>
          </div>
        );

      case 'image':
        return (
          <div className="p-4 bg-white rounded-lg shadow-md border border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-2">{item.title}</h3>
            <p className="text-gray-600 mb-3">{item.description}</p>
            <div className="relative w-full h-48 rounded-lg overflow-hidden">
              <Image
                src={item.content}
                alt={item.title || 'Image'}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          </div>
        );

      case 'video':
        return (
          <div className="p-4 bg-white rounded-lg shadow-md border border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-2">{item.title}</h3>
            <p className="text-gray-600 mb-3">{item.description}</p>
            <video
              controls
              className="w-full h-48 rounded-lg object-cover"
              preload="metadata"
            >
              <source src={item.content} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-800">Draggable List</h1>
            <Link
              href="/"
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
            >
              ← Back to Camera
            </Link>
          </div>
          <p className="text-gray-600">
            Touch and hold any item, then drag to reorder the list. Works great on mobile!
          </p>
        </div>

        {/* List */}
        <div ref={listRef} className="space-y-4">
          {items.map((item, index) => (
            <div
              key={item.id}
              data-id={item.id}
              draggable
              onDragStart={(e) => handleDragStart(e, item.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, item.id)}
              onDragEnd={handleDragEnd}
              onTouchStart={(e) => handleTouchStart(e, item.id)}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              style={{ touchAction: 'none' }}
              className={`transition-all duration-200 select-none cursor-move ${
                draggedItem === item.id ? 'opacity-50' : 'hover:scale-[1.02]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-bold">
                  {index + 1}
                </div>
                <div className="flex-1">
                  {renderItem(item)}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Instructions */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-blue-800 mb-2">How to use:</h3>
          <ul className="text-blue-700 text-sm space-y-1">
            <li>• <strong>Mobile:</strong> Touch and hold any item, then drag to reorder</li>
            <li>• <strong>Desktop:</strong> Click and drag any item to move it</li>
            <li>• The list contains different types of content: text, multi-line text, images, and videos</li>
            <li>• Items will show visual feedback when being dragged</li>
            <li>• Drop zones will be highlighted when dragging over them</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 