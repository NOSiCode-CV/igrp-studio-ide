import { useTranslation } from 'react-i18next'
import { Button } from '@renderer/components/ui/button'
import { FolderOpen, GitFork } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import useToast from '@renderer/components/useToast'
import { navigateToNextPage, setBasePath, setConfig } from '@renderer/redux/thunks'
import { CreateProject } from './components/new-project-dialog'
import RecentsProjects from './components/recents-projects'
import { PageHeader } from '@igrp/igrp-design-system'
import { useEffect, useState } from 'react'
import { Repository } from 'src/main/types'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@renderer/components/ui/dialog'

const ProjectNameDialog = ({ isOpen, onClose, defaultName, onConfirm }) => {
  const [projectName, setProjectName] = useState(defaultName);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enter Project Name</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            placeholder="Project name"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={() => onConfirm(projectName)}
            disabled={!projectName.trim()}
          >
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};


const IDEInitialScreen = (): JSX.Element => {
  const { t } = useTranslation()
  
  const [isLoading, setIsLoading] = useState(false);
  const [scanProgress, setScanProgress] = useState({ progress: 0, total: 0 });
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [isCloning, setIsCloning] = useState(false);
  
  const [nameDialog, setNameDialog] = useState({
    isOpen: false,
    defaultName: '',
    onConfirm: (name: string) => {}
  });

  const [, setUser] = useState<any>(null);
  const navigate = useNavigate()

  const dispatch: any = useDispatch()

  const { showErrorToast, showSuccessToast } = useToast()

  const onHandleOpenProjectClick = async (): Promise<void> => {
    const result = await window.api.openDirectory('')

    if (result.canceled) {
      return // User canceled the directory selection
    }

    if (!result.folderExists || !result.config?.type) {
      showErrorToast(t('notFoundProject'))
      return
    }

    dispatch(setBasePath(result.basePath))
    dispatch(setConfig(result.config))

    await window.repo.project.save({ config: result.config, path: result.basePath })

    // Navigate to the next page
    navigateToNextPage(navigate, result.config)
  }

  // Carrega dados iniciais
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [userInfo, repos] = await Promise.all([
          window.electron.ipcRenderer.invoke('github-user-info'),
          window.electron.ipcRenderer.invoke('github-repositories')
        ]);
        
        setUser(userInfo);
        setRepositories(repos);
      } catch (error) {
        console.log('Not authenticated yet');
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Handler para nova autenticação
  useEffect(() => {
    window.electron.ipcRenderer.on('github-oauth-success', async (_event, data) => {
      setIsLoading(true);
      try {
        await window.electron.ipcRenderer.invoke('github-initialize', data.access_token);
        
        const [userInfo, repos] = await Promise.all([
          window.electron.ipcRenderer.invoke('github-user-info'),
          window.electron.ipcRenderer.invoke('github-repositories')
        ]);
        
        setUser(userInfo);
        setRepositories(repos);
      } catch (error) {
        console.error('Error loading GitHub data:', error);
      } finally {
        setIsLoading(false);
      }
    });

    return () => {
      window.electron.ipcRenderer.removeAllListeners('github-oauth-success');
    };
  }, []);

  useEffect(() => {
    // Listener para progresso
    window.electron.ipcRenderer.on('repo-scan-progress', (_event, data) => {
      setScanProgress(data);
    });

    return () => {
      window.electron.ipcRenderer.removeAllListeners('repo-scan-progress');
    };
  }, []);

  useEffect(() => {
    window.electron.ipcRenderer.on('clone-progress', (_event, data) => {
      if (data.status === 'success') {
        setIsCloning(false);
        showSuccessToast(`Repository successfully cloned to ${data.path}`);
      } else if (data.status === 'error') {
        setIsCloning(false);
        showErrorToast(`Failed to clone repository: ${data.message}`);
      }
    });

    // Listener para solicitar nome do projeto
    window.electron.ipcRenderer.on('request-project-name', (_event, { defaultName }) => {
      setNameDialog({
        isOpen: true,
        defaultName,
        onConfirm: (name) => {
          window.electron.ipcRenderer.send('project-name-response', name);
          setNameDialog(prev => ({ ...prev, isOpen: false }));
        }
      });
    });

    return () => {
      window.electron.ipcRenderer.removeAllListeners('clone-progress');
      window.electron.ipcRenderer.removeAllListeners('request-project-name');
    };
  }, []);

  const handleClone = async (repo: Repository) => {
    setIsCloning(true);
    try {
      await window.electron.ipcRenderer.invoke('clone-repository', repo.clone_url);
    } catch (error) {
      // showErrorToast(`Failed to clone: ${(error as Error).message}`);
      setIsCloning(false);
    }
  };

  const handleGitHubLogin = () => {
    window.electron.ipcRenderer.send('github-oauth');
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6 mb-10">
      <PageHeader title="Welcome to IGRP Studio">
        <div className="flex justify-end space-x-3 ">
          <CreateProject />
          <Button variant="outline">
            <GitFork className="w-4 h-4 mr-2" />
            {t('Clone Project')}
          </Button>
          <Button variant="outline" onClick={onHandleOpenProjectClick}>
            <FolderOpen className="w-4 h-4 mr-2" />
            {t('Open Project')}
          </Button>
          <Button variant="outline" onClick={handleGitHubLogin}>
            <GitFork className="w-4 h-4 mr-2" />
            {'Connect GitHub'}
          </Button>
        </div>
      </PageHeader>

      {isLoading ? (
        <div className="py-12">
        <div className="w-64 bg-gray-200 rounded-full h-2.5 mb-4">
          <div 
            className="bg-blue-600 h-2.5 rounded-full transition-all"
            style={{ 
              width: `${(scanProgress.progress / scanProgress.total) * 100}%` 
            }}
          />
        </div>
        <p className="text-sm text-gray-600">
          Scanning repositories ({Math.min(scanProgress.progress, scanProgress.total)} of {scanProgress.total})
        </p>
      </div>
      ) : repositories.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {repositories.map(repo => (
            <div key={repo.id} className="border rounded-lg p-4 hover:shadow-lg transition">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-lg">{repo.name}</h3>
                {repo.private && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Private</span>
                )}
              </div>
              <p className="text-gray-600 text-sm mb-4">{repo.description || 'No description'}</p>
              <div className="flex justify-end space-x-2">
                
                <div className="mt-4 flex justify-between gap-2 items-center">
                <Button size="sm" variant="outline" onClick={() => window.open(repo.html_url)}>
                  View
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleClone(repo)}
                  disabled={isCloning}
                >
                  <GitFork className="w-4 h-4 mr-2" />
                  {isCloning ? 'Cloning...' : 'Clone'}
                </Button>
              </div>
              
              </div>
            </div>
          ))}
        </div>
      ) : (
        <RecentsProjects />
      )}

      <RecentsProjects />

      <ProjectNameDialog
        isOpen={nameDialog.isOpen}
        defaultName={nameDialog.defaultName}
        onClose={() => setNameDialog(prev => ({ ...prev, isOpen: false }))}
        onConfirm={nameDialog.onConfirm}
      />
    </div>
  )
}

export default IDEInitialScreen
