import React from 'react';

interface LoaderProps {
    error?: string;
}

const Loader: React.FC<LoaderProps> = () => {
    return (
        <div className="flex justify-center items-center h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 border-solid"></div>
        </div>
    );
};

export default Loader;
