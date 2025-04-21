import { Github, GitlabIcon as GitlabLogo, Code } from "lucide-react"

interface PlatformIconProps {
  platform: "github" | "gitlab" | "other"
  className?: string
}

export function PlatformIcon({ platform, className = "h-4 w-4" }: PlatformIconProps) {
  switch (platform) {
    case "github":
      return <Github className={className} />
    case "gitlab":
      return <GitlabLogo className={className} />
    default:
      return <Code className={className} />
  }
}
