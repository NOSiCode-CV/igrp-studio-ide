import { toast } from 'sonner';

const MAX_LENGTH = 300;

const useToast = () => {
	const showSuccessToast = (message: string) => {
		toast.success(message)
	};

	const displayError = (message: string) => {
		if (message.length > MAX_LENGTH)
			toast.error(`${message.substring(0, MAX_LENGTH)}[...]`)
		else
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
