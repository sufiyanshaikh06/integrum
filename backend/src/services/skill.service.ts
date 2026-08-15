import { prisma } from '../config/prisma.js';
import { CreateSkillInput, UpdateSkillInput } from '../schemas/skill.schema.js';
import { ApiError } from '../utils/ApiError.js';

export const skillService = {
  async createSkill(studentProfileId: string, data: CreateSkillInput) {
    return prisma.skill.create({
      data: {
        studentProfileId,
        name: data.name,
        category: data.category,
        proficiencyLevel: data.proficiencyLevel ?? 1,
      },
    });
  },

  async getSkills(studentProfileId: string) {
    return prisma.skill.findMany({
      where: {
        studentProfileId,
      },
      orderBy: [
        { category: 'asc' },
        { proficiencyLevel: 'desc' },
        { name: 'asc' }
      ],
    });
  },

  async getSkillById(studentProfileId: string, skillId: string) {
    const skill = await prisma.skill.findFirst({
      where: {
        id: skillId,
        studentProfileId,
      },
    });

    if (!skill) {
      throw ApiError.notFound('Skill not found or does not belong to you');
    }

    return skill;
  },

  async updateSkill(studentProfileId: string, skillId: string, data: UpdateSkillInput) {
    // Verify ownership via getSkillById to prevent direct update info leakage
    await this.getSkillById(studentProfileId, skillId);

    return prisma.skill.update({
      where: { id: skillId },
      data,
    });
  },

  async deleteSkill(studentProfileId: string, skillId: string) {
    // Verify ownership
    await this.getSkillById(studentProfileId, skillId);

    await prisma.skill.delete({
      where: { id: skillId },
    });
  },
};
