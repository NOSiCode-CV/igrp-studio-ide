import React from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface LoaderProps {
    error?: string;
}

const Loader: React.FC<LoaderProps> = ({ error }) => {
    return (
        <div className="flex justify-center items-center h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 border-solid"></div>
            {error && toast.error(error, {
                position: "top-right",
                hideProgressBar: false,
                progress: undefined,
                toastId: ""
            })}
        </div>
    );
};

export default Loader;
