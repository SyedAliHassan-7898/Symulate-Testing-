import { faker } from '@faker-js/faker';
import { Candidate } from 'src/models';

export class CandidateFactory {
  static create(): Candidate {
    const first = faker.person.firstName();
    const last = faker.person.lastName();

    return {
      firstName: first,
      lastName: last,
      email: `${first.toLowerCase()}.${last.toLowerCase()}.${Date.now()}@yopmail.com`
    };
  }
}