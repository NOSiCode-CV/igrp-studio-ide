const GenNoInfoField = () => {
    return (
        <div className="text-xs space-x-1 min-h-12 flex items-center justify-center pointer-events-none">
            <span>DROP</span>
            <span className="text-primary">
                <b>FIELDS</b>
            </span>
            <span>or</span>
            <span className="text-primary">
                <b>COPY</b>
            </span>
        </div>
    )
}

export default GenNoInfoField
