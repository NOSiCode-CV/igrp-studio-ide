import { app } from 'electron'
import fs from 'fs'
import { readFile, writeFile } from 'fs/promises';
import { Project, Page, PageableProjects, IProjectRepository  } from '../../types'


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

function newRecentDate(project: Project) {
    return new Date(nvl(project.dt_updated, project.dt_created));
}
export class ProjectRepository implements IProjectRepository {

    async save(project: Project): Promise<Project> {
        const cfg: {projects: Array<Project>} = await loadCfg();

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

    async findAllRecent(page: Page): Promise<PageableProjects> {
        if (page.page < 1) {
            throw new Error("'page' must be greater than or equal to 1");
        }

        if (page.size < 1) {
            throw new Error("'size' must be greater than or equal to 1");
        }

        const start = (page.page-1) * page.size;
        let end = start + page.size;

        const projects = await this.findAll();
        if (!projects) return {data:[], total: 0};

        if (start >= projects.length) return {data:[], total: projects.length};
        if (end > projects.length) {
            end = projects.length;
        }
        
        const sorted = projects.sort((a, b) => {
            return newRecentDate(b).getTime() - newRecentDate(a).getTime();
        });
        
        return {data: sorted.slice(start, end), total: projects.length} ;
    }

    async findAll(): Promise<Array<Project>> {
        const cfg = await loadCfg();
        return cfg.projects;
    }
}