interface StepButtonProps {
    step: number;
    currentStep: number;
    onClick: () => void;
    disabled?: boolean;
    children: React.ReactNode;
}

export function StepButton({
    step,
    currentStep,
    onClick,
    disabled,
    children,
}: StepButtonProps) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`
          flex flex-col items-center gap-2 group disabled:opacity-50
          ${currentStep === step ? 'text-primary' : 'text-muted-foreground'}
          ${currentStep > step ? 'text-primary/70' : ''}
        `}
        >
            <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 bg-background z-50
                ${currentStep === step ? 'border-primary' : 'border-muted'}
                ${currentStep > step ? 'bg-primary text-primary-foreground border-primary' : ''}
              `}
            >
                {currentStep > step ? '✓' : step}
            </div>
            <span className="text-sm font-medium">{children}</span>
        </button>
    );
}
