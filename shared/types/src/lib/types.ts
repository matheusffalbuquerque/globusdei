/**
 * Base user interface representing a person interacting with the system.
 */
export interface User {
  id: string;
  name: string;
  email: string;
  /** Roles mapped directly from Keycloak (e.g., 'administrador', 'colaborador', 'agente') */
  roles: string[];
}

/**
 * Interface representing an Agent in the system.
 * Agents are individuals such as missionaries, students, or professionals 
 * who are registered to receive support or participate in initiatives.
 */
export interface Agent extends User {
  /** Determines if the agent is currently active in the field */
  isActive: boolean;
}

/**
 * Interface representing an Empreendimento (Initiative) in the system.
 * Empreendimentos are initiatives, projects, or organizations representing a collective goal.
 */
export interface Empreendimento {
  id: string;
  name: string;
  
  /** Detailed description of what the initiative does and its goals */
  description: string;
  
  /** Identifiers of the agents that are connected or participate in this initiative */
  agentIds: string[];
  
  /** The date the initiative was established */
  establishedDate: Date;
}
