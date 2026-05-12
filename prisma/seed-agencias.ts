import { PrismaClient, EmpreendimentoType, EmpreendimentoCategory, EmpreendimentoAgentRole } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  const jsonPath = path.resolve(__dirname, 'agencias_extraidas.json');
  console.log(`Reading agencies from: ${jsonPath}`);
  
  if (!fs.existsSync(jsonPath)) {
    console.error(`File not found: ${jsonPath}`);
    process.exit(1);
  }

  const fileContent = fs.readFileSync(jsonPath, 'utf-8');
  const agencias = JSON.parse(fileContent);
  
  console.log(`Found ${agencias.length} agencies to process.`);

  // Find or create a system agent to be the owner
  let systemAgent = await prisma.agent.findFirst({
    where: { email: 'system@globusdei.org' }
  });

  if (!systemAgent) {
    systemAgent = await prisma.agent.create({
      data: {
        name: 'System Admin',
        email: 'system@globusdei.org',
        authSubject: 'system-admin',
      }
    });
    console.log(`Created system agent with ID: ${systemAgent.id}`);
  } else {
    console.log(`Using existing system agent: ${systemAgent.id}`);
  }

  let createdCount = 0;
  let skippedCount = 0;

  for (const item of agencias) {
    // Check if it already exists by name
    const exists = await prisma.empreendimento.findFirst({
      where: { name: item.nome }
    });

    if (exists) {
      console.log(`Skipping existing agency: ${item.nome}`);
      skippedCount++;
      continue;
    }

    const descriptionText = `${item.descricao}\n\nPalavras-chave: ${item['palavras-chave']}`;

    let parsedLinks = [];
    try {
      if (item.links && typeof item.links === 'string') {
        parsedLinks = JSON.parse(item.links);
      }
    } catch (e) {
      console.warn(`Failed to parse links for ${item.nome}: ${item.links}`);
    }

    const socialLinks = {
      website: item.url,
      email: item['contato 1'],
      phone: item['contato 2'],
      social: parsedLinks,
    };

    await prisma.empreendimento.create({
      data: {
        name: item.nome,
        description: descriptionText,
        establishedDate: new Date(),
        type: EmpreendimentoType.AGENCY,
        category: EmpreendimentoCategory.SUPPORT,
        socialLinks: socialLinks,
        receivesInvestments: false,
        ownerId: systemAgent.id,
        agents: {
          create: {
            agentId: systemAgent.id,
            role: EmpreendimentoAgentRole.OWNER
          }
        }
      }
    });

    console.log(`Created agency: ${item.nome}`);
    createdCount++;
  }

  console.log(`Seeding completed. Created: ${createdCount}, Skipped: ${skippedCount}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
