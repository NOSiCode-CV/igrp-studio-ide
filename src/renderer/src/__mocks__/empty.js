// Empty mock to ignore Next.js imports
import React from 'react'

// Mock for next/link
const Link = ({ children, href, ...props }) => {
  return React.createElement('a', { href, ...props }, children)
}

// Mock for next/image
const Image = ({ src, alt, ...props }) => {
  return React.createElement('img', { src, alt, ...props })
}

// Export both default and named exports to handle different import patterns
export default Link
export { Image, Link }

// Also export as named exports for compatibility
export const NextLink = Link
export const NextImage = Image
