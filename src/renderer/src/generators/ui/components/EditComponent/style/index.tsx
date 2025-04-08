import React from 'react';
import {
    ChevronDown,
    Type,
    Box,
    Layout,
    Palette,
    Move,
    Layers,
    Settings2,
    Square,
    Variable,
} from 'lucide-react';
import { LayoutSection } from './components/LayoutSection';
import { SpacingSection } from './components/SpacingSection';
import { SizeSection } from './components/SizeSection';
import { TypographySection } from './components/TypographySection';
import { BackgroundsSection } from './components/BackgroundsSection';
import { BordersSection } from './components/BordersSection';
import { PositionSection } from './components/PositionSection';
import { EffectsSection } from './components/EffectsSection';
import { CustomPropertiesSection } from './components/CustomPropertiesSection';

interface StyleSection {
    id: string;
    title: string;
    icon: React.ReactNode;
    isOpen: boolean;
    component: React.ComponentType;
}

export function StyleTab() {
    const [sections, setSections] = React.useState<StyleSection[]>([
        {
            id: 'layout',
            title: 'Layout',
            icon: <Layout size={12} />,
            isOpen: true,
            component: LayoutSection,
        },
        {
            id: 'spacing',
            title: 'Spacing',
            icon: <Move size={12} />,
            isOpen: false,
            component: SpacingSection,
        },
        {
            id: 'size',
            title: 'Size',
            icon: <Box size={12} />,
            isOpen: false,
            component: SizeSection,
        },
        {
            id: 'typography',
            title: 'Typography',
            icon: <Type size={12} />,
            isOpen: false,
            component: TypographySection,
        },
        {
            id: 'backgrounds',
            title: 'Backgrounds',
            icon: <Palette size={12} />,
            isOpen: false,
            component: BackgroundsSection,
        },
        {
            id: 'borders',
            title: 'Borders',
            icon: <Square size={12} />,
            isOpen: false,
            component: BordersSection,
        },
        {
            id: 'position',
            title: 'Position',
            icon: <Layers size={12} />,
            isOpen: false,
            component: PositionSection,
        },
        {
            id: 'effects',
            title: 'Effects',
            icon: <Settings2 size={12} />,
            isOpen: false,
            component: EffectsSection,
        },
        {
            id: 'custom-properties',
            title: 'Custom Properties',
            icon: <Variable size={12} />,
            isOpen: false,
            component: CustomPropertiesSection,
        },
    ]);

    const toggleSection = (sectionId: string) => {
        setSections(
            sections.map((section) =>
                section.id === sectionId
                    ? { ...section, isOpen: !section.isOpen }
                    : section
            )
        );
    };

    return (
        <div className="p-1.5">
            {sections.map((section) => (
                <div key={section.id} className="mb-0.5">
                    <button
                        onClick={() => toggleSection(section.id)}
                        className="w-full flex items-center justify-between p-1.5 text-[11px] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-md transition-colors"
                    >
                        <div className="flex items-center gap-1.5">
                            {section.icon}
                            <span>{section.title}</span>
                        </div>
                        <ChevronDown
                            size={12}
                            className={`transform transition-transform ${
                                section.isOpen ? 'rotate-180' : ''
                            }`}
                        />
                    </button>

                    {section.isOpen && (
                        <div className="mt-0.5 p-1.5 bg-gray-50 dark:bg-gray-800/50 rounded-md">
                            <section.component />
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
