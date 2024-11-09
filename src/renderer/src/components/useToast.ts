import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const useToast = () => {
	const showSuccessToast = (message: string) => {
		const toastId = toast.success(message, {
			position: "top-right",
			className: 'bg-success text-white',
			autoClose: 5000,
			hideProgressBar: false,
		});
		setTimeout(() => toast.dismiss(toastId), 5000);
	};

	const displayError = (message: string) => {
		const toastId = toast.error(message, {
			position: "top-right",
			className: 'bg-danger text-white',
			autoClose: 5000,
			hideProgressBar: false,
		});

		setTimeout(() => toast.dismiss(toastId), 5000);
	};

	const showErrorToast = (error: any) => {

		const errors = Array.isArray(error) ? error : [error];

		errors.forEach(err => {
			const errorMessage = err.message || err || 'An unknown error occurred';
			displayError(errorMessage);
		});

	};

	const showWarningToast = (message: string) => {
		const toastId = toast.warn(message, {
			position: "top-right",
			className: 'bg-warning text-dark',
			autoClose: 5000,
			hideProgressBar: false,
		});
		setTimeout(() => toast.dismiss(toastId), 5000);
	};

	return {
		showSuccessToast,
		showErrorToast,
		showWarningToast,
	};
};

export default useToast;
