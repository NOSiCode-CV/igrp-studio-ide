import { DatabaseTypes, ProjectStructureStyle } from "@igrp/spring-engine/dist/interfaces/types";

export interface BaseApiConfig {
    type: 'baseApi' | 'dotnet';
    apiName: string;
    group: string;
    artifact: string;
    database: DatabaseTypes;
    description?: string;
    package?: string;
    projectStructureStyle: ProjectStructureStyle;
    name?: string;
    enableObservability: boolean;
    igrpCoreVersion: string;
}
