import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Database...');

  // 1. Language Seed
  const languages = [
    { name: 'Português', code: 'pt' },
    { name: 'Inglês', code: 'en' },
    { name: 'Espanhol', code: 'es' },
    { name: 'Francês', code: 'fr' },
    { name: 'Alemão', code: 'de' },
    { name: 'Mandarim', code: 'zh' },
    { name: 'Japonês', code: 'ja' },
    { name: 'Coreano', code: 'ko' },
    { name: 'Hebraico', code: 'he' },
    { name: 'Árabe', code: 'ar' },
    { name: 'Russo', code: 'ru' },
    { name: 'Italiano', code: 'it' },
    { name: 'Holandês', code: 'nl' },
    { name: 'Grego', code: 'el' },
    { name: 'Hindi', code: 'hi' },
    { name: 'Bengali', code: 'bn' },
    { name: 'Punjabi', code: 'pa' },
    { name: 'Turco', code: 'tr' },
    { name: 'Tailandês', code: 'th' },
    { name: 'Vietnamita', code: 'vi' },
    { name: 'Suaíli', code: 'sw' },
    { name: 'Urdu', code: 'ur' },
    { name: 'Indonésio', code: 'id' },
    { name: 'Tâmil', code: 'ta' },
    { name: 'Telugu', code: 'te' },
    { name: 'Marati', code: 'mr' },
    { name: 'Persa', code: 'fa' },
    { name: 'Hauçá', code: 'ha' },
    { name: 'Canarim', code: 'kn' },
    { name: 'Gujarati', code: 'gu' }
  ];

  for (const lang of languages) {
    await prisma.language.upsert({
      where: { code: lang.code },
      update: {},
      create: lang,
    });
  }
  console.log('✅ Seeded 30 Languages');

  // 2. Nationality Seed
  const nationalities = [
    { name: 'Brasileira', code: 'BR' },
    { name: 'Americana', code: 'US' },
    { name: 'Canadense', code: 'CA' },
    { name: 'Mexicana', code: 'MX' },
    { name: 'Portuguesa', code: 'PT' },
    { name: 'Espanhola', code: 'ES' },
    { name: 'Francesa', code: 'FR' },
    { name: 'Italiana', code: 'IT' },
    { name: 'Alemã', code: 'DE' },
    { name: 'Britânica', code: 'UK' },
    { name: 'Irlandesa', code: 'IE' },
    { name: 'Japonesa', code: 'JP' },
    { name: 'Chinesa', code: 'CN' },
    { name: 'Sul-Coreana', code: 'KR' },
    { name: 'Indiana', code: 'IN' },
    { name: 'Australiana', code: 'AU' },
    { name: 'Neozelandesa', code: 'NZ' },
    { name: 'Sul-Africana', code: 'ZA' },
    { name: 'Argentina', code: 'AR' },
    { name: 'Chilena', code: 'CL' },
    { name: 'Peruana', code: 'PE' },
    { name: 'Colombiana', code: 'CO' },
    { name: 'Uruguaia', code: 'UY' },
    { name: 'Paraguaia', code: 'PY' },
    { name: 'Russa', code: 'RU' },
    { name: 'Turca', code: 'TR' },
    { name: 'Holandesa', code: 'NL' },
    { name: 'Suíça', code: 'CH' },
    { name: 'Sueca', code: 'SE' },
    { name: 'Angolana', code: 'AO' }
  ];

  for (const nat of nationalities) {
    await prisma.nationality.upsert({
      where: { code: nat.code },
      update: {},
      create: nat,
    });
  }
  console.log('✅ Seeded 30 Nationalities');

  // 3. ExperienceType Seed
  const experienceTypes = [
    { name: 'Missionária', description: 'Atuação direta no campo missionário' },
    { name: 'Profissional', description: 'Experiência no mercado de trabalho secular' },
    { name: 'Ministerial', description: 'Atuação em igreja local (pastorado, louvor, etc)' },
    { name: 'Acadêmica', description: 'Experiência em ensino, pesquisa e universidade' },
    { name: 'Iniciativas', description: 'Projetos independentes ou empreendedorismo' },
    { name: 'Voluntariado', description: 'Ações contínuas de serviço sem remuneração' },
    { name: 'Organização', description: 'Experiência organizacional/administrativa em ONGs ou Agências' }
  ];

  for (const exp of experienceTypes) {
    await prisma.experienceType.upsert({
      where: { name: exp.name },
      update: {},
      create: exp,
    });
  }
  console.log('✅ Seeded Experience Types');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
