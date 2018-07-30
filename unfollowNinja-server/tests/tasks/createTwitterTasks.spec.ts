import { Job } from 'kue';
import CreateTwitterTasks from '../../src/tasks/createTwitterTasks';
import { queueMock, redisMock } from '../utils';

const queue = queueMock();
const redis = redisMock();
const job = new Job('createTwitterTasks');
// @ts-ignore
const task = new CreateTwitterTasks(redis, queue);

const anyString = expect.any(String);

describe('createTwitterTasks task', () => {
    beforeEach(() => {
        queue.inactiveCount.yields(0);
        redis.zrange.withArgs('users:enabled', 0, -1).resolves(['01', '02', '03']);
        redis.zcard.resolves('0');
        redis.hget.withArgs('cachedTwitto:01', 'username').resolves('twitto1');
        redis.hget.withArgs('cachedTwitto:02', 'username').resolves('twitto2');
        redis.hget.withArgs('cachedTwitto:03', 'username').resolves('twitto3');
    });

    test('3 followers & everything cached = 3 tasks', async () => {
        await task.run(job);
        expect(queue.save).toHaveBeenCalledTimes(3);
        expect(queue.create.mock.calls[0][1].userId).toBe('01');
        expect(queue.create.mock.calls[1][1].userId).toBe('02');
        expect(queue.create.mock.calls[2][1].userId).toBe('03');
    });

    test('3 followers & 2 people cached = 5 tasks', async () => {
        redis.zcard.withArgs('followers:not-cached:01').resolves('10');
        redis.zcard.withArgs('followers:not-cached:03').resolves('1');
        await task.run(job);
        expect(queue.save).toHaveBeenCalledTimes(5);
        expect(queue.create).toHaveBeenCalledWith('cacheFollowers', expect.any(Object));
        expect(queue.create).toHaveBeenCalledWith('checkFollowers', expect.any(Object));
    });

    test('too many inactive tasks = no task', async () => {
        queue.inactiveCount.yields(100);
        try {
            await task.run(job);
        } catch (err) {}
        expect(queue.save).toHaveBeenCalledTimes(0);
    });

    afterEach(() => {
        expect(redis.totalWriteCall()).toBe(0);
    });
});