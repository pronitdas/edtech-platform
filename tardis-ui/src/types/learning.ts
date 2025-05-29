import { Point } from "./geometry";

export interface Concept {
    id: string;
    title: string;
    content: string;
    formula?: string;
    demoPoints?: Point[];
    illustration?: string;
    examples?: ConceptExample[];
}

export interface ConceptExample {
    id: string;
    description: string;
    formula?: string;
}