export const ProgressDisplay = ({ scanProgress }) => {
    return (
        <div className="py-12">
        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
            <div
                className="bg-blue-600 h-2.5 rounded-full transition-all"
                style={{
                    width: `${(scanProgress.progress / scanProgress.total) * 100}%`,
                }}
            />
        </div>
        <p className="text-sm text-gray-600">
            Scanning repositories ({scanProgress.progress} of {scanProgress.total})
        </p>
    </div>
    );
  }