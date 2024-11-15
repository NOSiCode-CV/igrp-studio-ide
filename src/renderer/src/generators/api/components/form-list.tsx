import { FunctionComponent, useEffect, useState } from 'react'
import { ITabelContainer } from './Interfaces'
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@renderer/components/ui/table'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Plus, Trash } from 'lucide-react'
import { Checkbox } from '@renderer/components/ui/checkbox'
import { Combobox } from '@renderer/components/combobox'
import MultipleSelector from '@renderer/components/multiples-selector'
import { cn } from '@renderer/lib/utils'

export const FormList: FunctionComponent<ITabelContainer> = ({
	data,
	errors,
	changeValue,
	addRow,
	removeRow,
	columns,
	name
}) => {

	const [formData, setFormData] = useState(data || {});

	const [dynamicOptions, setDynamicOptions] = useState({});

	const updateDependentFields = (key, index, selectedValue) => {
		// Procura por colunas que dependem da chave atual
		const dependentColumn = columns.find(col => col.dependsOn === key);

		// Se houver uma coluna dependente e ela tiver uma função para obter opções
		if (dependentColumn && dependentColumn.getOptions) {
			// Obtém as opções atualizadas com base no valor selecionado
			const updatedOptions = dependentColumn.getOptions(selectedValue);

			// Atualiza as opções dinâmicas, se houve mudança
			if (JSON.stringify(dynamicOptions[`${index}-${dependentColumn.key}`]) !== JSON.stringify(updatedOptions)) {
				setDynamicOptions(prevOptions => ({
					...prevOptions,
					[`${index}-${dependentColumn.key}`]: updatedOptions,
				}));
			}

			// Atualiza o valor do campo dependente
			const newValue = updatedOptions.length ? updatedOptions[0].value : '';

			// Evitar atualização desnecessária
			if (formData[index][dependentColumn.key] !== newValue) {
				const updatedRow = {
					...formData[index],
					[dependentColumn.key]: newValue,
				};

				// Atualiza o estado do formData
				const newFormData = [...formData];
				newFormData[index] = updatedRow;
				setFormData(newFormData);
			}
		}
	};

	// Executa a atualização dos campos dependentes assim que os dados forem carregados
	useEffect(() => {
		if (formData && formData.length > 0)
			formData.forEach((row, index) => {
				// Verifica se a linha tem algum campo dependente
				columns.forEach(col => {
					if (col.dependsOn && row[col.dependsOn]) {
						// Atualiza os campos dependentes para cada chave
						updateDependentFields(col.dependsOn, index, row[col.dependsOn]);
					}
				});
			});
	}, [formData, columns]);

	// Função para atualizar as opções de um campo baseado em outro
	const handleDependentChange = (key, index, selectedValue) => {

		changeValue(key, index, selectedValue)

		// Verificar se o campo atual tem uma dependência para atualizar outro campo
		const dependentColumn = columns.find(col => col.dependsOn === key);
		if (dependentColumn && dependentColumn.getOptions) {
			const updatedOptions = dependentColumn.getOptions(selectedValue);

			setDynamicOptions((prevOptions) => ({
				...prevOptions,
				[`${index}-${dependentColumn.key}`]: updatedOptions,
			}));

		}
	};

	return (
		<Table>
			<TableHeader className="ps-4">
				<TableRow>
					{columns.map(({ name, width }, index) => (
						<TableHead
							style={{ width }}
							key={index}
						>
							{name}
						</TableHead>
					))}
					<TableHead style={{ width: "15px" }}>
						<div className="d-flex justify-content-end me-3">
							{removeRow ? 'Actions' : undefined}
						</div>
					</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{data.length > 0 && data.map((row: any, index: number) => (
					<TableRow key={index}>
						{columns.map(({ name, key, type, options }, index2) => {

							const selectValue = ['select'].includes(type) ?
								(dynamicOptions?.[`${index}-${key}`] || options)?.filter((d) => row[key] && d.value === row[key])[0]?.value
								: '';

							const selectMultiValues = ['multiSelect'].includes(type) ? options
								?.filter((d) => row[key]?.includes(d.value))
								.map((d) => d.value) : [];


							return (
								<TableCell key={index2}>
									{['text', 'number'].includes(type) && (
										<Input
											className={cn("text-sm", errors?.[index]?.[key] ? 'border-red-500' : '')}
											type={type}
											value={row?.[key] || ''}
											onChange={(ev) => changeValue(key, index, ev.target.value)}
										/>
									)}

									{['select'].includes(type) && (
										<Combobox
											key={`${index}-${index2}`}
											name={name}
											placeholder={`Select ${name}`}
											options={dynamicOptions[`${index}-${key}`] || options}
											value={selectValue}
											onChange={(selectedOption) => {
												handleDependentChange(key, index, selectedOption);
											}} />
									)}

									{['multiSelect'].includes(type) && (
										<MultipleSelector
											placeholder={`Select ${name}`}
											options={dynamicOptions[`${index}-${key}`] || options}
											value={selectMultiValues}
											onChange={(selectedOption) => {
												changeValue(
													key,
													index,
													selectedOption,
												);
											}}
										/>
									)}

									{['checkbox'].includes(type) && (
										<Checkbox
											id={`${key}_${index2}`}
											onCheckedChange={(checked) =>
												changeValue(key, index, checked)
											}
											checked={row?.[key] || false}
										/>
									)}

									{errors?.[index]?.[key] ? (
										<span className="text-red-500 text-xs -mt-1">
											{errors?.[index]?.[key]}
										</span>
									) : null}
								</TableCell>
							)
						})}
						{removeRow && (
							<TableCell>
								<Button
									variant="outline" size="icon" className="border-0 text-red-500"
									onClick={() => removeRow(index)}
								>
									<Trash />
								</Button>
							</TableCell>
						)}
					</TableRow>
				))}
			</TableBody>
			{addRow && (
				<TableFooter>
					<TableRow>
						<TableCell className="text-left">
							<Button
								variant={'outline'}
								onClick={addRow}
								className="text-capitalize"
							>
								<Plus />
								{`New ${name}`}
							</Button>
						</TableCell>
					</TableRow>
				</TableFooter>
			)}
		</Table>
	)
}
