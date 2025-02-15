import { TypedServiceBroker } from '../index';
import {
  ServiceAction,
  ServiceEvent,
  ServiceName
} from './services/typed.service.types';
import typedService from './services/typed.service';

describe('typed service', () => {
  const broker: TypedServiceBroker<
    ServiceAction,
    ServiceEvent,
    ServiceName,
    {
      auth: {
        userId: string;
        clientId: string;
        roles: string[];
      };
    }
  > = new TypedServiceBroker({ logLevel: 'fatal' });
  const sampleService = broker.createService(typedService);

  beforeAll(async () => {
    await broker.start();
    await broker.waitForServices('typedService');
  });

  afterAll(async () => {
    broker.destroyService(sampleService);
    await broker.stop();
  });

  // test actions
  describe('Testing actions', () => {
    it('Action without parameter', async () => {
      const response: string = await broker.call('typedService.hello');
      expect(response).toBe('Hello World null!');
    });

    it('Action without parameter, but with calling options', async () => {
      const response: string = await broker.call(
        'typedService.hello',
        undefined,
        {
          caller: 'test'
        }
      );
      expect(response).toBe('Hello World test!');
    });

    it('Action with required parameter', async () => {
      const response: string = await broker.call(
        'typedService.welcome',
        {
          name: 'John Doe'
        },
        {
          meta: {
            auth: {
              userId: 'abcd',
              clientId: 'efgh',
              roles: ['admin']
            }
          }
        }
      );
      expect(response).toBe('Welcome John Doe!');
    });

    it('Action with optional parameter missing', async () => {
      const response: string = await broker.call('typedService.boo', {
        foo: 'Foo'
      });
      expect(response).toBe('Welcome Foo!');
    });

    it('Action with optional parameter included', async () => {
      const response: string = await broker.call('typedService.boo', {
        foo: 'Foo',
        bar: 'Bar'
      });
      expect(response).toBe('Welcome Foo Bar!');
    });
  });

  // test events
  describe('Testing events', () => {
    beforeAll(() => {
      sampleService.event1TestReturn = jest.fn();
      sampleService.event2TestReturn = jest.fn();
    });
    afterAll(() => {
      sampleService.event1TestReturn.mockRestore();
      sampleService.event2TestReturn.mockRestore();
    });

    it('Event1 without payload', () => {
      broker.emit('typedService.event1', undefined, 'typedService');
      expect(sampleService.event1TestReturn).toBeCalledTimes(1);
    });

    it('Event1 with payload', () => {
      // We use emitlocalEventHandler because our typed broker won't allow us to send bad payloads :-)
      sampleService.emitLocalEventHandler(
        'typedService.event1',
        { foo: 'bar' },
        'typedService'
      );
      expect(sampleService.event1TestReturn).toBeCalledTimes(1);
    });

    it('Event2 with good payload', () => {
      broker.emit('typedService.event2', { id: '1234' }, 'typedService');
      expect(sampleService.event2TestReturn).toBeCalledTimes(1);
    });

    it('Event2 with bad payload', () => {
      // We use emitlocalEventHandler because our typed broker won't allow us to send bad payloads :-)
      sampleService.emitLocalEventHandler(
        'typedService.event2',
        { id: 1234 },
        'typedService'
      );
      expect(sampleService.event2TestReturn).toBeCalledTimes(1);
    });
  });
});
