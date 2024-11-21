import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import Select from 'react-select'

// Helper Component: TextInput
export const TextInput = ({ label, id, placeholder, value, onChange, onBlur, error }) => (
	<div className="space-y-2">
		<Label htmlFor={id} className="block text-sm font-medium text-gray-700">{label}</Label>
		<Input
			type="text"
			id={id}
			className={`block w-full px-3 py-1 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring focus:border-blue-300`}
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
		<label htmlFor={id} className="block text-sm font-medium text-gray-700">{label}</label>
		<Select
			id={id}
			options={options}
			value={value}
			onChange={onChange}
			classNamePrefix="select"
			className={`w-full text-sm ${error ? 'border-red-500' : 'border-gray-300'}`}
		/>
		{error && <p className="text-sm text-red-600">{error}</p>}
	</div>
)