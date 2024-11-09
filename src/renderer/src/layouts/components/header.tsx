import logo from '@renderer/assets/images/igrp-blue.svg'
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ConfigOptions, MenuItem } from "src/main/types";
import { ROUTES } from "@renderer/routes/routeConstants";
import { Code, Github, Grid, HelpCircle, Home, Maximize2, Minus, Settings, Square, X } from "lucide-react";

interface HeaderProps {
    config?: ConfigOptions,
    basePath?: string
}

const Header = ({ config, basePath }: HeaderProps): JSX.Element => {
    const navigate = useNavigate()

    const [isMaximized, setIsMaximized] = useState(false); // New state to track maximize status

    // Window control buttons
    const handleMinimize = () => {
        window.menu.minimizeWindow();
    };

    const handleMaximize = () => {
        window.menu.maximizeWindow();
        setIsMaximized(!isMaximized); // Toggle the state
    };

    const handleClose = () => {
        window.menu.closeWindow();
    };

    const openPage = () => {
        navigate(ROUTES.HOME);
    }

    const openVSCode = async () => {
        try {
            await window.api.openVSCode(basePath)
        } catch (error) {
            console.error('Error opening VS Code:', error);
        }
    };

    useEffect(() => {
        // Check if window is maximized on mount
        const checkMaximized = async () => {
            const maximized = window.menu.isMaximized();
            setIsMaximized(maximized);
        };
        checkMaximized();
    }, []);

    const menuItems: MenuItem[] = [
        {
            label: 'Apps',
            icon: <Grid className="h-4 w-4" />,
            click: (e) => {
                e.preventDefault()
                openVSCode?.()
            },
        },
        { label: 'GitHub', icon: <Github className="h-4 w-4" /> },
        { label: 'Settings', icon: <Settings className="h-4 w-4" /> },
        { label: 'Help', icon: <HelpCircle className="h-4 w-4" /> },
    ]

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-10 items-center justify-between px-4">
                <div className="flex items-center space-x-2 home cursor-pointer" onClick={openPage}>
                    <img src={logo} alt="Logo" className="h-6 w-auto" />
                    <p className="text-sm font-medium">IGRP Studio</p>
                </div>
                <div className="flex items-center space-x-2">
                    {config?.name && <button
                        onClick={openVSCode}
                        className="flex items-center justify-center w-6 h-6 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300"
                        title="Open VS Code"
                    >
                        <Code className="h-4 w-4" />
                        <span className="sr-only">Open VS Code</span>
                    </button>}
                    {menuItems.map((item, index) => (
                        <button
                            key={index}
                            onClick={item.click}
                            className="flex items-center justify-center px-2 h-8 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300"
                            title={item.label}
                        >
                            {item.icon}
                            <span className="sr-only">{item.label}</span>
                        </button>
                    ))}
                    <button
                        onClick={handleMinimize}
                        className="flex items-center justify-center w-6 h-6 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300"
                    >
                        <Minus className="h-4 w-4" />
                        <span className="sr-only">Minimize</span>
                    </button>
                    <button
                        onClick={handleMaximize}
                        className="flex items-center justify-center w-6 h-6 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300"
                    >
                        {isMaximized ? <Square className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                        <span className="sr-only">{isMaximized ? "Restore" : "Maximize"}</span>
                    </button>
                    <button
                        onClick={handleClose}
                        className="flex items-center justify-center w-6 h-6 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300"
                    >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Close</span>
                    </button>
                </div>
            </div>
        </header>
    )

    /*     return (
            <header id="page-topbar" >
                <div className="layout-width">
                    <Navbar expand="md" className="navbar-header">
                        <NavbarBrand href={ROUTES.HOME}>
                            <div className="d-flex align-items-center gap-3">
                                {config?.name && <i className='ri ri-home-3-line fs-4' />}
                                <img src={logo} alt="Logo" height={20} />
                                <h6 className="mt-3 text-truncate" style={{ maxWidth: '150px' }}>{config?.name}</h6>
                            </div>
                        </NavbarBrand>
    
                        <NavbarToggler onClick={toggleNavbar} ><i className="ri ri-menu-2-line" /></NavbarToggler>
                        <Collapse isOpen={isOpen} navbar className="justify-content-end">
                            <Nav className="ml-auto" navbar>
    
                                {config?.name &&
                                    <NavItem >
                                        <NavLink className="fs-5 btn-topbar text-center" color="primary" title="Open VS Code" onClick={openVSCode} style={{ cursor: 'pointer' }}>
                                            <i className="bx bxl-visual-studio" />
                                        </NavLink>
                                    </NavItem>
                                }
    
                                {menuItems.map((item, index) => (
                                    <NavItem key={index}>
                                        <NavLink href="#" className="btn-topbar fs-5 text-center" title={item?.label}>
                                            {item?.icon ?? item?.label}
                                        </NavLink>
                                    </NavItem>
                                ))}
    
                            </Nav>
                        </Collapse>
                        <Nav className="ml-auto" navbar>
                            <NavItem >
                                <NavLink onClick={handleMinimize} className="btn-icon fs-5 btn-topbar cursor-pointer">
                                    <i className="ri ri-subtract-fill" /> 
                                </NavLink>
                            </NavItem>
                            <NavItem >
                                <NavLink onClick={handleMaximize} className="btn-icon fs-5 btn-topbar cursor-pointer">
                                    {isMaximized ? (
                                        <i className="RI ri-checkbox-blank-line" /> 
                                    ) : (
                                        <i className="ri ri-checkbox-multiple-blank-line" /> // Maximize icon
                                    )}
                                </NavLink>
                            </NavItem>
                            <NavItem >
                                <NavLink onClick={handleClose} className="btn-icon quit fs-4 btn-topbar cursor-pointer">
                                    <i className="ri ri-close-fill" /> 
                                </NavLink>
                            </NavItem>
                        </Nav>
                    </Navbar>
                </div>
            </header >
        ) */
}

export default Header;
