import Illustration from "@renderer/components/ilustration";

const EmptyPage = ({ onClick }) => {
    return (
        <div className="flex justify-center items-center w-full h-[calc(100vh-140px)] relative">
            <Illustration name="Empty" />
            <div className="absolute text-center mt-6">
                <div className="flex gap-4 mt-20">
                    <button
                        className="bg-[#008054] text-white px-4 py-2 rounded hover:bg-green-700"
                        onClick={() => onClick('models')}
                    >
                        New Model
                    </button>
                    <button
                        className="bg-[#008054] text-white px-4 py-2 rounded hover:bg-green-700"
                        onClick={() => onClick('controllers')}
                    >
                        New Controller
                    </button>
                    <button
                        className="bg-[#008054] text-white px-4 py-2 rounded hover:bg-green-700"
                        onClick={() => onClick('dto')}
                    >
                        New DTO
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EmptyPage;
