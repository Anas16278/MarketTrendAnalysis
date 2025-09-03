import React from 'react';

const ContentLibraryPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Content Library</h1>
          <p className="text-gray-500">Your uploaded content will appear here.</p>
        </div>
      </div>
    </div>
  );
};

export default ContentLibraryPage;
