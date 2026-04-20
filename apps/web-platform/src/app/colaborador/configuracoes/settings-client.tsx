'use client';

import { useState, type ChangeEvent } from 'react';
import { useSession } from 'next-auth/react';
import { apiFetch } from '../../../lib/api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Plus, Trash2 } from 'lucide-react';

interface DictionaryItem {
  id: string;
  name: string;
  description?: string;
}

interface SettingsClientProps {
  initialSkills: DictionaryItem[];
  initialVocationalAreas: DictionaryItem[];
  initialExperienceTypes: DictionaryItem[];
}

export function SettingsClient({ initialSkills, initialVocationalAreas, initialExperienceTypes }: SettingsClientProps) {
  const { data: session } = useSession();
  
  const [skills, setSkills] = useState<DictionaryItem[]>(initialSkills || []);
  const [vocationalAreas, setVocationalAreas] = useState<DictionaryItem[]>(initialVocationalAreas || []);
  const [experienceTypes, setExperienceTypes] = useState<DictionaryItem[]>(initialExperienceTypes || []);

  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const handleCreate = async (endpoint: string, stateSetter: React.Dispatch<React.SetStateAction<DictionaryItem[]>>, currentList: DictionaryItem[]) => {
    if (!newName) return;
    try {
      const added = await apiFetch(`/system-config/${endpoint}`, {
        method: 'POST',
        session,
        body: { name: newName, description: newDesc },
      });
      stateSetter([...currentList, added]);
      setNewName('');
      setNewDesc('');
    } catch (e) {
      alert('Erro ao criar: ' + (e as Error).message);
    }
  };

  const handleDelete = async (endpoint: string, id: string, stateSetter: React.Dispatch<React.SetStateAction<DictionaryItem[]>>, currentList: DictionaryItem[]) => {
    if (!confirm('Deseja realmente remover? Pode quebrar dados vinculados.')) return;
    try {
      await apiFetch(`/system-config/${endpoint}/${id}`, {
        method: 'DELETE',
        session,
      });
      stateSetter(currentList.filter(item => item.id !== id));
    } catch (e) {
      alert('Erro ao remover: ' + (e as Error).message);
    }
  };

  const renderDictionaryTab = (
    title: string, 
    description: string, 
    items: DictionaryItem[], 
    setter: React.Dispatch<React.SetStateAction<DictionaryItem[]>>, 
    endpoint: string
  ) => (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 items-center">
          <Input 
            placeholder="Nome (ex: Liderança, Saúde)" 
            value={newName} 
            onChange={(e: ChangeEvent<HTMLInputElement>) => setNewName(e.target.value)} 
          />
          <Input 
            placeholder="Descrição (opcional)" 
            value={newDesc} 
            onChange={(e: ChangeEvent<HTMLInputElement>) => setNewDesc(e.target.value)} 
          />
          <Button onClick={() => handleCreate(endpoint, setter, items)}>
            <Plus className="w-4 h-4 mr-2" /> Adicionar
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map(item => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>{item.description || '-'}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(endpoint, item.id, setter, items)}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                  Nenhum registro encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  return (
    <Tabs defaultValue="skills" className="space-y-4" onValueChange={(value) => { setNewName(''); setNewDesc(''); }}>
      <TabsList>
        <TabsTrigger value="skills">Habilidades</TabsTrigger>
        <TabsTrigger value="areas">Áreas Vocacionais</TabsTrigger>
        <TabsTrigger value="experiences">Tipos de Experiência</TabsTrigger>
      </TabsList>
      
      <TabsContent value="skills">
        {renderDictionaryTab(
          'Habilidades (Skills)', 
          'Listagem de habilidades que agentes podem adicionar ao seu currículo.', 
          skills, 
          setSkills, 
          'skills'
        )}
      </TabsContent>

      <TabsContent value="areas">
        {renderDictionaryTab(
          'Áreas Vocacionais', 
          'Listagem de frentes de atuação missional e profissional da plataforma.', 
          vocationalAreas, 
          setVocationalAreas, 
          'vocational-areas'
        )}
      </TabsContent>

      <TabsContent value="experiences">
        {renderDictionaryTab(
          'Tipos de Experiência', 
          'Categorias para classificar o histórico e linhas do tempo.', 
          experienceTypes, 
          setExperienceTypes, 
          'experience-types'
        )}
      </TabsContent>
    </Tabs>
  );
}
