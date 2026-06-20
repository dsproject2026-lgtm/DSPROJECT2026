import { facultiesRepository } from '../repositories/faculties.repository.js';
import { AppError } from '../utils/app-error.js';

class FacultiesService {
  async listFaculties() {
    const faculties = await facultiesRepository.findAll();

    return {
      message: 'Faculdades listadas com sucesso.',
      data: faculties,
      count: faculties.length,
    };
  }

  async createFaculty(data: { nome: string; cursos?: string[] | undefined }) {
    const courses = this.normalizeCourses(data.cursos ?? []);
    const faculty = await facultiesRepository.create(data.nome.trim(), courses);

    return {
      message: 'Faculdade criada com sucesso.',
      data: faculty,
    };
  }

  async getFacultyById(id: string) {
    const faculty = await facultiesRepository.findById(id);

    if (!faculty) {
      throw new AppError('Faculdade nao encontrada.', 404, 'FACULTY_NOT_FOUND', { id });
    }

    return {
      message: 'Faculdade encontrada com sucesso.',
      data: faculty,
    };
  }

  async updateFaculty(id: string, data: { nome?: string | undefined }) {
    const faculty = await facultiesRepository.findById(id);

    if (!faculty) {
      throw new AppError('Faculdade nao encontrada.', 404, 'FACULTY_NOT_FOUND', { id });
    }

    const updatedFaculty = await facultiesRepository.update(id, {
      ...(data.nome !== undefined ? { nome: data.nome.trim() } : {}),
    });

    return {
      message: 'Faculdade actualizada com sucesso.',
      data: updatedFaculty,
    };
  }

  async deleteFaculty(id: string) {
    const faculty = await facultiesRepository.findById(id);

    if (!faculty) {
      throw new AppError('Faculdade nao encontrada.', 404, 'FACULTY_NOT_FOUND', { id });
    }

    await facultiesRepository.delete(id);

    return {
      message: 'Faculdade eliminada com sucesso.',
      data: { id, deleted: true },
    };
  }

  async addCourses(faculdadeId: string, cursos: string[]) {
    const faculty = await facultiesRepository.findById(faculdadeId);

    if (!faculty) {
      throw new AppError('Faculdade nao encontrada.', 404, 'FACULTY_NOT_FOUND', { faculdadeId });
    }

    const normalizedCourses = this.normalizeCourses(cursos);

    if (normalizedCourses.length === 0) {
      throw new AppError('Informe pelo menos um curso.', 400, 'COURSES_REQUIRED');
    }

    const updatedFaculty = await facultiesRepository.addCourses(faculdadeId, normalizedCourses);

    return {
      message: 'Cursos adicionados com sucesso.',
      data: updatedFaculty,
    };
  }

  private normalizeCourses(cursos: string[]) {
    return [...new Set(cursos.map((curso) => curso.trim()).filter(Boolean))];
  }
}

export const facultiesService = new FacultiesService();
