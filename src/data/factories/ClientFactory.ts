import { faker } from '@faker-js/faker';
import { Client } from '@models';

export class ClientFactory {
  static create(): Client {
    const timestamp = Date.now();

    return {
      clientName: faker.company.name(),
      adminName: faker.person.fullName(),
      adminEmail: `client${timestamp}@yopmail.com`
    };
  }

  static createInvalidEmail(): Client {
    return {
      ...this.create(),
      adminEmail: 'invalid-email'
    };
  }

  static createWithoutClientName(): Client {
    return {
      ...this.create(),
      clientName: ''
    };
  }
}