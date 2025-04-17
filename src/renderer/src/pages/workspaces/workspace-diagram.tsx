"use client"

import { useState, useRef, useEffect } from "react"
import { Badge } from "@renderer/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@renderer/components/ui/tooltip"
import { Database, Server, Globe, Code2, Smartphone, Layers } from "lucide-react"
import { IWorkspace, ProjectData } from "src/main/types"
import { getServiceColor } from "./services"

interface ProjectDiagramProps {
  workspace: IWorkspace
}

interface NodePosition {
  id: string
  x: number
  y: number
  width: number
  height: number
  isService?: boolean
}

export function WorkspaceDiagram({ workspace }: ProjectDiagramProps) {
  const [positions, setPositions] = useState<NodePosition[]>([])
  const [highlightedConnection, setHighlightedConnection] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const { projects, connections } = workspace

  // Get services from the workspace or use an empty array if not available
  const services = workspace.services || []

  // Calculate positions for project nodes and service nodes
  useEffect(() => {
    if (!containerRef.current) return

    const containerWidth = containerRef.current.clientWidth
    const containerHeight = 500 // Fixed height for diagram
    const nodeWidth = 160
    const nodeHeight = 80
    const padding = 40
    const verticalSpacing = 120

    // Group projects by type
    const frontendProjects = projects.filter((p) => p.type === "frontend")
    const backendProjects = projects.filter((p) => p.type === "backend")
    const apiProjects = projects.filter((p) => p.type === "api")
    const mobileProjects = projects.filter((p) => p.type === "mobile")
    const databaseProjects = projects.filter((p) => p.type === "database")
    const otherProjects = projects.filter((p) => !["frontend", "backend", "api", "mobile", "database"].includes(p.type))

    // Group services by type
    const databaseServices = services.filter((s) => s.type === "database")
    const cacheServices = services.filter((s) => s.type === "cache")
    const webServices = services.filter((s) => s.type === "web")
    const otherServices = services.filter((s) => !["database", "cache", "web"].includes(s.type))

    const newPositions: NodePosition[] = []

    // Top row - Frontend projects
    const topRowY = padding
    const topRowCount = frontendProjects.length
    frontendProjects.forEach((project, index) => {
      const x = (containerWidth / (topRowCount + 1)) * (index + 1) - nodeWidth / 2
      newPositions.push({ id: project.id, x, y: topRowY, width: nodeWidth, height: nodeHeight })
    })

    // Second row - Backend and API projects
    const secondRowY = topRowY + verticalSpacing
    const secondRowProjects = [...backendProjects, ...apiProjects]
    const secondRowCount = secondRowProjects.length
    secondRowProjects.forEach((project, index) => {
      const x = (containerWidth / (secondRowCount + 1)) * (index + 1) - nodeWidth / 2
      newPositions.push({ id: project.id, x, y: secondRowY, width: nodeWidth, height: nodeHeight })
    })

    // Third row - Mobile and other projects
    const thirdRowY = secondRowY + verticalSpacing
    const thirdRowProjects = [...mobileProjects, ...otherProjects]
    const thirdRowCount = thirdRowProjects.length
    thirdRowProjects.forEach((project, index) => {
      const x = (containerWidth / (thirdRowCount + 1)) * (index + 1) - nodeWidth / 2
      newPositions.push({ id: project.id, x, y: thirdRowY, width: nodeWidth, height: nodeHeight })
    })

    // Bottom row - Database projects and services
    const bottomRowY = thirdRowY + verticalSpacing
    const bottomRowItems = [...databaseProjects, ...databaseServices]
    const bottomRowCount = bottomRowItems.length
    bottomRowItems.forEach((item, index) => {
      const x = (containerWidth / (bottomRowCount + 1)) * (index + 1) - nodeWidth / 2
      const isService = "image" in item // Check if it's a service
      newPositions.push({
        id: item.id,
        x,
        y: bottomRowY,
        width: nodeWidth,
        height: nodeHeight,
        isService,
      })
    })

    // Side positions for other services
    // Left side - Web services
    webServices.forEach((service, index) => {
      const y = secondRowY + index * (nodeHeight + 20)
      newPositions.push({
        id: service.id,
        x: padding,
        y,
        width: nodeWidth,
        height: nodeHeight,
        isService: true,
      })
    })

    // Right side - Cache and other services
    const rightSideServices = [...cacheServices, ...otherServices]
    rightSideServices.forEach((service, index) => {
      const y = secondRowY + index * (nodeHeight + 20)
      newPositions.push({
        id: service.id,
        x: containerWidth - nodeWidth - padding,
        y,
        width: nodeWidth,
        height: nodeHeight,
        isService: true,
      })
    })

    setPositions(newPositions)
  }, [projects, services, containerRef])

  // Get position for a node
  const getPosition = (nodeId: string) => {
    return positions.find((pos) => pos.id === nodeId)
  }

  // Calculate connection path with a simpler, more direct approach
  const getConnectionPath = (sourceId: string, targetId: string) => {
    const sourcePos = getPosition(sourceId)
    const targetPos = getPosition(targetId)

    if (!sourcePos || !targetPos) return ""

    const sourceX = sourcePos.x + sourcePos.width / 2
    const sourceY = sourcePos.y + sourcePos.height / 2
    const targetX = targetPos.x + targetPos.width / 2
    const targetY = targetPos.y + targetPos.height / 2

    // Calculate control points for a smoother curve
    const midY = (sourceY + targetY) / 2

    return `M${sourceX},${sourceY} C${sourceX},${midY} ${targetX},${midY} ${targetX},${targetY}`
  }

  // Find project by ID
  const getProject = (id: string): ProjectData | undefined => {
    return projects.find((p) => p.id === id)
  }

  // Find service by ID
  const getService = (id: string): any | undefined => {
    return services.find((s) => s.id === id)
  }

  // Get service icon
  const getServiceIcon = (type: string) => {
    switch (type) {
      case "database":
        return <Database className="h-4 w-4" />
      case "web":
        return <Globe className="h-4 w-4" />
      case "cache":
        return <Server className="h-4 w-4" />
      default:
        return <Layers className="h-4 w-4" />
    }
  }

  // Get project icon
  const getProjectIcon = (type: string) => {
    switch (type) {
      case "frontend":
        return <Code2 className="h-4 w-4" />
      case "mobile":
        return <Smartphone className="h-4 w-4" />
      case "database":
        return <Database className="h-4 w-4" />
      case "api":
        return <Globe className="h-4 w-4" />
      case "backend":
        return <Server className="h-4 w-4" />
      default:
        return <Layers className="h-4 w-4" />
    }
  }

  return (
    <div className="border rounded-md p-4 bg-muted/10 overflow-hidden" style={{ height: "600px" }}>
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm font-medium">Architecture Diagram</div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-xs">Frontend</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-xs">Backend</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
              <span className="text-xs">Database</span>
            </div>
          </div>
          <div className="h-4 w-px bg-border"></div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full border-2 border-primary"></div>
            <span className="text-xs">Projects</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm border-2 border-primary"></div>
            <span className="text-xs">Services</span>
          </div>
        </div>
      </div>

      <div ref={containerRef} className="relative w-full h-full">
        {/* SVG for connections */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="hsl(var(--primary))" />
            </marker>
            <marker id="arrowhead-highlight" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="hsl(var(--primary))" />
            </marker>
          </defs>

          {/* Connection lines */}
          {connections && connections.map((connection) => {
            const path = getConnectionPath(connection.sourceId, connection.targetId)
            const isHighlighted = highlightedConnection === connection.id

            return (
              <g
                key={connection.id}
                onMouseEnter={() => setHighlightedConnection(connection.id)}
                onMouseLeave={() => setHighlightedConnection(null)}
              >
                <path
                  d={path}
                  fill="none"
                  className={isHighlighted ? "connection-line-highlight" : "connection-line"}
                />

                {/* Connection label */}
                {isHighlighted && (
                  <foreignObject
                    x={
                      (getPosition(connection.sourceId)?.x || 0) +
                      ((getPosition(connection.targetId)?.x || 0) - (getPosition(connection.sourceId)?.x || 0)) / 2 -
                      30
                    }
                    y={
                      (getPosition(connection.sourceId)?.y || 0) +
                      ((getPosition(connection.targetId)?.y || 0) - (getPosition(connection.sourceId)?.y || 0)) / 2 -
                      10
                    }
                    width="60"
                    height="20"
                    className="pointer-events-none"
                  >
                    <div className="flex justify-center">
                      <Badge className={`${getConnectionTypeColor(connection.type)} text-white text-[10px] h-4 px-1.5`}>
                        {connection.type}
                      </Badge>
                    </div>
                  </foreignObject>
                )}
              </g>
            )
          })}
        </svg>

        {/* Project and service nodes */}
        <TooltipProvider>
          {positions.map((position) => {
            const project = getProject(position.id)
            const service = position.isService ? getService(position.id) : null

            if (!project && !service) return null

            if (position.isService && service) {
              // Render service node
              return (
                <Tooltip key={position.id}>
                  <TooltipTrigger asChild>
                    <div
                      className="absolute project-node cursor-pointer"
                      style={{
                        left: `${position.x}px`,
                        top: `${position.y}px`,
                        width: `${position.width}px`,
                        height: `${position.height}px`,
                      }}
                      onClick={() => handleServiceClick(service)}
                    >
                      <div className="border-2 border-primary rounded-sm h-full bg-card hover:border-primary p-2">
                        <div className="flex items-center gap-1 mb-1">
                          <div className={`${getServiceColor(service.type)} rounded-sm p-1 text-white`}>
                            {getServiceIcon(service.type)}
                          </div>
                          <h3 className="text-xs font-medium truncate">{service.name}</h3>
                        </div>
                        <p className="text-[10px] text-muted-foreground line-clamp-2 mb-1">{service.description}</p>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-[10px] h-4 px-1 capitalize">
                            {service.type}
                          </Badge>
                          <Badge
                            variant={service.status === "running" ? "default" : "secondary"}
                            className="text-[10px] h-4 px-1"
                          >
                            {service.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs p-2">
                    <div className="space-y-1">
                      <p className="font-medium">{service.name}</p>
                      <p className="text-[10px]">{service.description}</p>
                      <p className="text-[10px] font-mono">{service.image}</p>
                      <div className="flex gap-1 pt-1">
                        <Badge variant="outline" className="text-[10px] h-4 px-1 capitalize">
                          {service.type}
                        </Badge>
                        {service.ports &&
                          service.ports.map((port: string, i: number) => (
                            <Badge key={i} variant="outline" className="text-[10px] h-4 px-1 font-mono">
                              {port}
                            </Badge>
                          ))}
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              )
            } else if (project) {
              // Render project node
              return (
                <Tooltip key={position.id}>
                  <TooltipTrigger asChild>
                    <div
                      className="absolute project-node cursor-pointer"
                      style={{
                        left: `${position.x}px`,
                        top: `${position.y}px`,
                        width: `${position.width}px`,
                        height: `${position.height}px`,
                      }}
                      onClick={() => handleProjectClick(project)}
                    >
                      <div className="border-2 border-primary rounded-md h-full bg-card hover:border-primary p-2">
                        <div className="flex items-center gap-1 mb-1">
                          <div className={`${getProjectIcon(project.type)} rounded-sm p-1 text-white`}>
                            {getProjectIcon(project.type)}
                          </div>
                          <h3 className="text-xs font-medium truncate">{project.name}</h3>
                        </div>
                        <p className="text-[10px] text-muted-foreground line-clamp-2 mb-1">{project.description}</p>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-[10px] h-4 px-1 capitalize">
                            {project.type}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs p-2">
                    <div className="space-y-1">
                      <p className="font-medium">{project.name}</p>
                      <p className="text-[10px]">{project.description}</p>
                      <div className="flex gap-1 pt-1">
                        <Badge variant="outline" className="text-[10px] h-4 px-1 capitalize">
                          {project.type}
                        </Badge>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              )
            }

            return null
          })}
        </TooltipProvider>

        {/* Layer labels */}
        <div className="absolute left-2 top-[40px] text-xs font-medium text-muted-foreground">Frontend Layer</div>
        <div className="absolute left-2 top-[160px] text-xs font-medium text-muted-foreground">Backend Layer</div>
        <div className="absolute left-2 top-[280px] text-xs font-medium text-muted-foreground">Application Layer</div>
        <div className="absolute left-2 top-[400px] text-xs font-medium text-muted-foreground">Data Layer</div>
      </div>
    </div>
  )
}

