import Illustration from "@renderer/components/Ilustration";

const EmptyPage = ({ onClick }) => {
    return (
        <div className="flex justify-center items-center w-full h-[calc(100vh-140px)] relative">
            <Illustration name="Empty" />
            <div className="absolute text-center">
                <h3 className="text-2xl text-green-800 mb-4">Your Page is empty</h3>
                <div className="flex gap-4 mt-20">
                    <button
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                        onClick={() => onClick('models')}
                    >
                        New Model
                    </button>
                    <button
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                        onClick={() => onClick('controllers')}
                    >
                        New Controller
                    </button>
                    <button
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
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
