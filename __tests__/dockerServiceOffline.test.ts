import { DockerService } from '../src/main/services/docker-service'

describe('DockerService offline status handling', () => {
    it('short-circuits compose inspection when the daemon is unavailable', async () => {
        const service = new DockerService()
        const daemonCheck = jest
            .spyOn(service, 'checkDockerDaemon')
            .mockResolvedValue({
                isRunning: false,
                error: 'Docker daemon is not running'
            })

        await expect(service.status('C:/workspace-without-compose')).resolves.toEqual([])
        expect(daemonCheck).toHaveBeenCalledTimes(1)
    })
})
