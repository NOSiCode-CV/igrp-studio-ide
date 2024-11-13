import dropComponentes from '@renderer/assets/images/layout/dropComponentes.svg'
export const GenNoInfoComp = () => {
    return (
        <div className="min-h-[55px] bg-no-repeat bg-center"
            style={{
                backgroundImage: `url(${dropComponentes})`,
                backgroundSize: '160px'
            }}>
        </ div>
    )
}