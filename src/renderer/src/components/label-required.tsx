import { Label } from './ui/label';

export const LabelRequired = ({ children }: { children: React.ReactNode }) => {
    return (
        <Label>
            {children}
            <span className="text-red-500"> *</span>
        </Label>
    );
};
