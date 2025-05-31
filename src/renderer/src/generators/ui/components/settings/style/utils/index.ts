import { StyleComponent } from "../types";
import { backgroundsStyleToClasses } from "./backgroundsStyleToClasses";
import { bordersStyleToClasses } from "./bordersStyleToClasses";
import { layoutStyleToClasses } from "./layoutStyleToClasses";
import { positionStyleToClasses } from "./positionStyleToClasses";
import { sizeStyleToClasses } from "./sizeStyleToClasses";
import { spacingToClasses } from "./spacingToClasses";
import { typographyStyleToClasses } from "./typographyStyleToClasses";

export const generateAllClasses = (style: StyleComponent | undefined) => {
    if (!style) return '';

    const classes: string[] = [];

    if (style.layout) {
        classes.push(layoutStyleToClasses(style.layout));
    }

    if (style.spacing) {
        classes.push(spacingToClasses(style.spacing));
    }

    if (style.size) {
        classes.push(sizeStyleToClasses(style.size));
    }

    if (style.typography) {
        classes.push(typographyStyleToClasses(style.typography));
    }

    if (style.borders) {
        classes.push(bordersStyleToClasses(style.borders));
    }

    if (style.position) {
        classes.push(positionStyleToClasses(style.position));
    }

    if (style.backgrounds) {
        classes.push(backgroundsStyleToClasses(style.backgrounds));
    }

    return classes.filter(Boolean).join(' ');
};