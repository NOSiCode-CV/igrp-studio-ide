import Illustration from "@renderer/components/ilustration";
import { useTranslation } from "react-i18next";

const EmptyPage = ({ onClick }) => {

    const {t} = useTranslation();

    return (
        <div className="flex justify-center items-center w-full h-[calc(100vh-140px)] relative">
            <Illustration name="Empty" />
            <div className="absolute text-center mt-6">
                <div className="flex gap-4 mt-20">
                    <button
                        className="bg-[#008054] text-white px-4 py-2 rounded hover:bg-green-700"
                        onClick={() => onClick('models')}
                    >
                        {t('newObject', {name: t('Model')})}
                    </button>
                    <button
                        className="bg-[#008054] text-white px-4 py-2 rounded hover:bg-green-700"
                        onClick={() => onClick('controllers')}
                    >
                        {t('newObject', {name: t('Controller')})}
                    </button>
                    <button
                        className="bg-[#008054] text-white px-4 py-2 rounded hover:bg-green-700"
                        onClick={() => onClick('dto')}
                    >
                        {t('newObject', {name: t('dto')})}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EmptyPage;
