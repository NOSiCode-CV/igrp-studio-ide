import SupportContent from '@renderer/components/support-content';
import { useEffect, useState } from 'react';

const Footer = () => {
    const [appVersion, setAppVersion] = useState('');

    useEffect(() => {
        // Fetch app version from Electron
        if (window.electron && window.electron.getAppVersion) {
            window.electron.getAppVersion().then((version) => {
                setAppVersion(version);
            });
        }
    }, []);

    return (
        <>
            <SupportContent />
            <p>
                {`${import.meta.env.VITE_APP_TITLE}`} &copy;{' '}
                {new Date().getFullYear()}
            </p>
            {appVersion && <p>{appVersion}</p>}
        </>
    );
};

export default Footer;
