import { runDoctorChecks } from '../helpers/doctor/doctor'
import type { ToolCheck } from '../types'

export const DoctorService = {
    async run(): Promise<ToolCheck[]> {
        return await runDoctorChecks()
    }
}
