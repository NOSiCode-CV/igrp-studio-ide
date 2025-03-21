import { toast } from 'sonner';

const useToast = () => {
	const showSuccessToast = (message: string) => {
		toast.success(message)
	};

	const displayError = (message: string) => {
		toast.error(message)
	};

	const showErrorToast = (error: any) => {

		const errors = Array.isArray(error) ? error : [error];

		errors.forEach(err => {
			const errorMessage = err?.message || err || 'An unknown error occurred';
			displayError(errorMessage);
		});

	};

	const showWarningToast = (message: string) => {
		toast.warning(message)
	};

	return {
		showSuccessToast,
		showErrorToast,
		showWarningToast,
	};
};

export default useToast;
