import { app } from 'electron'
import fs from 'fs'
import { readFile, writeFile } from 'fs/promises';
import { PageableProjects, ProjectData } from '../types';
import { IProjectRepository } from '../interfaces';

const filename = app.getPath('userData') + "/rp-settings.json";

async function loadCfg(){
    if (!fs.existsSync(filename)) {
        return { projects: []};
    }
    return JSON.parse(await readFile(filename, "utf8"));
}

async function saveCfg(cfg: any) {
    await writeFile(filename, JSON.stringify(cfg));
}

function nvl(a, b): string {
    return a || b;
}

function newRecentDate(project: ProjectData) {
    return new Date(nvl(project.dt_updated, project.dt_created));
}
export class ProjectRepository implements IProjectRepository {

    async save(project: ProjectData): Promise<ProjectData> {
        const cfg: {projects: Array<ProjectData>} = await loadCfg();

        project.dt_updated = new Date();

        if (!cfg.projects) {
            cfg.projects = [];
        }
        const index = cfg.projects.findIndex(el => el.path === project.path);
        if (index == -1) {
            cfg.projects.push(project);
        } else {
            cfg.projects[index] = {...cfg.projects[index], ...project}
        }
        
        saveCfg(cfg);
        return project;
    }

    async findAllRecent(): Promise<PageableProjects> {
       
        const projects = await this.findAll();
        if (!projects) return {data:[], total: 0};

        const sorted = projects.sort((a, b) => {
            return newRecentDate(b).getTime() - newRecentDate(a).getTime();
        });
        
        return {data: sorted.slice(0, projects.length), total: projects.length} ;
    }

    async findAll(): Promise<Array<ProjectData>> {
        const cfg = await loadCfg();
        return cfg.projects;
    }

    async delete(project: ProjectData, index?: number): Promise<void> {
        const cfg = await loadCfg();
    
        // Verifica se o array de projetos existe
        if (!cfg.projects || cfg.projects.length === 0) {
            throw new Error("No projects available to delete.");
        }
    
        if (index !== undefined) {
            // Remoção pelo índice
            if (index < 0 || index >= cfg.projects.length) {
                throw new Error("Index out of bounds.");
            }
            cfg.projects.splice(index, 1); // Remove o projeto pelo índice
        } else {
            // Remoção pelo caminho do projeto
            const projectIndex = cfg.projects.findIndex((p) => p.path === project.path);
            if (projectIndex === -1) {
                throw new Error("Project not found.");
            }
            cfg.projects.splice(projectIndex, 1); // Remove o projeto pelo caminho
        }
    
        await saveCfg(cfg); // Salva a configuração atualizada
    }
}