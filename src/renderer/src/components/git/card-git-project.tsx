import { Repository } from 'src/main/types';
import { Button } from '../ui/button';
import { GitFork } from 'lucide-react';
import { Card } from '../ui/card';

type CardGitProjectProps = {
    repo: Repository;
    handleClone: (repo: Repository) => void;
    isCloning: boolean;
};

export function CardGitProject({
    repo,
    handleClone,
    isCloning,
}: CardGitProjectProps) {
    return (
        <Card
            key={repo.id}
            className="border rounded-lg p-4 hover:shadow-lg transition"
        >
            <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-lg">{repo.name}</h3>
                {repo.private && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                        Private
                    </span>
                )}
            </div>
            <p className="text-gray-600 text-sm mb-4">
                {repo.description || 'No description'}
            </p>
            <div className="flex justify-end space-x-2">
                <div className="mt-4 flex justify-between gap-2 items-center">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(repo.html_url)}
                    >
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
        </Card>
    );
}
