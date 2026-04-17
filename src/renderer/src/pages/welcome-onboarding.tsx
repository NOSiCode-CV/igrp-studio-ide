import { IGRPCopyTo } from '@igrp/igrp-framework-react-design-system'
import logo from '@renderer/assets/images/igrp-green.svg'
import Doctor from '@renderer/components/doctor'
import Loader from '@renderer/components/loader'
import { useWorkspace } from '@renderer/hooks/use-workspace'
import CreateWorkspace from '@renderer/pages/workspaces/components/create-workspace'
import { ROUTES } from '@renderer/routes/routeConstants'
import {
    ArrowRight,
    ChevronLeft,
    ChevronRight,
    Database,
    Sparkles,
    Stethoscope,
    Terminal,
    Zap
} from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { type ReactNode, useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

interface Slide {
    id: number
    title: string
    description: string
    icon: ReactNode
    color: string
    image: string
}

const slides: Slide[] = [
    {
        id: 1,
        title: 'Welcome to IGRP Studio',
        description:
            'The professional IDE for the IGRP Framework. Build, manage, and deploy enterprise applications with an integrated visual environment.',
        icon: <Zap className="w-8 h-8 text-white" />,
        color: 'from-indigo-500 to-blue-600',
        image: 'https://picsum.photos/seed/igrp-studio-welcome/800/600'
    },
    {
        id: 2,
        title: 'AI-Powered Code Generation',
        description:
            'Harness the power of IGRP-AI to generate code snippets, optimize queries, and accelerate your development cycle with intelligent assistance.',
        icon: <Sparkles className="w-8 h-8 text-amber-500" />,
        color: 'from-amber-500 to-orange-600',
        image: 'https://picsum.photos/seed/igrp-ai/800/600'
    },
    {
        id: 3,
        title: 'Visual Logic Designer',
        description:
            "Design your application's business logic and workflows visually. Connect components and define behaviors without writing complex code.",
        icon: <Sparkles className="w-8 h-8 text-white" />,
        color: 'from-indigo-500 to-blue-600',
        image: 'https://picsum.photos/seed/igrp-logic/800/600'
    },
    {
        id: 4,
        title: 'Integrated Development',
        description:
            'A complete ecosystem that combines visual tools with the power of Java and Spring Boot for robust enterprise solutions.',
        icon: <Database className="w-8 h-8 text-white" />,
        color: 'from-slate-700 to-slate-900',
        image: 'https://picsum.photos/seed/igrp-dev/800/600'
    },
    {
        id: 5,
        title: 'Prepare your environment',
        description:
            'Run Doctor to validate your local setup and install @igrp/cli to start projects and open Studio directly from the terminal.',
        icon: <Stethoscope className="w-8 h-8 text-white" />,
        color: 'from-emerald-500 to-teal-600',
        image: 'https://picsum.photos/seed/igrp-doctor-cli/800/600'
    }
]

export default function WelcomeSwipe() {
    const navigate = useNavigate()
    const {
        workspace,
        loading: workspacesLoading,
        actions: { getWorkspaces }
    } = useWorkspace()
    const [welcomeReady, setWelcomeReady] = useState(false)
    const [currentSlide, setCurrentSlide] = useState(0)
    const [direction, setDirection] = useState(0)
    const [isCreateWorkspaceOpen, setIsCreateWorkspaceOpen] = useState(false)
    const [isDoctorOpen, setIsDoctorOpen] = useState(false)
    const aiCodeLineWidths = [92, 78, 86, 70]
    const isSetupSlide = slides[currentSlide].title === 'Prepare your environment'

    const goToApplicationsHome = useCallback(() => {
        navigate(ROUTES.PATH_IDE_INITIAL_SCREEN, { replace: true })
    }, [navigate])

    useEffect(() => {
        if (workspacesLoading) {
            return
        }
        let cancelled = false
        void (async () => {
            try {
                const completed = await window.igrpStudioSettings.getWelcomeOnboardingCompleted()
                if (cancelled) return
                // Do not skip welcome just because workspaces exist — only after explicit completion in settings
                if (completed === true) {
                    goToApplicationsHome()
                    return
                }
                setWelcomeReady(true)
            } catch {
                if (!cancelled) {
                    setWelcomeReady(true)
                }
            }
        })()
        return () => {
            cancelled = true
        }
    }, [workspacesLoading, goToApplicationsHome])

    const handleLaunchStudio = useCallback(async () => {
        const list = await getWorkspaces()
        if (list.length > 0 || workspace) {
            await window.igrpStudioSettings.setWelcomeOnboardingCompleted(true)
            goToApplicationsHome()
            return
        }
        await window.igrpStudioSettings.setWelcomeOnboardingCompleted(true)
        setIsCreateWorkspaceOpen(true)
    }, [getWorkspaces, workspace, goToApplicationsHome])

    const nextSlide = () => {
        if (currentSlide < slides.length - 1) {
            setDirection(1)
            setCurrentSlide((prev) => prev + 1)
        }
    }

    const prevSlide = () => {
        if (currentSlide > 0) {
            setDirection(-1)
            setCurrentSlide((prev) => prev - 1)
        }
    }

    if (!welcomeReady) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader variant="fullscreen" className="h-screen w-full" />
            </div>
        )
    }

    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 500 : -500,
            opacity: 0
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1
        },
        exit: (direction: number) => ({
            zIndex: 0,
            x: direction < 0 ? 500 : -500,
            opacity: 0
        })
    }

    return (
        <div className="relative w-full h-screen overflow-hidden bg-background flex items-center justify-center font-sans">
            {/* Background Pattern */}
            <div
                className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                    backgroundImage: 'radial-gradient(hsl(var(--primary)) 1px, transparent 1px)',
                    backgroundSize: '32px 32px'
                }}
            />

            <div className="relative w-full max-w-5xl h-[676px] mx-auto bg-card rounded-[32px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.08)] flex overflow-hidden">
                {/* Left Side: Content */}
                <div className="flex-1 p-16 flex flex-col relative">
                    {/* Header/Logo */}
                    <div className="flex items-center gap-2 mb-12">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center border">
                            <img src={logo} alt="IGRP Studio" className="h-5 w-auto" />
                        </div>
                        <span className="text-foreground font-bold text-base tracking-tight">
                            IGRP Studio
                        </span>
                    </div>

                    <div className="flex-1 relative">
                        <AnimatePresence initial={false} custom={direction} mode="wait">
                            <motion.div
                                key={currentSlide}
                                custom={direction}
                                variants={variants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{
                                    x: { type: 'spring', stiffness: 300, damping: 30 },
                                    opacity: { duration: 0.2 }
                                }}
                                className="absolute inset-0 flex flex-col justify-center"
                            >
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-primary/10 mb-6 w-fit"
                                >
                                    <span className="text-primary text-[10px] font-bold uppercase tracking-wider">
                                        Studio IDE
                                    </span>
                                </motion.div>

                                <motion.h1
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className="text-4xl lg:text-5xl font-extrabold text-foreground leading-[1.1] tracking-tight mb-6"
                                >
                                    {slides[currentSlide].title}
                                </motion.h1>

                                <motion.p
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="text-lg text-muted-foreground leading-relaxed mb-8"
                                >
                                    {slides[currentSlide].description}
                                </motion.p>

                                <div className="flex items-center gap-4">
                                    {isSetupSlide ? (
                                        <div className="flex items-center gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setIsDoctorOpen(true)}
                                                className="px-6 py-3 bg-slate-50 border border-slate-200 text-ink rounded-xl font-semibold flex items-center gap-2 hover:bg-slate-100 transition-colors"
                                            >
                                                Run Doctor
                                                <Stethoscope className="w-4 h-4" />
                                            </button>
                                            <motion.button
                                                type="button"
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => void handleLaunchStudio()}
                                                className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-emerald-600/20"
                                            >
                                                Launch Studio
                                                <ArrowRight className="w-4 h-4" />
                                            </motion.button>
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={nextSlide}
                                            className="px-8 py-3.5 bg-primary text-primary-foreground rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity"
                                        >
                                            Next Feature
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    )}
                                    <a
                                        href="https://igrp.cv/en"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-muted-foreground font-semibold hover:text-foreground transition-colors text-sm"
                                    >
                                        Visit Website
                                    </a>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Pagination Dots */}
                    <div className="flex gap-2 mt-auto">
                        {slides.map((slide, idx) => (
                            <button
                                type="button"
                                key={slide.id}
                                onClick={() => {
                                    setDirection(idx > currentSlide ? 1 : -1)
                                    setCurrentSlide(idx)
                                }}
                                className={`h-2 rounded-full transition-all duration-300 ${idx === currentSlide
                                        ? 'w-6 bg-primary'
                                        : 'w-2 bg-muted hover:bg-muted-foreground/30'
                                    }`}
                            />
                        ))}
                    </div>
                </div>

                {/* Right Side: Visual */}
                <div className="flex-[1.2] bg-muted/30 border-l border-border flex items-center justify-center p-12 relative overflow-hidden">
                    {/* Mockup Container with Parallax Effect */}
                    <motion.div
                        key={`mockup-${currentSlide}`}
                        initial={{ opacity: 0, scale: 0.9, y: 20, rotateY: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0, rotateY: 0 }}
                        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                        className="w-full h-full bg-card rounded-xl border border-border shadow-[0_10px_30px_rgba(0,0,0,0.05)] p-6 flex flex-col gap-4 relative z-10 perspective-1000"
                    >
                        <div className="h-3 w-1/3 bg-muted rounded-full" />
                        <div className="flex-1 flex gap-4">
                            <div className="w-1/4 bg-muted/60 rounded-lg border border-border" />
                            <div className="flex-1 rounded-lg border border-dashed border-border flex items-center justify-center bg-muted/40 overflow-hidden">
                                {isSetupSlide ? (
                                    <div className="flex flex-col h-full w-full p-4 gap-4">
                                        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                                            <Terminal className="w-4 h-4 text-slate-400" />
                                            <span className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">
                                                IGRP CLI
                                            </span>
                                            <IGRPCopyTo value="npm install -g @igrp/cli --registry=https://sonatype.nosi.cv/repository/igrp-group/" />
                                        </div>
                                        <div className="flex-1 bg-slate-50 rounded-lg p-4 font-mono text-[10px] text-slate-600 leading-relaxed border border-slate-100">
                                            <span className="text-emerald-600">npm</span> install -g
                                            @igrp/cli
                                            --registry=https://sonatype.nosi.cv/repository/igrp-group/
                                        </div>
                                        <div className="mt-auto bg-emerald-50 border border-emerald-100 p-3 rounded-lg flex items-center gap-2">
                                            <Stethoscope className="w-3 h-3 text-emerald-600" />
                                            <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-widest">
                                                Run doctor before starting
                                            </span>
                                        </div>
                                    </div>
                                ) : slides[currentSlide].title === 'AI-Powered Code Generation' ? (
                                    <div className="flex flex-col gap-2 p-4 w-full">
                                        {aiCodeLineWidths.map((width, i) => (
                                            <motion.div
                                                key={width}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.2 * (i + 1) }}
                                                className="h-4 bg-muted rounded-md flex items-center px-2"
                                                style={{ width: `${width}%` }}
                                            >
                                                <div className="w-2 h-2 rounded-full bg-primary mr-2" />
                                                <div className="h-1 bg-muted-foreground/30 rounded-full flex-1" />
                                            </motion.div>
                                        ))}
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 1 }}
                                            className="mt-4 p-3 rounded-lg bg-primary/10 border border-border flex items-center gap-2"
                                        >
                                            <Sparkles className="w-4 h-4 text-primary" />
                                            <span className="text-[10px] text-primary font-bold uppercase tracking-widest">
                                                Generating code...
                                            </span>
                                        </motion.div>
                                    </div>
                                ) : (
                                    <motion.div
                                        initial={{ scale: 0.5, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ delay: 0.2 }}
                                        className="flex flex-col items-center gap-3"
                                    >
                                        <div
                                            className={`p-4 rounded-2xl bg-linear-to-br ${slides[currentSlide].color} shadow-lg shadow-primary/20`}
                                        >
                                            {slides[currentSlide].icon}
                                        </div>
                                        <span className="text-[12px] text-foreground font-bold uppercase tracking-widest">
                                            {slides[currentSlide].title.split(' ')[0]}
                                        </span>
                                    </motion.div>
                                )}
                            </div>
                        </div>
                        <div className="h-3 w-1/2 bg-primary/20 rounded-full" />
                    </motion.div>

                    {/* Decorative Studio Label */}
                    <div className="absolute top-8 right-8 font-extrabold text-xl text-foreground tracking-tighter opacity-10">
                        IGRPStudio.
                    </div>

                    {/* Background shapes */}
                    <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
                    <div className="absolute -top-20 -left-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
                </div>

                {/* Floating Nav Arrows (Mobile/Desktop overlay) */}
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <button
                        type="button"
                        onClick={prevSlide}
                        disabled={currentSlide === 0}
                        className={`p-2 rounded-full bg-card shadow-md border border-border transition-all pointer-events-auto ${currentSlide === 0
                                ? 'opacity-0 scale-50'
                                : 'opacity-100 scale-100 hover:bg-muted'
                            }`}
                    >
                        <ChevronLeft className="w-5 h-5 text-foreground" />
                    </button>
                </div>
            </div>
            <CreateWorkspace
                open={isCreateWorkspaceOpen}
                onOpenChange={setIsCreateWorkspaceOpen}
                onSuccess={() => {
                    setIsCreateWorkspaceOpen(false)
                    goToApplicationsHome()
                }}
            />
            <Doctor open={isDoctorOpen} setOpen={setIsDoctorOpen} />
        </div>
    )
}
