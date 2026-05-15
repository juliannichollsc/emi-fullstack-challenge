// Task 7 — stateService HTTP tests using axios-mock-adapter.
import MockAdapter from 'axios-mock-adapter';
import { httpClient } from '@shared/utils/httpClient';
import { stateService } from '@features/states/services/stateService';
import type { TaskState } from '@features/states/types/state.types';

let mock: MockAdapter;

beforeEach(() => {
  mock = new MockAdapter(httpClient, { onNoMatch: 'throwException' });
});

afterEach(() => {
  mock.reset();
  mock.restore();
});

const stateFixture: TaskState = { name: 'active' };

describe('stateService.list', () => {
  it('returns an array of task states on 200', async () => {
    mock.onGet('/states').reply(200, [stateFixture, { name: 'closed' }]);
    const result = await stateService.list();
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('active');
  });

  it('throws HttpError with status 500 on server error', async () => {
    mock.onGet('/states').reply(500);
    await expect(stateService.list()).rejects.toMatchObject({ status: 500 });
  });

  it('throws HttpError with status 404 when resource not found', async () => {
    mock.onGet('/states').reply(404);
    await expect(stateService.list()).rejects.toMatchObject({ status: 404 });
  });
});

describe('stateService.create', () => {
  it('POSTs payload and returns created state', async () => {
    mock.onPost('/states').reply(201, { name: 'blocked' });
    const result = await stateService.create({ name: 'blocked' });
    expect(result.name).toBe('blocked');
    const body = JSON.parse(mock.history.post[0].data as string);
    expect(body).toEqual({ name: 'blocked' });
  });

  it('throws HttpError on 4xx response', async () => {
    mock.onPost('/states').reply(422, { message: 'Validation error' });
    await expect(stateService.create({ name: '' })).rejects.toMatchObject({ status: 422 });
  });
});

describe('stateService.remove', () => {
  it('sends DELETE request to /states/:name and resolves to undefined', async () => {
    mock.onDelete('/states/active').reply(204);
    const result = await stateService.remove('active');
    expect(result).toBeUndefined();
  });

  it('throws HttpError on 500', async () => {
    mock.onDelete('/states/active').reply(500);
    await expect(stateService.remove('active')).rejects.toMatchObject({ status: 500 });
  });

  it('throws HttpError on 404 when state does not exist', async () => {
    mock.onDelete('/states/nonexistent').reply(404);
    await expect(stateService.remove('nonexistent')).rejects.toMatchObject({ status: 404 });
  });
});
