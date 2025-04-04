export interface ContainerInfo {
    id: string;
    name: string;
    status: string;
    image?: string;
    ports?: string[];
  }
  
  export interface DockerComposeService {
    image: string;
    ports?: string[];
    volumes?: string[];
    environment?: Record<string, string>;
  }
  
  export interface DockerComposeConfig {
    version: string;
    services: Record<string, DockerComposeService>;
  }