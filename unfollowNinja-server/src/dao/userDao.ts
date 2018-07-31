import * as Redis from 'ioredis';
import {flatMap, fromPairs} from 'lodash';
import * as Twit from 'twit';
import {IUnfollowerInfo} from '../utils/types';
import {twitterSnowflakeToTime} from '../utils/utils';
import { UserCategory } from './dao';

export default class UserDao {
    private readonly redis: Redis.Redis;
    private readonly userId: string;

    constructor(userId: string, redis = new Redis()) {
        this.redis = redis;
        this.userId = userId;
    }

    public disconnect() {
        return this.redis.disconnect();
    }

    public async setCategory(category: UserCategory): Promise<void> {
        await this.redis.zadd('users', category.toString(), this.userId);
    }

    // get the minimum timestamp required to do the next followers check
    // e.g if there are not enough requests left, it's twitter's next reset time
    // e.g if a check needs 4 requests, it's probably in 3min30 (twitter limit = 15/15min)
    // (default: 0)
    public async getNextCheckTime(): Promise<number> {
        return this.redis.get(`nextCheckTime:${this.userId}`)
            .then((nextCheckTime) => Number(nextCheckTime));
    }

    // see above
    public async setNextCheckTime(nextCheckTime: number|string): Promise<void> {
        await this.redis.set(`nextCheckTime:${this.userId}`, nextCheckTime.toString());
    }

    // get twitter instance with refreshed user's credentials
    public async getTwit(): Promise<Twit> {
        const [ token, tokenSecret ] = await this.redis.hmget(`user:${this.userId}`, 'token', 'tokenSecret');
        return new Twit({
            access_token:         token,
            access_token_secret:  tokenSecret,
            consumer_key:         process.env.CONSUMER_KEY,
            consumer_secret:      process.env.CONSUMER_SECRET,
        });
    }

    // list of follower IDs stored during last checkFollowers (in Twitter's order)
    // return null if there are no IDs
    public async getFollowers(): Promise<string[]> {
        return JSON.parse(await this.redis.get(`followers:${this.userId}`));
    }

    public async updateFollowers(
        followers: string[], // every follower, in Twitter's order
        newFollowers: string[], // followers to add
        unfollowers: string[], // followers to remove
        addedTime: number, // timestamp in ms for new followers
    ): Promise<void> {
        const notCachedDict = fromPairs(newFollowers.map(followerId => [followerId, addedTime.toString()]));
        await Promise.all([
            this.redis.set(`followers:${this.userId}`, JSON.stringify(followers)),
            this.redis.set(`followers:count:${this.userId}`, followers.length.toString()),
            newFollowers.length > 0 && this.redis.hmset(`followers:follow-time::${this.userId}`, notCachedDict),
            unfollowers.length > 0 && this.redis.hdel(`followers:follow-time::${this.userId}`, ...unfollowers),
            unfollowers.length > 0 && this.redis.hdel(`followers:snowflake-ids:${this.userId}`, ...unfollowers),
            unfollowers.length > 0 && this.redis.incrby('total-unfollowers', unfollowers.length),
        ]);
    }

    public async setFollowerSnowflakeId(followerId: string, snowflakeId: string): Promise<void> {
        await Promise.all([
            this.redis.hset(`followers:snowflake-ids:${this.userId}`, followerId, snowflakeId),
            this.redis.hdel(`followers:follow-time:${this.userId}`, followerId),
        ]);
    }

    // get twitter cached snowflakeId (containing the follow timing information)
    // returns null if not cached yet
    public async getFollowerSnowflakeId(followerId: string): Promise<string> {
        return this.redis.hget(`followers:snowflake-ids:${this.userId}`, followerId);
    }

    // get the timestamp (in ms) when the follower followed the user.
    // determined from the cached snowflakeId or from the time it was added in DB
    public async getFollowTime(followerId: string): Promise<number> {
        return twitterSnowflakeToTime(await this.getFollowerSnowflakeId(followerId)) ||
            Number(await this.redis.hget(`followers:follow-time:${this.userId}`, followerId));
    }

    // Add some unfollowers to the list of unfollowers (without removing them from the followers)
    public async addUnfollowers(unfollowersInfo: IUnfollowerInfo[]) {
        await this.redis.lpush(`unfollowers:${this.userId}`, ...unfollowersInfo.map(info => JSON.stringify(info)));
    }

    // return true if some followers were never cached by cacheFollowers
    public async getHasNotCachedFollowers(): Promise<boolean> {
        const nbCached = Number(await this.redis.hlen(`followers:snowflake-ids:${this.userId}`));
        const nbFollowers = Number(await this.redis.get(`followers:count:${this.userId}`));
        return nbCached < nbFollowers;
    }

    public async addFollowTimes(notCachedFollowers: Array<{followTime: string, id: string}>): Promise<void> {
        const notCachedDict = fromPairs(notCachedFollowers.map(f => [f.followTime, f.id]));
        await this.redis.hmset(`followers:follow-time:${this.userId}`, notCachedDict);
    }

    public async getCachedFollowers(): Promise<string[]> {
        return this.redis.hkeys(`followers:snowflake-ids:${this.userId}`);
    }
}