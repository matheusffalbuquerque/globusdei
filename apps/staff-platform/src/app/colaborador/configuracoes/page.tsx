import { getServerSession } from 'next-auth';
import { authOptions } from '../../api/auth/[...nextauth]/route';
import { apiFetch } from '../../../lib/api';
import { SettingsClient } from './settings-client';
import { redirect } from 'next/navigation';

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/login');
  }

  const [skills, vocationalAreas, experienceTypes] = await Promise.all([
    apiFetch('/system-config/skills', { session }),
    apiFetch('/system-config/vocational-areas', { session }),
    apiFetch('/system-config/experience-types', { session }),
  ]);

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Configurações</h2>
      </div>
      <p className="text-muted-foreground">
        Gerencie as listas de opções exibidas nos perfis dos agentes e nos formulários da plataforma.
      </p>
      
      <SettingsClient 
        initialSkills={skills} 
        initialVocationalAreas={vocationalAreas} 
        initialExperienceTypes={experienceTypes} 
      />
    </div>
  );
}
