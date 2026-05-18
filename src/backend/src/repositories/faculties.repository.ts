import { prisma } from '../lib/prisma.js';

const facultySelect = {
  id: true,
  nome: true,
  cursos: {
    select: {
      id: true,
      nome: true,
      faculdadeId: true,
    },
    orderBy: {
      nome: 'asc',
    },
  },
} as const;

class FacultiesRepository {
  async findAll() {
    return prisma.faculdade.findMany({
      select: facultySelect,
      orderBy: {
        nome: 'asc',
      },
    });
  }

  async findById(id: string) {
    return prisma.faculdade.findUnique({
      where: { id },
      select: facultySelect,
    });
  }

  async create(nome: string, cursos: string[]) {
    return prisma.faculdade.create({
      data: {
        nome,
        cursos: {
          create: cursos.map((curso) => ({ nome: curso })),
        },
      },
      select: facultySelect,
    });
  }

  async addCourses(faculdadeId: string, cursos: string[]) {
    await prisma.curso.createMany({
      data: cursos.map((curso) => ({
        faculdadeId,
        nome: curso,
      })),
      skipDuplicates: true,
    });

    return this.findById(faculdadeId);
  }
}

export const facultiesRepository = new FacultiesRepository();
