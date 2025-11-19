import { AlertCircle } from 'lucide-react'
import { Component, ErrorInfo, ReactNode } from 'react'
import logo from '@renderer/assets/images/igrp-green.svg'
import { ROUTES } from '@renderer/routes/routeConstants'
import { useNavigate } from 'react-router-dom' // Assuming you're using react-router for navigation

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  // Update state if an error is thrown
  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  // Log error details
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Error caught by ErrorBoundary:', error, errorInfo)
  }

  // Function to navigate to another page
  openPage = () => {
    const navigate = useNavigate() // Hook must be used inside a component, so use it here
    navigate(ROUTES.HOME)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-800">
          <div className="text-center p-6 bg-white dark:bg-gray-700 rounded-lg shadow-md max-w-lg">
            <div onClick={this.openPage} className="cursor-pointer flex justify-center mb-4">
              <img src={logo} alt="Logo" className="h-12" />{' '}
              {/* Adjusted size to 16 for better centering */}
            </div>
            <h2 className="text-2xl font-bold text-black dark:text-white">Something went wrong.</h2>
            <p className="text-gray-500 dark:text-gray-300">
              We're working on fixing the issue. Please try again later.
            </p>
            <AlertCircle className="text-red-500 mt-4 mx-auto w-16 h-16" />
          </div>
        </div>
      )
    }

    // Render children if no error
    return this.props.children
  }
}

export default ErrorBoundary
