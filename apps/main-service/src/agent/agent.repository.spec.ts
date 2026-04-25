import { LanguageProficiency } from '@prisma/client';

import { AgentRepository } from './agent.repository';

describe('AgentRepository', () => {
  function createRepository() {
    const tx = {
      agent: {
        update: jest.fn().mockResolvedValue({ id: 'agent-1' }),
      },
      agentVocationalArea: {
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
        createMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      agentSkill: {
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
        createMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      agentLanguage: {
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
        createMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
    };
    const prisma = {
      $transaction: jest.fn(
        (callback: (transaction: typeof tx) => Promise<unknown>) =>
          callback(tx),
      ),
    };

    return {
      repository: new AgentRepository(prisma as never),
      tx,
    };
  }

  it('does not clear profile relations when relation arrays are omitted', async () => {
    const { repository, tx } = createRepository();

    await repository.updateProfile('agent-1', { phone: '11999999999' });

    expect(tx.agentVocationalArea.deleteMany).not.toHaveBeenCalled();
    expect(tx.agentSkill.deleteMany).not.toHaveBeenCalled();
    expect(tx.agentLanguage.deleteMany).not.toHaveBeenCalled();
    expect(tx.agent.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'agent-1' },
        data: { phone: '11999999999' },
      }),
    );
  });

  it('deduplicates relation payloads before replacing profile relations', async () => {
    const { repository, tx } = createRepository();

    await repository.updateProfile('agent-1', {
      vocationalAreaIds: ['area-1', 'area-1', ' area-2 ', ''],
      skillIds: ['skill-1', 'skill-1'],
      languageRecords: [
        { languageId: 'lang-1', proficiencyLevel: LanguageProficiency.BASIC },
        {
          languageId: ' lang-1 ',
          proficiencyLevel: LanguageProficiency.FLUENT,
        },
        { languageId: '', proficiencyLevel: LanguageProficiency.ADVANCED },
      ],
    });

    expect(tx.agentVocationalArea.createMany).toHaveBeenCalledWith({
      data: [
        { agentId: 'agent-1', vocationalAreaId: 'area-1' },
        { agentId: 'agent-1', vocationalAreaId: 'area-2' },
      ],
    });
    expect(tx.agentSkill.createMany).toHaveBeenCalledWith({
      data: [{ agentId: 'agent-1', skillId: 'skill-1' }],
    });
    expect(tx.agentLanguage.createMany).toHaveBeenCalledWith({
      data: [
        {
          agentId: 'agent-1',
          languageId: 'lang-1',
          proficiencyLevel: LanguageProficiency.FLUENT,
        },
      ],
    });
  });
});
