// worker.js
const amqp = require('amqplib');

const QUEUE_NAME = 'task_queue';
const MAX_RETRIES = 3;

async function startWorker(workerId) {
    try {
        const connection = await amqp.connect('amqp://localhost');
        const channel = await connection.createChannel();
        
        // Убеждаемся, что очередь существует
        await channel.assertQueue('task_queue', {
        durable: true,
        arguments: {
            'x-message-ttl': 60000,                 // время жизни сообщения
            'x-dead-letter-exchange': 'dlx_exchange',
            'x-dead-letter-routing-key': 'dead'
        }
        });
        
        console.log(`👷 Worker ${workerId} started. Waiting for tasks...`);

        // prefetch(1) — воркер берет только одну задачу за раз, пока не подтвердит выполнение
        channel.prefetch(1);

        channel.consume(QUEUE_NAME, async (msg) => {
            if (!msg) return;
            
            const task = JSON.parse(msg.content.toString());
            const retryCount = msg.properties.headers?.['x-retry-count'] || 0;

            console.log(`[Worker ${workerId}] Received task: ${task.type} (ID: ${task.id}) [Attempt: ${retryCount + 1}]`);

            try {
                // Имитация сложной обработки
                await processTask(task);
                
                // Успех — подтверждаем сообщение
                channel.ack(msg);
                console.log(`[Worker ${workerId}] Task ${task.id} completed.`);
            } catch (err) {
                console.error(`[Worker ${workerId}] Error processing task ${task.id}: ${err.message}`);
                
                if (retryCount < MAX_RETRIES) {
                    // Логика повторной отправки (Retry)
                    const delay = Math.pow(2, retryCount) * 1000; // Экспоненциальная задержка
                    console.log(`[Worker ${workerId}] Retrying task ${task.id} in ${delay}ms...`);
                    
                    setTimeout(() => {
                        channel.nack(msg, false, false); // Отклоняем без возврата в очередь
                        
                        channel.sendToQueue(QUEUE_NAME, msg.content, {
                            persistent: true,
                            headers: { 'x-retry-count': retryCount + 1 }
                        });
                    }, delay);
                } else {
                    // Исчерпаны попытки — сообщение уйдет в DLQ автоматически (благодаря x-dead-letter-exchange)
                    console.log(`[Worker ${workerId}] Task ${task.id} moved to Dead Letter Queue.`);
                    channel.nack(msg, false, false);
                }
            }
        });

    } catch (err) {
        console.error(`❌ Worker ${workerId} failed:`, err);
    }
}

// Функция обработки (имитация)
function processTask(task) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            // Для теста: задача типа "fail" будет падать
            if (task.type === 'fail') {
                reject(new Error('Simulated processing error'));
            } else {
                resolve();
            }
        }, 2000); // 2 секунды работы
    });
}

// Запуск воркера (можно запустить несколько процессов)
const WORKER_ID = process.env.WORKER_ID || 1;
startWorker(WORKER_ID);