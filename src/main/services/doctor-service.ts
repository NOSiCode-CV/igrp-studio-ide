import { checkCommand, isVersionValid, parseVersion, runDockerInfoCheck } from "../helpers/doctor/doctor";
import { toolConfig } from "../helpers/doctor/doctor-config";
import { ToolCheck } from "../types";

export const DoctorService = {

    async run(): Promise<ToolCheck[]> {
        const results: ToolCheck[] = [];

        for (const tool of toolConfig) {
            const result = await checkCommand(tool.command);

            let parsedVersion = result.version ? parseVersion(result.version) : undefined;
            let success = !result.error;

            // Version range validation
            if (parsedVersion && tool.versionCheck) {
                success = isVersionValid(parsedVersion, tool.versionCheck.minMajor, tool.versionCheck.maxMajor);
                if (!success) {
                    result.error = `Unsupported version: ${parsedVersion}. Required: ${tool.versionCheck.minMajor}–${tool.versionCheck.maxMajor}`;
                }
            }

            // Extra checks (e.g., Docker daemon)
            if (tool.extraCheck === 'dockerDaemon' && success) {
                const dockerStatus = await runDockerInfoCheck();
                success = dockerStatus.success;
                if (!success) result.error = dockerStatus.error;
            }

            results.push({
                name: tool.name,
                command: tool.command,
                success,
                version: parsedVersion,
                error: success ? undefined : result.error,
                link: tool.link,
                category: tool.category,
                description: tool.description,
                required: tool.required,
            });
        }

        return results;
    }

}