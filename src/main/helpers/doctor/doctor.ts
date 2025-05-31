import { exec } from 'child_process';

export function checkCommand(command: string): Promise<{ version?: string, error?: string }> {
  return new Promise(resolve => {
    exec(`${command} --version`, (error, stdout, stderr) => {
      if (error) {
        resolve({ error: stderr || error.message });
      } else {
        resolve({ version: stdout.trim() });
      }
    });
  });
}

export function parseVersion(output: string): string {
  const match = output.match(/(\d+\.\d+\.\d+)/);
  return match ? match[1] : output.trim();
}

export function isVersionValid(version: string, min: number, max: number): boolean {
  const major = parseInt(version.split('.')[0], 10);
  return major >= min && major <= max;
}

export async function runDockerInfoCheck() {
  return new Promise<{ success: boolean, error?: string }>((resolve) => {
    exec(`docker info`, (error) => {
      if (error) resolve({ success: false, error: error.message });
      else resolve({ success: true });
    });
  });
}
