import Dexie, { type EntityTable } from 'dexie';

export interface Project {
    id: number;
    name: string;
    createdAt: number; // timestamp
    systemPromptType: 'static' | 'column';
    systemPromptValue: string;
    userPromptTemplate: string;
    modelConfig?: {
        provider: string;
        model: string;
        temperature?: number;
        maxTokens?: number;
    };
}

export interface DataRow {
    id: number;
    projectId: number;
    data: Record<string, any>; // The raw CSV row
    status: 'pending' | 'processing' | 'completed' | 'error' | 'skipped';
    // The actual prompts used for this specific run
    fullUserPrompt?: string;
    fullSystemPrompt?: string;
    response?: string;
    error?: string;
    updatedAt: number;
}

export interface AppSetting {
    id: number; // 1
    activeProvider: string;
    providers: Record<string, {
        baseUrl?: string;
        apiKey?: string;
        model?: string;
        type?: 'openai' | 'google' | 'anthropic'; // standard keys
        headerMap?: Record<string, string>; // for custom headers
    }>;
}

export const db = new Dexie('BatchInferenceDB') as Dexie & {
    projects: EntityTable<Project, 'id'>,
    rows: EntityTable<DataRow, 'id'>,
    settings: EntityTable<AppSetting, 'id'>
};

// Schema declaration:
db.version(1).stores({
    projects: '++id, name, createdAt',
    rows: '++id, projectId, status',
    settings: 'id' // singleton, usually id=1
});
