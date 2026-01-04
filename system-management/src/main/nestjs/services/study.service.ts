import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Kafka, Consumer, Producer } from 'kafkajs';
import Redis from 'ioredis';
import { STUDY_CONSTANTS } from '../../constants';
import { llmService } from '../../services/llm';

@Injectable()
export class StudyService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(StudyService.name);
    private kafka: Kafka;
    private consumer: Consumer;
    private producer: Producer;
    private redis: Redis;
    private producerConnected = false;

    constructor() {
        this.kafka = new Kafka({
            clientId: 'meta-note-study-nest',
            brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
        });
        this.consumer = this.kafka.consumer({ groupId: 'study-group-nest' });
        this.producer = this.kafka.producer();
        this.redis = new Redis({
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
            password: process.env.REDIS_PASSWORD,
            lazyConnect: true,
        });

        this.redis.on('error', (err) => {
            this.logger.error(`Redis connection error: ${err.message}`);
        });
    }

    async onModuleInit() {
        this.logger.log('Starting Study Service...');
        try {
            await this.redis.connect().catch(err => this.logger.error(`Redis connect failed: ${err.message}`));

            await this.consumer.connect().catch(err => this.logger.error(`Kafka consumer connect failed: ${err.message}`));
            await this.producer.connect().catch(err => this.logger.error(`Kafka producer connect failed: ${err.message}`));
            this.producerConnected = true;

            await this.consumer.subscribe({ topic: STUDY_CONSTANTS.STUDY_LIST_TOPIC, fromBeginning: true }).catch(err => {
                this.logger.error(`Kafka subscribe failed: ${err.message}`);
            });

            await this.consumer.run({
                eachMessage: async ({ topic, partition, message }) => {
                    const value = message.value?.toString();
                    if (!value) return;

                    try {
                        const task = JSON.parse(value);
                        this.logger.log(`Processing task: ${task.target}`);
                        if (this.producerConnected) {
                            await this.producer.send({
                                topic: STUDY_CONSTANTS.STUDYING_LIST_TOPIC,
                                messages: [{ value }],
                            });
                        }

                        await this.executeTask(task);
                    } catch (err) {
                        this.logger.error('Error processing message:', err);
                        try {
                            await this.redis.lpush(STUDY_CONSTANTS.STUDY_LIST_ERROR_KEY, JSON.stringify({
                                timestamp: Date.now(),
                                error: String(err),
                                message: value,
                            }));
                        } catch (redisErr) {
                            this.logger.error('Failed to log error to Redis');
                        }
                    }
                },
            }).catch(err => this.logger.error(`Kafka consumer run failed: ${err.message}`));
        } catch (err) {
            this.logger.error(`StudyService init failed: ${err}`);
        }
    }

    async onModuleDestroy() {
        try {
            await this.consumer.disconnect();
            await this.producer.disconnect();
            this.redis.disconnect();
        } catch (err) {
            this.logger.error(`StudyService cleanup error: ${err}`);
        }
    }

    async addTask(payload: any) {
        try {
            if (!this.producerConnected) {
                await this.producer.connect();
                this.producerConnected = true;
            }
            await this.producer.send({
                topic: STUDY_CONSTANTS.STUDY_LIST_TOPIC,
                messages: [{ value: JSON.stringify(payload) }],
            });
        } catch (err) {
            this.logger.error(`Failed to add task: ${err}`);
            throw err;
        }
    }

    async checkLimitCount(): Promise<boolean> {
        try {
            const limitCount = parseInt(process.env.STUDY_LIST_LIMIT_COUNT || '10');
            const successCount = await this.redis.get(STUDY_CONSTANTS.STUDY_SUCCESS_COUNT_KEY);
            if (successCount && parseInt(successCount) >= limitCount) {
                return true;
            }
        } catch (err) {
            this.logger.error(`Failed to check limit count: ${err}`);
        }
        return false;
    }

    private async executeTask(task: any) {
        const { target, studyType } = task;

        if (studyType === 'summary') {
            try {
                const limitTimeMinutes = parseInt(process.env.STUDY_LIMIT_TIME || '45');
                const currentTotalTime = await this.redis.get(STUDY_CONSTANTS.STUDY_TIME_KEY);

                if (currentTotalTime && parseInt(currentTotalTime) >= limitTimeMinutes) {
                    this.logger.warn(`Daily study time limit reached (${limitTimeMinutes} min). Skipping task.`);
                    return;
                }

                const prompt = `Please summarize the content of this Bilibili video: ${target}`;

                const startTime = Date.now();
                const result = await llmService.completion(prompt);
                const durationMs = Date.now() - startTime;
                const durationMin = Math.ceil(durationMs / (1000 * 60));

                const summary = typeof result === 'string' ? result : JSON.stringify(result);

                const localProvider = process.env.LOCAL_LLM_PROVIDER;
                if (localProvider) {
                    try {
                        await fetch(`${localProvider}/rag/document/import`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                title: `Summary of ${target}`,
                                source: target,
                                content: summary,
                                contentType: 'videoLink',
                            }),
                        });
                    } catch (err) {
                        this.logger.error('RAG import failed:', err);
                    }
                }

                await this.redis.incr(STUDY_CONSTANTS.STUDY_SUCCESS_COUNT_KEY);
                await this.redis.incrby(STUDY_CONSTANTS.STUDY_TIME_KEY, durationMin);

                for (const key of [STUDY_CONSTANTS.STUDY_SUCCESS_COUNT_KEY, STUDY_CONSTANTS.STUDY_TIME_KEY]) {
                    const ttl = await this.redis.ttl(key);
                    if (ttl < 0) {
                        await this.redis.expire(key, 24 * 60 * 60);
                    }
                }
            } catch (err) {
                this.logger.error(`Task execution failed: ${err}`);
            }
        }
    }
}
