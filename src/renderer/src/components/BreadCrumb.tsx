import React from 'react';
import { useNavigate } from 'react-router-dom';

interface BreadCrumbProps {
    title: string;
    children?: React.ReactNode;
    hiddenBack?: boolean;
}

const BreadCrumb = (props: BreadCrumbProps): JSX.Element => {
    const navigate = useNavigate();
    return (
        <div className="flex flex-wrap">
            <div className="w-full">
                <div className="flex items-center justify-between py-4">
                    <div className="flex items-center">
                        {!props.hiddenBack && (
                            <button
                                className="btn bg-gray-100 hover:bg-gray-200 rounded-full p-2 mr-3"
                                onClick={() => navigate(-1)}
                            >
                                <i className="ri-arrow-left-s-line text-gray-600"></i>
                            </button>
                        )}
                        <h4 className="text-lg font-semibold">{props.title}</h4>
                    </div>
                    <div className="page-title-right">
                        {props.children}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BreadCrumb;
