import { Combobox } from '@igrp/igrp-design-system'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'

// Helper Component: TextInput
export const TextInput = ({ label, id, placeholder, value, onChange, onBlur, error }) => (
	<div className="space-y-2">
		<Label htmlFor={id} className="">{label}</Label>
		<Input
			type="text"
			id={id}
			className={`block w-full  ${error ? 'border-red-500' : ''}`}
			placeholder={placeholder}
			value={value}
			onChange={onChange}
			onBlur={onBlur}
		/>
		{error && <p className="text-sm text-red-600">{error}</p>}
	</div>
)

// Helper Component: SelectInput
export const SelectInput = ({ label, id, options, value, onChange, error }) => (
	<div className="space-y-2">
		<Label htmlFor={id} className="block text-sm">{label}</Label>
		<Combobox
			name={id}
			options={options}
			value={value}
			onChange={onChange}
			placeholder={`Select ${label}`}
			className={`w-full ${error ? 'border-red-500' : ''}`}
		/>
		{error && <p className="text-sm text-red-600">{error}</p>}
	</div>
)