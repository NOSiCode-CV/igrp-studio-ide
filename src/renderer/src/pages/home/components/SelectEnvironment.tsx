import { useTranslation } from 'react-i18next';
import Next from '@renderer/assets/images/Next.svg';
import Spring from '@renderer/assets/images/Spring.svg';
import { ENV_TYPES } from '@renderer/constants/appConstants';
import GoBack from '@renderer/components/go-back';

interface SelectEnvironmentProps {
	onEnvironmentCardClick?: (type: string) => void;
	onBackButtomClick?: () => void;
}

const SelectEnvironment = ({
	onEnvironmentCardClick = (): void => { },
	onBackButtomClick = (): void => { }
}: SelectEnvironmentProps): JSX.Element => {
	const { t } = useTranslation();

	const handleBackClick = () => {
		onBackButtomClick();
	};

	const environmentCards = [
		{
			title: 'Next.js Environment',
			description: 'Front-end Generator UI',
			image: Next,
			onClick: () => onEnvironmentCardClick(ENV_TYPES.NEXTJS),
			hoverStyles: 'hover:bg-black group-hover:text-white'
		},
		{
			title: 'Spring Environment',
			description: 'API Generator UI',
			image: Spring,
			onClick: () => onEnvironmentCardClick(ENV_TYPES.SPRING),
			hoverStyles: 'hover:bg-[#6DB33F] group-hover:text-white'
		}
	];

	return (
		<div className="space-y-6">
			<div className="flex items-center">
				<GoBack handleBackClick={handleBackClick} />
				<h2 className="text-2xl font-bold">{t('selectEnvironment')}</h2>
			</div>

			<div className="grid grid-cols-2 gap-4">
				{environmentCards.map((card, index) => (
					<div
						key={index}
						className={`bg-gray-100 rounded-lg p-6 flex flex-col items-center cursor-pointer transition duration-300 ease-in-out group ${card.hoverStyles}`}
						onClick={card.onClick}
					>
						{/* Image container with color logic */}
						<div className={`mb-4 relative h-[74px] w-[74px] overflow-hidden rounded-full ${card.title.includes('Spring') ? 'bg-[#6DB33F] group-hover:bg-[#579031]' : 'bg-[#1F1F1F] group-hover:bg-[#1F1F1F]'} `}>
							<img
								src={card.image}
								alt={card.title}
								className="absolute w-10 h-10 left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2"
							/>
						</div>

						{/* Title and Description */}
						<h4 className="text-2xl font-bold text-gray-800 group-hover:text-white">{card.title}</h4>
						<p className="text-xl text-gray-500 group-hover:text-white">{card.description}</p>
					</div>
				))}
			</div>
		</div>
	);
};

export default SelectEnvironment;
