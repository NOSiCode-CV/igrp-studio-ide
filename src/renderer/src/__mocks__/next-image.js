// Mock for next/image
import React from 'react'

const Image = ({ src, alt, ...props }) => {
  return React.createElement('img', { src, alt, ...props })
}

export default Image
