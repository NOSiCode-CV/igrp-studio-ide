import SupportContent from '@renderer/components/support-content';

const FooterSidebar = () => {

    return (
        <>
            <SupportContent />
            <p>
                {`${import.meta.env.VITE_APP_TITLE}`} &copy;{' '}
                {new Date().getFullYear()}
            </p>
        </>
    );
};

export default FooterSidebar;
