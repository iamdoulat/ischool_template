"use client";

import { Youtube } from "lucide-react";

const videos = [
    { id: 1, title: "Motivational Speech", thumbnail: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&q=80" },
    { id: 2, title: "ENVIRONMENTAL SCIENCE", thumbnail: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&q=80" },
    { id: 3, title: "The world of birds", thumbnail: "https://images.unsplash.com/photo-1444464666168-49b626424098?w=400&q=80" },
    { id: 4, title: "GK Quiz", thumbnail: "https://images.unsplash.com/photo-1456406644174-8ddd4cd52a06?w=400&q=80" },
    { id: 5, title: "Telling Time For Children", thumbnail: "https://images.unsplash.com/photo-1508013861974-9f6347163ebe?w=400&q=80" }
];

export default function UserVideoTutorialPage() {
    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans">
            <div className="bg-white rounded shadow-sm border border-gray-100 overflow-hidden">
                {/* Header */}
                <div className="border-b border-gray-100 p-4">
                    <h1 className="text-[15px] font-medium text-gray-700 tracking-tight">Video Tutorial List</h1>
                </div>

                <div className="p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {videos.map((video) => (
                            <div key={video.id} className="group border border-gray-200 rounded overflow-hidden bg-white hover:shadow-md transition-shadow cursor-pointer">
                                {/* Thumbnail Container */}
                                <div className="relative aspect-video bg-gray-100 overflow-hidden">
                                    <img 
                                        src={video.thumbnail} 
                                        alt={video.title} 
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                                    />
                                    
                                    {/* Top Right YouTube Badge */}
                                    <div className="absolute top-1.5 right-1.5 bg-white p-0.5 rounded border border-gray-200 shadow-sm">
                                        <Youtube className="h-3.5 w-3.5 text-gray-400" strokeWidth={2} />
                                    </div>
                                </div>
                                
                                {/* Title */}
                                <div className="p-2 border-t border-gray-100">
                                    <h3 className="text-center text-[11px] text-gray-600 truncate" title={video.title}>
                                        {video.title}
                                    </h3>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
