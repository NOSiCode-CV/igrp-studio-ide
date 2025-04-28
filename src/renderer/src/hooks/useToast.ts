import { toast } from 'sonner';

const MAX_LENGTH = 300;

const useToast = () => {
    const showSuccessToast = (message: string) => {
        toast.success(message);
    };

    const displayError = (message: string) => {
        if (message.length > MAX_LENGTH) {
            toast.error(`${message.substring(0, MAX_LENGTH)}[...]`);
        } else {
            toast.error(message);
        }
    };

    const formatValidationError = (error: any): string => {

		// Handle error with params.errors
        if (error?.params?.errors) {
            return formatValidationError(error.params.errors);
        }

        // Handle array of validation errors
        if (Array.isArray(error)) {
            return error.map(formatValidationError).join('\n\n');
        }

        // Handle individual validation error object
        if (error?.instancePath && error?.message) {
            const path = error.instancePath.replace(/\//g, ' ').trim() || 'root';
            return `${path}: ${error.message}`;
        }

        // Fallback to simple error message
        return error?.message || error?.toString() || 'An unknown error occurred';
    };

    const showErrorToast = (error: any) => {
        if (Array.isArray(error) && error.some(e => e.instancePath)) {
            // Handle validation error array
            const formattedErrors = formatValidationError(error);
            displayError(formattedErrors);
        } else if (error?.instancePath) {
            // Handle single validation error
            displayError(formatValidationError(error));
        } else {
            // Handle regular errors
            const errors = Array.isArray(error) ? error : [error];
            errors.forEach(err => {
                const errorMessage = err?.message || err?.toString() || 'An unknown error occurred';
                displayError(errorMessage);
            });
        }
    };

    const showWarningToast = (message: string) => {
        toast.warning(message);
    };

    return {
        showSuccessToast,
        showErrorToast,
        showWarningToast,
    };
};

export default useToast;