import { faker } from '@faker-js/faker';
import { Project } from 'src/models';

export class ProjectFactory {
  static create(clientName: string): Project {
    return {
      projectName: faker.company.buzzPhrase(),
      description: faker.lorem.paragraph(),
      clientName
    };
  }
}